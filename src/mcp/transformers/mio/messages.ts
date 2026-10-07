import { extractHtmlPreview, toDisplayDate, toIso } from "@common/transformHelpers"
import { MessagesResponse } from "@schemas/mio/messages.schema"
import { MioModel } from "@typings/Mio/Messages"

function mapSenderType(raw: any) {
  if (raw.TypeIndividu === 1) return "student"
  return "org"
}

export function transformMioMessages(raw: MioModel.ResponseModel, currentFolder: string): MessagesResponse {
  return {
    messages: (raw.ListeMessages ?? []).map((m) => ({
      id: m.Id,

      subject: m.Sujet?.trim() || undefined,
      excerpt: extractHtmlPreview(m.Message),

      sent_at: toIso(m.TimestampDateEnvoi)!,

      sender: {
        id: m.OIDEnvoyeur,
        name: m.NomCompletEnvoyeur,
        number: m.NumeroEnvoyeur || undefined,
        type: mapSenderType(m)
      },

      // Inbox-only behavior
      unread: m.Unread ?? undefined,

      // Sent-only behavior
      sent_metrics: m.MioEnvoi
        ? {
          total_recipients: m.NbDestinataires ?? undefined,
          total_reads: m.NbLectures ?? undefined,
          any_read: (m.NbLectures ?? 0) > 0
        }
        : undefined,

      flags: {
        important: !!m.Indicateurs?.Drapeau,
        mark_unread: !!m.Indicateurs?.ARelire
      },

      attachments: (m.Attachements ?? []).map((a) => ({
        id: a.IDFichierAttachement,
        name: a.NomFichier,
        type: a.ContentType,
        size_bytes: a.TailleOctet,
        created_at: toIso(a.DateHeureCreation)
      })),

      reply_to_id: m.IDMessageReply || undefined,

      is_draft: !!m.IsBrouillon,
      is_trash: !!m.IsDansCorbeille
    })),

    meta: {
      total: raw.NbMessagesTotal ?? 0,
      unread: raw.NbMessagesNonLus ?? 0,
      server_time: toIso(raw.DateHeureServeur),
      has_more: (raw.ListeMessages?.length ?? 0) < (raw.NbMessagesTotal ?? 0),
      folder: currentFolder
    }
  }
}

// --- Text transformers (model → text, no intermediate schema) ---

// NbLectures and ListeDestinataires only describe our own copy on sent messages (MioEnvoi).
// Unread recipients carry .NET DateTime.MinValue as a negative timestamp, so read means > 0.
function sentReadLine(m: MioModel.ListeMessage) {
  return `- Read: ${m.NbLectures ?? 0}/${m.NbDestinataires ?? 0}`
}

function recipientsSummary(m: MioModel.ListeMessage, max = 5) {
  const names = (m.ListeDestinataires ?? []).map(d => d.NomComplet)
  if (!names.length) return '?'
  const more = names.length - max
  return names.slice(0, max).join(', ') + (more > 0 ? ` (+${more} more)` : '')
}

/** Format a single message as a list item line */
export function messageToText(m: MioModel.ListeMessage, opts?: { folder?: string }) {
  const date = toDisplayDate(m.TimestampDateEnvoi) ?? '?'
  const sender = m.NomCompletEnvoyeur || m.OIDEnvoyeur
  const subject = m.Sujet?.trim() || '(no subject)'
  const excerpt = extractHtmlPreview(m.Message)
  const attachments = m.Attachements ?? []

  const header = `## ${subject}${m.Unread ? ' *new*' : ''}`
  const details: string[] = m.MioEnvoi
    ? [`- To: ${recipientsSummary(m)}`, `- Date: ${date}`, sentReadLine(m)]
    : [`- From: ${sender}`, `- Date: ${date}`]
  if (excerpt) details.push(`- Preview: ${excerpt}`)
  if (attachments.length) details.push(`- Attachments: ${attachments.map(a => a.NomFichier).join(', ')}`)
  details.push(`- ID: ${m.Id.toUpperCase()}`)
  if (opts?.folder) details.push(`- Folder: ${opts.folder}`)
  return [header, ...details].join('\n')
}

/** Format meta line for a message list response */
export function messagesMetaToText(raw: MioModel.ResponseModel) {
  const count = raw.ListeMessages?.length ?? 0
  const hasMore = count < (raw.NbMessagesTotal ?? 0)
  return `# MIO messages\n${raw.NbMessagesNonLus ?? 0} unread / ${raw.NbMessagesTotal ?? 0} total, showing ${count}.${hasMore ? ' Use last_id to load more.' : ''}`
}

/** Format a single message for full reading */
export function messageDetailToText(m: MioModel.ListeMessage) {
  const subject = m.Sujet?.trim() || '(no subject)'
  const sender = `${m.NomCompletEnvoyeur}${m.NumeroEnvoyeur ? ` (${m.NumeroEnvoyeur})` : ''}`
  const date = toDisplayDate(m.TimestampDateEnvoi) ?? '?'
  const body = extractHtmlPreview(m.Message, 10000) || '(empty body)'
  const attachments = (m.Attachements ?? []).map(a =>
    `- ${a.NomFichier} (${a.ContentType}, ${Math.round(a.TailleOctet / 1024)}KB) [attachment_id: ${a.IDFichierAttachement}]`
  )

  const recipients = (m.ListeDestinataires ?? []).map(d => {
    const name = `${d.NomComplet}${d.Numero ? ` (${d.Numero})` : ''}`
    const readAt = toDisplayDate(d.DateVisualisation)
    return `- ${name}: ${readAt ? `read ${readAt}` : 'unread'}`
  })

  return [
    `# ${subject}`,
    m.MioEnvoi ? null : `- From: ${sender}`,
    `- Date: ${date}`,
    m.MioEnvoi ? sentReadLine(m) : null,
    m.IDMessageReply ? `- Reply to: ${m.IDMessageReply}` : null,
    m.MioEnvoi && recipients.length ? `\n## Recipients (${recipients.length})\n${recipients.join('\n')}` : null,
    attachments.length ? `\n## Attachments\n${attachments.join('\n')}` : null,
    '',
    '## Message',
    body,
  ].filter(l => l !== null).join('\n')
}

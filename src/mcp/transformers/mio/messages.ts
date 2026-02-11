import { extractHtmlPreview, toIso } from "@common/transformHelpers"
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
      body_html: m.Message || undefined,

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

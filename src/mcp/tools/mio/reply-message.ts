import { GetMessage, SendMessage } from "@api/Mio";
import { messageIdSchema } from "@common/validation";
import { MioModel } from "@typings/Mio/Messages";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

// Client-side limit the Omnivox app enforces before sending.
const MAX_BODY_LENGTH = 50000;

const input = z.object({
    message_id: messageIdSchema.describe('ID of the message being replied to'),
    message: z.string().describe('Reply body (plain text)'),
    subject: z.string().optional().describe('Subject line. Defaults to the original subject with a "Re:" prefix.'),
    quote_original: z.boolean().optional().default(true).describe('Include the quoted original under the reply.'),
    reply_all: z.boolean().optional().default(false).describe('Also send to the other recipients of the original.'),
});

mcpServer.registerTool('reply-mio-message',
    {
        title: 'Reply to MIO Message',
        description: 'Reply to a MIO message. Sends to the original sender, quotes the original under the reply and links the thread.',
        inputSchema: input,
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
        },
    },
    async (args) => {
        const original = (await GetMessage(args.message_id)).MioMessage;
        if (!original?.Id) {
            return { content: [{ type: 'text', text: `Message not found: ${args.message_id}` }], isError: true };
        }

        const to = recipientsOf(original, args.reply_all);
        if (!to.length) {
            return { content: [{ type: 'text', text: 'This message has no one to reply to.' }], isError: true };
        }

        const subject = args.subject || replySubject(original.Sujet);
        const reply = args.message.replace(/\r?\n/g, '<br>');
        const quoted = args.quote_original ? reply + quoteOf(original) : reply;
        const fits = quoted.length <= MAX_BODY_LENGTH;

        const success = await SendMessage(to.join(','), subject, fits ? quoted : reply, false, original.Id, args.reply_all);
        if (!success) {
            return { content: [{ type: 'text', text: 'Failed to send reply.' }], isError: true };
        }

        const note = fits ? '' : ' The original was not quoted because the message would exceed the 50,000 character limit.';
        return { content: [{ type: 'text', text: `Reply sent to ${to.length} recipient(s).${note}` }] };
    }
);

// Sender first, then the other recipients when replying to all. The current user is never included,
// except as a last resort for a message they sent to themselves.
function recipientsOf(m: MioModel.ListeMessage, replyAll: boolean) {
    const self = (m.MioEnvoi ? m.OIDEnvoyeur : m.OIDRecepteur)?.toLowerCase();
    const isOther = (oid: string) => oid.toLowerCase() !== self;

    const listed = (m.ListeDestinataires ?? []).map(d => d.OID).filter(isOther);
    const sender = (m.MioEnvoi && listed[0]) || m.OIDEnvoyeur;

    const all = replyAll ? [m.OIDEnvoyeur, ...listed].filter(isOther) : [];
    const chosen = all.length ? all : [sender];

    return [...new Set(chosen.filter(Boolean))];
}

function replySubject(subject?: string | null) {
    const trimmed = (subject ?? '').trim();
    return /^re\s*:/i.test(trimmed) ? trimmed : `Re: ${trimmed}`;
}

// App format: "<sender> wrote on tue 20-oct-2026 à 11:26 :" followed by the original HTML,
// which already carries earlier quotes, so the whole chain is kept.
function quoteOf(m: MioModel.ListeMessage) {
    if (!m.Message) return '';

    const d = new Date(m.TimestampDateEnvoi);
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3).toLowerCase();
    const month = d.toLocaleDateString('en-US', { month: 'short' }).slice(0, 3).toLowerCase();
    const pad = (n: number) => String(n).padStart(2, '0');
    const date = `${weekday} ${d.getDate()}-${month}-${d.getFullYear()} à ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const sender = (m.NomCompletEnvoyeur ?? '').trim();

    return `<br/><br/>__________________________________<br/>${sender} wrote on ${date} :<br />${m.Message}`;
}

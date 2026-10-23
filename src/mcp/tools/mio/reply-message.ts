import { GetMessage, SendMessage } from "@api/Mio";
import { messageIdSchema } from "@common/validation";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

// Client-side limit the Omnivox app enforces before sending.
const MAX_BODY_LENGTH = 50000;

const input = z.object({
    message_id: messageIdSchema.describe('ID of the message being replied to'),
    message: z.string().describe('Reply body (plain text)'),
    subject: z.string().optional().describe('Subject line. Defaults to the original subject with a "Re:" prefix.'),
    quote_original: z.boolean().optional().default(true).describe('Include the quoted original under the reply.'),
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

        const to = original.MioEnvoi ? original.ListeDestinataires?.[0]?.OID : original.OIDEnvoyeur;
        if (!to) {
            return { content: [{ type: 'text', text: 'This message has no sender to reply to.' }], isError: true };
        }

        const subject = args.subject || replySubject(original.Sujet);
        let body = args.message.replace(/\r?\n/g, '<br>');
        let note = '';

        // The original already carries earlier quotes, so nesting it keeps the whole chain.
        if (args.quote_original && original.Message) {
            const quoted = body + quoteHeader(original.NomCompletEnvoyeur, original.TimestampDateEnvoi) + original.Message;
            if (quoted.length <= MAX_BODY_LENGTH) {
                body = quoted;
            } else {
                note = ' The original was not quoted because the message would exceed the 50,000 character limit.';
            }
        }

        const success = await SendMessage(to, subject, body, false, original.Id);

        return {
            content: [{ type: 'text', text: success ? `Reply sent successfully.${note}` : 'Failed to send reply.' }],
        };
    }
);

function replySubject(subject?: string | null) {
    const trimmed = (subject ?? '').trim();
    return /^re\s*:/i.test(trimmed) ? trimmed : `Re: ${trimmed}`;
}

// App format: "<sender> wrote on tue 20-oct-2026 à 11:26 :"
function quoteHeader(senderName?: string | null, sentAt?: number) {
    const d = new Date(sentAt ?? 0);
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3).toLowerCase();
    const month = d.toLocaleDateString('en-US', { month: 'short' }).slice(0, 3).toLowerCase();
    const pad = (n: number) => String(n).padStart(2, '0');
    const date = `${weekday} ${d.getDate()}-${month}-${d.getFullYear()} à ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return `<br/><br/>__________________________________<br/>${(senderName ?? '').trim()} wrote on ${date} :<br />`;
}

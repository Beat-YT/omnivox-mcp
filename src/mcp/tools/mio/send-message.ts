import { SendMessage } from "@api/Mio";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    recipient_id: z.union([z.string(), z.array(z.string())]).describe('Recipient ID(s) — use search-people to find them. Pass a single ID or an array of IDs to send to multiple people.'),
    subject: z.string().describe('Message subject line'),
    message: z.string().describe('Message body (plain text)'),
    hide_recipients: z.boolean().optional().default(false).describe('Hide recipients from each other (like BCC)'),
});

mcpServer.registerTool('send-mio-message',
    {
        title: 'Send MIO Message',
        description: 'Send a new MIO message. Use search-people first to get the recipient_id. Supports sending to multiple recipients at once.',
        inputSchema: input,
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
        },
    },
    async (args) => {
        const to = Array.isArray(args.recipient_id) ? args.recipient_id.join(',') : args.recipient_id;
        const success = await SendMessage(to, args.subject, args.message, args.hide_recipients);

        return {
            content: [
                { type: 'text', text: success ? 'Message sent successfully.' : 'Failed to send message.' },
            ],
        };
    }
);

import { SendMessage } from "@api/Mio";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    recipient_id: z.string().describe('Recipient ID — use search-people to find it'),
    subject: z.string().describe('Message subject line'),
    message: z.string().describe('Message body (plain text)'),
});

mcpServer.registerTool('send-mio-message',
    {
        title: 'Send MIO Message',
        description: 'Send a new MIO message. Use search-people first to get the recipient_id.',
        inputSchema: input,
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
        },
    },
    async (args) => {
        const success = await SendMessage(args.recipient_id, args.subject, args.message);

        return {
            content: [
                { type: 'text', text: success ? 'Message sent successfully.' : 'Failed to send message.' },
            ],
        };
    }
);

import { SetIndicateursMessage } from "@api/Mio";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    message_id: z.string().describe('The MIO message ID'),
    important: z.boolean().describe('Whether to flag the message as important'),
    mark_unread: z.boolean().describe('Whether to mark the message as unread (à relire)'),
});

mcpServer.registerTool('flag-mio-message',
    {
        title: 'Flag MIO Message',
        description: 'Set flag indicators (important, mark_unread) on a MIO message.',
        inputSchema: input,
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
        },
    },
    async (args) => {
        const success = await SetIndicateursMessage(args.message_id, args.important, args.mark_unread);

        return {
            content: [
                { type: 'text', text: success ? 'Message flags updated.' : 'Failed to update message flags.' },
            ],
        };
    }
);

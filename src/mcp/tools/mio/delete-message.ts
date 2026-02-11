import { DeleteMessage } from "@api/Mio";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    message_id: z.string().describe('The MIO message ID to delete'),
});

mcpServer.registerTool('delete-mio-message',
    {
        title: 'Delete MIO Message',
        description: 'Delete a MIO message (moves to trash, not permanent).',
        inputSchema: input,
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
        },
    },
    async (args) => {
        const success = await DeleteMessage(args.message_id);

        return {
            content: [
                { type: 'text', text: success ? 'Message deleted.' : 'Failed to delete message.' },
            ],
        };
    }
);

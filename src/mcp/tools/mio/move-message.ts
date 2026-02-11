import { CategoriseMessage } from "@api/Mio";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    message_id: z.string().describe('The MIO message ID'),
    folder_id: z.string().describe('Target folder ID to move the message into'),
});

mcpServer.registerTool('move-mio-message',
    {
        title: 'Move MIO Message',
        description: 'Move a MIO message to a different folder.',
        inputSchema: input,
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
        },
    },
    async (args) => {
        const success = await CategoriseMessage(args.message_id, args.folder_id);

        return {
            content: [
                { type: 'text', text: success ? 'Message moved successfully.' : 'Failed to move message.' },
            ],
        };
    }
);

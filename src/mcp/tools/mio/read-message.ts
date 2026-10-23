import { GetMessage, SetMessageLu } from "@api/Mio";
import { messageIdSchema } from "@common/validation";
import { messageDetailToText } from "@transformers/mio/messages";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    message_id: messageIdSchema.describe('The MIO message ID to read'),
    mark_read: z.boolean().optional().describe('Mark the message as read (sends a read receipt to the sender). Defaults to false.'),
});

mcpServer.registerTool('read-mio-message',
    {
        title: 'Read MIO Message',
        description: 'Retrieve and read the full content of a single MIO message by its ID, from any folder. Returns the complete message body as plain text.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const data = await GetMessage(args.message_id);
        const msg = data.MioMessage;

        if (!msg?.Id) {
            return { content: [{ type: 'text', text: `Message not found: ${args.message_id}` }], isError: true };
        }

        if (args.mark_read && msg.Unread) {
            await SetMessageLu(msg.Id, msg.MioEnvoi);
        }

        return {
            content: [{ type: 'text', text: messageDetailToText(msg) }],
        };
    }
);

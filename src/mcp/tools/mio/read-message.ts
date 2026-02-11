import { GetLatestMessages, GetMessages, SetMessageLu } from "@api/Mio";
import { messageDetailToText } from "@transformers/mio/messages";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    message_id: z.string().describe('The MIO message ID to read'),
    folder_id: z.string().optional().describe('Folder ID to search in (defaults to inbox: SEARCH_FOLDER_MioRecu)'),
    mark_read: z.boolean().optional().describe('Mark the message as read (sends a read receipt to the sender). Defaults to false.'),
    last_id: z.string().optional().describe('(optional) The ID of the current pagination cursor, if applicable.'),
});

mcpServer.registerTool('read-mio-message',
    {
        title: 'Read MIO Message',
        description: 'Retrieve and read the full content of a single MIO message by its ID. Returns the complete message body as plain text.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const folder = args.folder_id || 'SEARCH_FOLDER_MioRecu';
        const data = args.last_id ? await GetMessages(folder, args.last_id) : await GetLatestMessages(folder, 50);
        const msg = data.ListeMessages?.find(m => m.Id === args.message_id);

        if (!msg) {
            return { content: [{ type: 'text', text: `Message not found: ${args.message_id}. If it exists, provide the last_id of a message above it in the same folder for pagination.` }] };
        }

        if (args.mark_read) {
            await SetMessageLu(args.message_id);
        }

        return {
            content: [{ type: 'text', text: messageDetailToText(msg) }],
        };
    }
);

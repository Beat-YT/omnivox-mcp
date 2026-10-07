import { GetLatestMessages, GetMessages, SetMessageLu } from "@api/Mio";
import { messageIdSchema } from "@common/validation";
import { messageDetailToText } from "@transformers/mio/messages";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    message_id: messageIdSchema.describe('The MIO message ID to read'),
    folder_id: z.string().optional().describe('Folder ID string constant such as SEARCH_FOLDER_MioRecu (inbox) or SEARCH_FOLDER_MioEnvoye (sent). Use get-mio-folders to discover them. Defaults to inbox.'),
    mark_read: z.boolean().optional().describe('Mark the message as read (sends a read receipt to the sender). Defaults to false.'),
    last_id: messageIdSchema.optional().describe('(optional) The ID of the current pagination cursor, if applicable.'),
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
        const msg = data.ListeMessages?.find(m => m.Id.toUpperCase() === args.message_id.toUpperCase());

        if (!msg) {
            const scope = args.last_id ? `the page after ${args.last_id}` : 'the 50 most recent messages';
            return { content: [{ type: 'text', text: `Message not found in ${scope} of folder ${folder}: ${args.message_id}. Make sure folder_id is the folder the message is in (search-mio-messages shows it).` }], isError: true };
        }

        if (args.mark_read) {
            await SetMessageLu(args.message_id);
        }

        return {
            content: [{ type: 'text', text: messageDetailToText(msg) }],
        };
    }
);

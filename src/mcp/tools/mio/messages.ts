import { GetLatestMessages, GetMessages } from "@api/Mio";
import { messageToText, messagesMetaToText } from "@transformers/mio/messages";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    folder_id: z.string().optional().describe('Folder ID (defaults to inbox: SEARCH_FOLDER_MioRecu)'),
    last_id: z.string().optional().describe('Last message ID for pagination — omit to get latest messages'),
    count: z.number().optional().describe('Number of messages to fetch (default 21, max 100)'),
});

mcpServer.registerTool('get-mio-messages',
    {
        title: 'Get MIO Messages',
        description: 'Retrieve MIO messages from a folder. Supports pagination via last_id.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const folder = args.folder_id || 'SEARCH_FOLDER_MioRecu';
        const count = Math.min(args.count || 21, 100);

        const data = args.last_id
            ? await GetMessages(folder, args.last_id, count)
            : await GetLatestMessages(folder, count);

        const lines = (data.ListeMessages ?? []).map(m => messageToText(m));

        return {
            content: [
                { type: 'text', text: `${messagesMetaToText(data)}\n\n${lines.join('\n\n')}` },
            ],
        };
    }
);

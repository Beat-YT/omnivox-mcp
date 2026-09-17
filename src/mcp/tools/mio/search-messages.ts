import { SearchMessages } from "@api/Mio";
import { messageToText } from "@transformers/mio/messages";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    query: z.string().describe('Search query text'),
    folder_id: z.string().optional().describe('Optional folder to restrict the search to. Folder ID string constant such as SEARCH_FOLDER_MioRecu (inbox) or SEARCH_FOLDER_MioEnvoye (sent). Use get-mio-folders to discover them. Defaults to all folders.'),
});

mcpServer.registerTool('search-mio-messages',
    {
        title: 'Search MIO Messages',
        description: 'Search MIO messages by text.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const folder = args.folder_id || '';
        const data = await SearchMessages(folder, args.query);

        const lines = (data.ListeMessages ?? []).map(m =>
            messageToText(m, { folder: m.NomCategorie || undefined })
        );

        return {
            content: [
                { type: 'text', text: `Search "${args.query}": ${data.ListeMessages?.length ?? 0} result(s).\n\n${lines.join('\n\n')}` },
            ],
        };
    }
);

import { SearchMessages } from "@api/Mio";
import { messageToText } from "@transformers/mio/messages";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    query: z.string().describe('Search query text'),
    folder_id: z.string().optional().describe('Optional Folder ID to search in (if applicable, defaults search all folders)'),
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

import { SearchMessages } from "@api/Mio";
import { MessagesResponseSchema } from "@schemas/mio/messages.schema";
import { transformMioMessages } from "@transformers/mio/messages";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    query: z.string().describe('Search query text'),
    folder_id: z.string().optional().describe('Folder ID to search in (defaults to inbox: SEARCH_FOLDER_MioRecu)'),
});

mcpServer.registerTool('search-mio-messages',
    {
        title: 'Search MIO Messages',
        description: 'Search MIO messages by text in a specific folder.',
        inputSchema: input,
        outputSchema: MessagesResponseSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const folder = args.folder_id || 'SEARCH_FOLDER_MioRecu';
        const data = await SearchMessages(folder, args.query);
        const result = transformMioMessages(data, folder);

        const texts = result.messages.map(m => ({
            type: 'text' as const,
            text: [
                `${m.subject || '(no subject)'}`,
                `From: ${m.sender.name || m.sender.id} — ${m.sent_at}`,
                m.excerpt && `Preview: ${m.excerpt}`,
                '',
            ].filter(Boolean).join('\n'),
        }));

        return {
            content: [
                { type: 'text', text: `Search "${args.query}": ${result.messages.length} result(s).` },
                ...texts,
            ],
            structuredContent: result,
        };
    }
);

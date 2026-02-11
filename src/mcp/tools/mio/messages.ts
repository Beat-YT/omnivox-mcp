import { GetLatestMessages, GetMessages } from "@api/Mio";
import { MessagesResponseSchema } from "@schemas/mio/messages.schema";
import { transformMioMessages } from "@transformers/mio/messages";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    folder_id: z.string().optional().describe('Folder ID (defaults to inbox: SEARCH_FOLDER_MioRecu)'),
    last_id: z.string().optional().describe('Last message ID for pagination — omit to get latest messages'),
});

mcpServer.registerTool('get-mio-messages',
    {
        title: 'Get MIO Messages',
        description: 'Retrieve MIO messages from a folder. Supports pagination via last_id.',
        inputSchema: input,
        outputSchema: MessagesResponseSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const folder = args.folder_id || 'SEARCH_FOLDER_MioRecu';

        const data = args.last_id
            ? await GetMessages(folder, args.last_id)
            : await GetLatestMessages(folder);

        const result = transformMioMessages(data, folder);

        const texts = result.messages.map(m => ({
            type: 'text' as const,
            text: [
                `${m.unread ? '[UNREAD] ' : ''}${m.subject || '(no subject)'}`,
                `From: ${m.sender.name || m.sender.id} — ${m.sent_at}`,
                m.excerpt && `Preview: ${m.excerpt}`,
                '',
            ].filter(Boolean).join('\n'),
        }));

        return {
            content: [
                { type: 'text', text: `${result.messages.length} message(s) (${result.meta.unread} unread, ${result.meta.total} total, has_more=${result.meta.has_more}).` },
                ...texts,
            ],
            structuredContent: result,
        };
    }
);

import { GetListeFoldersModel } from "@api/Mio";
import { FoldersResponseSchema } from "@schemas/mio/folders.schema";
import { transformMioFolders } from "@transformers/mio/folders";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({});

mcpServer.registerTool('get-mio-folders',
    {
        title: 'Get MIO Folders',
        description: 'Retrieve the list of MIO (internal messaging) folders and their unread counts.',
        inputSchema: input,
        outputSchema: FoldersResponseSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async () => {
        const model = await GetListeFoldersModel();
        const result = transformMioFolders(model);

        const texts = result.folders.map(f => ({
            type: 'text' as const,
            text: `${f.label} (${f.type}) — ${f.unread_msg_count} unread / ${f.total_msg_count} total`,
        }));

        return {
            content: [
                { type: 'text', text: `${result.folders.length} MIO folder(s).` },
                ...texts,
            ],
            structuredContent: result,
        };
    }
);

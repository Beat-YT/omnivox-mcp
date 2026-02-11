import { GetListeFoldersModel } from "@api/Mio";
import { computeDelta, flattenSnapshot, itemDeltaText } from "@common/deltaTracker";
import { Folder } from "@schemas/mio/folders.schema";
import { transformMioFolders } from "@transformers/mio/folders";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({});

mcpServer.registerTool('get-mio-folders',
    {
        title: 'Get MIO Folders',
        description: 'Retrieve the list of MIO (internal messaging) folders and their unread counts.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async () => {
        const model = await GetListeFoldersModel();
        const result = transformMioFolders(model);

        const snapshot = flattenSnapshot(result.folders, f => f.id, {
            unread_msg_count: f => f.unread_msg_count,
            total_msg_count: f => f.total_msg_count,
        });
        const deltas = computeDelta('get-mio-folders', snapshot);
        const dt = itemDeltaText(deltas, m => m.replace(/_/g, ' '));

        const totalUnread = result.folders.reduce((sum, f) => sum + f.unread_msg_count, 0);
        const header = `${result.folders.length} MIO folder(s), ${totalUnread} unread total`;
        const folders = result.folders.map(f => formatFolder(f, dt?.items[f.id]));

        return {
            content: [{ type: 'text', text: [dt?.header, header, '', ...folders].filter(Boolean).join('\n') }],
        };
    }
);

function formatFolder(f: Folder, delta?: string) {
    const marker = f.unread_msg_count ? '* ' : '- ';
    return [
        `${marker}${f.label} (${f.type})`,
        `  ${f.unread_msg_count} unread / ${f.total_msg_count} total`,
        `  ID: ${f.id}`,
        `  ${delta || '[no changes since last check]'}`,
        '',
    ].join('\n');
}

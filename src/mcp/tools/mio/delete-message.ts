import { DeleteMessage } from "@api/Mio";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    message_id: z.union([z.string(), z.array(z.string())]).describe('The MIO message ID(s) to delete. Pass a single ID or an array of IDs.'),
});

mcpServer.registerTool('delete-mio-message',
    {
        title: 'Delete MIO Message',
        description: 'Move a MIO message to trash (not permanent). Use restore-mio-message to undo.',
        inputSchema: input,
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
        },
    },
    async (args) => {
        const ids = Array.isArray(args.message_id) ? args.message_id : [args.message_id];
        const results = await Promise.all(ids.map(id => DeleteMessage(id).then(ok => ({ id, ok }))));

        const failed = results.filter(r => !r.ok);
        if (failed.length === 0) {
            return { content: [{ type: 'text', text: `${ids.length} message(s) moved to trash.` }] };
        }
        return { content: [{ type: 'text', text: `${ids.length - failed.length}/${ids.length} moved to trash. Failed: ${failed.map(r => r.id).join(', ')}` }] };
    }
);

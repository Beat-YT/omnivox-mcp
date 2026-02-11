import { RestoreMessage } from "@api/Mio";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    message_id: z.union([z.string(), z.array(z.string())]).describe('The MIO message ID(s) to restore from trash. Pass a single ID or an array of IDs.'),
});

mcpServer.registerTool('restore-mio-message',
    {
        title: 'Restore MIO Message',
        description: 'Restore a deleted MIO message from trash back to the inbox.',
        inputSchema: input,
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
        },
    },
    async (args) => {
        const ids = Array.isArray(args.message_id) ? args.message_id : [args.message_id];
        const results = await Promise.all(ids.map(id => RestoreMessage(id).then(ok => ({ id, ok }))));

        const failed = results.filter(r => !r.ok);
        if (failed.length === 0) {
            return { content: [{ type: 'text', text: `${ids.length} message(s) restored.` }] };
        }
        return { content: [{ type: 'text', text: `${ids.length - failed.length}/${ids.length} restored. Failed: ${failed.map(r => r.id).join(', ')}` }] };
    }
);

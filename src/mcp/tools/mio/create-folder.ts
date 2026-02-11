import { AjoutCategorie } from "@api/Mio";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    name: z.string().describe('Name for the new MIO folder'),
});

mcpServer.registerTool('create-mio-folder',
    {
        title: 'Create MIO Folder',
        description: 'Create a new custom folder in MIO (internal messaging).',
        inputSchema: input,
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
        },
    },
    async (args) => {
        const success = await AjoutCategorie(args.name);

        return {
            content: [
                { type: 'text', text: success ? `Folder "${args.name}" created.` : 'Failed to create folder.' },
            ],
        };
    }
);

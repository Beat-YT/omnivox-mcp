import { UpdateListeCollegeUser } from "@api/App";
import { transformCollegeList } from "@transformers/college/collegeList";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({});

mcpServer.registerTool('get-college-list',
    {
        title: 'Get College List',
        description: 'Retrieve the list of colleges available to the user.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async () => {
        const data = await UpdateListeCollegeUser();
        const list = transformCollegeList(data);

        const texts = list.map(c => ({
            type: 'text' as const,
            text: `${c.name} (${c.code})${c.omnivoxUrl ? ` — ${c.omnivoxUrl}` : ''}`,
        }));

        return {
            content: [
                { type: 'text', text: `Found ${list.length} college(s).` },
                ...texts,
            ],
            structuredContent: list,
        };
    }
);

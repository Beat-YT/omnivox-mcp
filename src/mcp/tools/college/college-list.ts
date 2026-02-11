import { UpdateListeCollegeUser } from "@api/App";
import { CollegeListResponseSchema } from "@schemas/college/collegeList";
import { transformCollegeList } from "@transformers/college/collegeList";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({});

mcpServer.registerTool('get-college-list',
    {
        title: 'Get College List',
        description: 'Retrieve the list of colleges available to the user.',
        inputSchema: input,
        outputSchema: CollegeListResponseSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async () => {
        const data = await UpdateListeCollegeUser();
        const result = transformCollegeList(data);

        const texts = result.colleges.map(c => ({
            type: 'text' as const,
            text: `${c.name} (${c.code})`,
        }));

        return {
            content: [
                { type: 'text', text: `Found ${result.count} college(s).` },
                ...texts,
            ],
            structuredContent: result,
        };
    }
);

import { RechercheIndividu } from "@api/Mio";
import { PeopleSearchResponseSchema } from "@schemas/mio/people.schema";
import { transformPeopleSearch } from "@transformers/mio/people";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    query: z.string().describe('Name or partial name to search for'),
});

mcpServer.registerTool('search-people',
    {
        title: 'Search People',
        description: 'Search for people (students, teachers, employees) by name. Useful to find recipient IDs for sending MIO messages.',
        inputSchema: input,
        outputSchema: PeopleSearchResponseSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const raw = await RechercheIndividu(args.query);
        const result = transformPeopleSearch(raw);

        const lines = [
            `# People search: "${args.query}" (${result.results.length})`,
            ...result.results.map(p => `- ${p.name}, ${p.type} (ID: ${p.id})`),
        ];

        return {
            content: [{ type: 'text', text: lines.join('\n') }],
            structuredContent: result,
        };
    }
);

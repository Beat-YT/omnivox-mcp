import { GetCoursePeople } from "@api/MioWeb";
import { PeopleSearchResponseSchema } from "@schemas/mio/people.schema";
import { transformPeopleSearch } from "@transformers/mio/people";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    course_id: z.string().describe('Course ID (e.g. 2434K5EM.01011) — use get-courses-summary to find it'),
});

mcpServer.registerTool('get-course-people',
    {
        title: 'Get Course People',
        description: 'List all students and teachers in a specific course. Returns recipient IDs usable with send-mio-message.',
        inputSchema: input,
        outputSchema: PeopleSearchResponseSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const raw = await GetCoursePeople(args.course_id);
        const result = transformPeopleSearch(raw);

        const teachers = result.results.filter(p => p.type === 'teacher');
        const students = result.results.filter(p => p.type !== 'teacher');

        const texts: { type: 'text'; text: string }[] = [];

        if (teachers.length) {
            texts.push({ type: 'text', text: `Teachers (${teachers.length}):` });
            texts.push(...teachers.map(p => ({
                type: 'text' as const,
                text: `  ${p.name} — ID: ${p.id}`,
            })));
        }

        texts.push({ type: 'text', text: `Students (${students.length}):` });
        texts.push(...students.map(p => ({
            type: 'text' as const,
            text: `  ${p.name} — ID: ${p.id}`,
        })));

        return {
            content: [
                { type: 'text', text: `${result.results.length} people in course ${args.course_id}.` },
                ...texts,
            ],
            structuredContent: result,
        };
    }
);

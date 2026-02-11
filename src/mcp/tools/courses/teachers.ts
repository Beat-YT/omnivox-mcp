import { GetEnseignantsSommaireModel } from "@api/Lea";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { teachersSummarySchema } from "@schemas/courses/teachers";
import { transformTeachers } from "@transformers/courses/teachers";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    term_id: z.string().optional(),
});

mcpServer.registerTool('get-teachers',
    {
        title: 'Get Teachers',
        description: 'Fallback tool to get all teachers for a term. Returns names, departments, offices, phone numbers, and MIO IDs, but does NOT include which course each teacher teaches. Prefer get-course-people to look up teachers for a specific course — only use this tool if get-course-people fails or you need the full roster.',
        inputSchema: input,
        outputSchema: teachersSummarySchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const term = args.term_id || await getDefaultTermId();
        const model = await GetEnseignantsSommaireModel(term);
        const teachers = transformTeachers(model);

        const texts = teachers.teachers.map(t => ({
            type: 'text' as const,
            text: [
                t.name,
                t.department ? `  Department: ${t.department}` : null,
                t.office ? `  Office: ${t.office}` : null,
                t.phone ? `  Phone: ${t.phone}` : null,
            ].filter(Boolean).join('\n'),
        }));

        return {
            content: [
                { type: 'text', text: `Teachers for term ${teachers.term_id}: ${teachers.teachers.length} teacher(s).` },
                ...texts,
            ],
            structuredContent: teachers,
        };
    }
);

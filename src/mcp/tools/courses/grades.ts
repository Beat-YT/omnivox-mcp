import { GetNotesDetailWebModel } from "@api/Lea";
import { GetWebListeEval } from "@api/LeaDownload";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    term_id: z.string().optional(),
    course_id: z.string(),
});

mcpServer.registerTool('get-course-evals',
    {
        title: 'Get Course Grades',
        description: 'Retrieve evaluations, grades, course summary and grade evolution for a specific course.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const term = args.term_id || await getDefaultTermId();
        const [course_code, course_group] = args.course_id.split('.');

        const model = await GetNotesDetailWebModel(course_code, course_group, term);
        const text = await GetWebListeEval(model, course_code, course_group, term);

        return {
            content: [
                {
                    type: 'text',
                    text: [
                        'Mark = student score. Assessment Weight = % of final grade (points earned in parentheses).',
                        'Blockquoted rows (>) are either category headers (weight + avg) or teacher comments referring to the evaluation directly above.',
                    ].join(' '),
                    annotations: { audience: ['assistant'] },
                },
                {
                    type: 'text',
                    text,
                },
            ],
        }
    }
)

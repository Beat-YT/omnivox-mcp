import { GetDefaultModel, GetNotesDetailWebModel } from "@api/Lea";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    term_id: z.string().optional(),
    course_id: z.string(),
});

const output = z.object({
    course_id: z.string(),
    course_code: z.string(),
    group: z.string(),
    title: z.string(),
    term_id: z.string(),
    teachers: z.array(z.string()),
});

mcpServer.registerTool('get-course-info',
    {
        title: 'Get Course Info',
        description: 'Retrieve info about a specific course. Includes the course identity and teacher names.',
        inputSchema: input,
        outputSchema: output,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        }
    },
    async (args) => {
        const term = args.term_id || await getDefaultTermId();
        const [course_code, course_group] = args.course_id.split('.');

        const [defaultModel, detailWeb] = await Promise.all([
            GetDefaultModel(term),
            GetNotesDetailWebModel(course_code, course_group, term),
        ]);

        const course = defaultModel.ListeCours.find(c =>
            c.NoCours === course_code && c.NoGroupe === course_group
        );

        const title = course?.Titre ?? args.course_id;
        const teachers = detailWeb.NoteEvaluationWeb.Enseignants;

        return {
            content: [
                {
                    type: 'text',
                    text: [
                        `Course: ${title}`,
                        `Code: ${course_code}`,
                        `Group: ${course_group}`,
                        `Teachers: ${teachers.join(', ')}`,
                    ].join('\n'),
                },
            ],
            structuredContent: {
                course_id: args.course_id,
                course_code,
                group: course_group,
                title,
                term_id: term,
                teachers,
            },
        }
    }
)
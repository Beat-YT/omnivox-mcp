import { GetAbsencesSommaireModel } from "@api/Lea";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { AbsencesSummarySchema } from "@schemas/courses/absences";
import { transformLeaAbsences } from "@transformers/courses/absences";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    term_id: z.string().optional(),
});

mcpServer.registerTool('get-absences',
    {
        title: 'Get Absences',
        description: 'Retrieve absence summaries for all courses in a given term or the current term.',
        inputSchema: input,
        outputSchema: AbsencesSummarySchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const term = args.term_id || await getDefaultTermId();
        const model = await GetAbsencesSommaireModel(term);
        const absences = transformLeaAbsences(model);

        const texts = absences.courses.map(c => ({
            type: 'text' as const,
            text: [
                `${c.course_id}${c.name ? ` — ${c.name}` : ''}: ${c.total_hours_absent}h absent`,
                ...c.absences.map(a => `  ${a.date}: ${a.hours}h`),
                '',
            ].join('\n'),
        }));

        return {
            content: [
                { type: 'text', text: `Absences for term ${absences.term_id}: ${absences.courses.length} course(s).` },
                ...texts,
            ],
            structuredContent: absences,
        };
    }
);

import { GetAbsencesSommaireModel } from "@api/Lea";
import { computeDelta, flattenSnapshot, itemDeltaText } from "@common/deltaTracker";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { CourseAbsence } from "@schemas/courses/absences";
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
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const term = args.term_id || await getDefaultTermId();
        const model = await GetAbsencesSommaireModel(term);
        const absences = transformLeaAbsences(model);

        const snapshot = flattenSnapshot(absences.courses, c => c.course_id, {
            total_hours_absent: c => c.total_hours_absent,
        });
        const deltas = computeDelta(`get-absences:${term}`, snapshot);
        const dt = itemDeltaText(deltas, m => m.replace(/_/g, ' '));

        const totalHours = absences.courses.reduce((sum, c) => sum + c.total_hours_absent, 0);
        const header = `Term: ${term} — ${absences.courses.length} course(s), ${totalHours}h total absent`;
        const courses = absences.courses.map(c => formatAbsence(c, dt?.items[c.course_id]));

        return {
            content: [{ type: 'text', text: [dt?.header, header, '', ...courses].filter(Boolean).join('\n') }],
        };
    }
);

function formatAbsence(c: CourseAbsence, delta?: string) {
    const lines = [
        `- ${c.name || c.course_id} (${c.course_id}): ${c.total_hours_absent}h absent`,
        ...c.absences.map(a => `  ${a.date}: ${a.hours}h`),
        `  ${delta || '[no changes since last check]'}`,
        '',
    ];
    return lines.join('\n');
}

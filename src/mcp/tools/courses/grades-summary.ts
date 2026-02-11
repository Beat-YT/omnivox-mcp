import { GetNotesSommaireModel } from "@api/Lea";
import { computeDelta, flattenSnapshot, itemDeltaText } from "@common/deltaTracker";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { GradeSummaryItem } from "@schemas/courses";
import { transformGradesSummary } from "@transformers/courses/grades-summary";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    term_id: z.string().optional(),
});

mcpServer.registerTool('get-grades-summary',
    {
        title: 'Get Grades Summary',
        description: 'Retrieve a list of grades summaries for the user\'s courses in a given term or the current term.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        }
    },
    async (args) => {
        const term = args.term_id || await getDefaultTermId();
        const model = await GetNotesSommaireModel(term);
        const grades = transformGradesSummary(model, term);

        const snapshot = flattenSnapshot(grades.courses, c => c.course_id, {
            new_evaluations_count: c => c.new_evaluations_count ?? 0,
            accumulated_weight: c => c.accumulated_weight ?? 0,
        });
        const deltas = computeDelta(`get-grades-summary:${term}`, snapshot);
        const dt = itemDeltaText(deltas, m => m.replace(/_/g, ' '));

        const hasNew = grades.courses.some(c => c.new_evaluations_count);
        const header = `Term: ${term} — ${grades.courses.length} course(s)`;
        const legend = hasNew ? '* = has new evals' : '';
        const courses = grades.courses.map(c => formatGrade(c, dt?.items[c.course_id]));

        return {
            content: [{ type: 'text', text: [dt?.header, header, legend, '', ...courses].filter(Boolean).join('\n') }],
        };
    }
)

function formatGrade(c: GradeSummaryItem, delta?: string) {
    const marker = c.new_evaluations_count ? '* ' : '- ';
    const isFinal = c.has_final_grade;
    const hasClassAvg = c.course_average != null && c.course_median != null;

    const lines = [
        `${marker}${c.title} (${c.course_code}.${c.group})`,
    ];

    if (isFinal) {
        lines.push(`  Final Grade: ${c.final_grade}%${c.class_average_final ? ` (class avg: ${c.class_average_final}%)` : ''}`);
    } else {
        lines.push(`  Current: ${c.projected_grade}/${c.accumulated_weight} (earned/weight), ${100 - (c.accumulated_weight ?? 0)}% remaining`);
    }

    if (hasClassAvg) {
        lines.push(`  Class: avg ${c.course_average}%, median ${c.course_median}%, std ${c.course_std_dev}%`);
    }

    if (c.new_evaluations_count) {
        lines.push(`  ${c.new_evaluations_count} new eval(s) available`);
    }

    lines.push(`  Status: ${c.status}`);
    lines.push(`  ${delta || '[no changes since last check]'}`);
    lines.push('');

    return lines.join('\n');
}
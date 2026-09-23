import { GetNotesSommaireModel } from "@api/Lea";
import { computeDelta, flattenSnapshot, itemDeltaText } from "@common/deltaTracker";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { GradeSummaryItem } from "@schemas/courses";
import { transformGradesSummary } from "@transformers/courses/grades-summary";
import { termIdSchema } from "@common/validation";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    term_id: termIdSchema.optional(),
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

        const header = `# Grades — term ${term} (${grades.courses.length} courses)`;
        const courses = grades.courses.map(c => formatGrade(c, dt?.items[c.course_id]));

        return {
            content: [{ type: 'text', text: [header, dt?.header, '', ...courses].filter(l => l != null).join('\n') }],
        };
    }
)

function formatGrade(c: GradeSummaryItem, delta?: string) {
    const isFinal = c.has_final_grade;
    const hasClassAvg = c.course_average != null && c.course_median != null;

    const lines = [
        `## ${c.title} (${c.course_code}.${c.group})${c.new_evaluations_count ? ' *new*' : ''}`,
    ];

    if (isFinal) {
        lines.push(`- Final grade: ${c.final_grade}%${c.class_average_final ? ` (class avg ${c.class_average_final}%)` : ''}`);
    } else {
        lines.push(`- Current: ${c.projected_grade}/${c.accumulated_weight} (earned/weight), ${100 - (c.accumulated_weight ?? 0)}% remaining`);
    }

    if (hasClassAvg) {
        lines.push(`- Class: avg ${c.course_average}%, median ${c.course_median}%, std dev ${c.course_std_dev}%`);
    }

    if (c.new_evaluations_count) {
        lines.push(`- New evals: ${c.new_evaluations_count}`);
    }

    lines.push(`- Status: ${c.status}`);
    lines.push(`- Changes: ${delta || '[no changes since last check]'}`);
    lines.push('');

    return lines.join('\n');
}
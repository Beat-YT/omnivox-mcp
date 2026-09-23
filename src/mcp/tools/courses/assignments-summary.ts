import { GetTravauxSommaireModel } from "@api/Lea";
import { computeDelta, flattenSnapshot, itemDeltaText } from "@common/deltaTracker";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { AssignmentCourseSummaryItem } from "@schemas/courses/assignments-summary";
import { transformAssignmentsSummary } from "@transformers/courses/assignments-summary";
import { termIdSchema } from "@common/validation";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    term_id: termIdSchema.optional(),
});

mcpServer.registerTool('get-assignments-summary',
    {
        title: 'Get Assignments Summary',
        description: 'Retrieve a per-course summary of assignments for a given term or the current term. Only counts assignments teachers posted on Lea; an empty summary does not mean the student is caught up.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const term = args.term_id || await getDefaultTermId();
        const model = await GetTravauxSommaireModel(term);
        const result = transformAssignmentsSummary(model);

        const snapshot = flattenSnapshot(result.summary, s => s.course_id, {
            total_assignments: s => s.total_assignments,
            new_assignments_count: s => s.new_assignments_count,
            new_correction_count: s => s.new_correction_count,
        });
        const deltas = computeDelta(`get-assignments-summary:${term}`, snapshot);
        const dt = itemDeltaText(deltas, m => m.replace(/_/g, ' '));

        const header = `# Assignments — term ${term} (${result.summary.length} courses)`;
        const courses = result.summary.map(s => formatAssignment(s, dt?.items[s.course_id]));

        return {
            content: [{ type: 'text', text: [header, dt?.header, '', ...courses].filter(l => l != null).join('\n') }],
        };
    }
);

function formatAssignment(s: AssignmentCourseSummaryItem, delta?: string) {
    const details: string[] = [];
    details.push(`- Total: ${s.total_assignments}`);
    if (s.new_assignments_count) details.push(`- New: ${s.new_assignments_count}`);
    if (s.new_correction_count) details.push(`- New corrections: ${s.new_correction_count}`);
    if (s.has_online_submission) details.push(`- Online submission available`);

    return [
        `## ${s.course_title} (${s.course_id})`,
        ...details,
        `- Changes: ${delta || '[no changes since last check]'}`,
        '',
    ].join('\n');
}

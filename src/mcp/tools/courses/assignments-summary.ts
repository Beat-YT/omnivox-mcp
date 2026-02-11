import { GetTravauxSommaireModel } from "@api/Lea";
import { computeDelta, flattenSnapshot, itemDeltaText } from "@common/deltaTracker";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { AssignmentCourseSummaryItem } from "@schemas/courses/assignments-summary";
import { transformAssignmentsSummary } from "@transformers/courses/assignments-summary";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    term_id: z.string().optional(),
});

mcpServer.registerTool('get-assignments-summary',
    {
        title: 'Get Assignments Summary',
        description: 'Retrieve a per-course summary of assignments for a given term or the current term.',
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

        const hasNew = result.summary.some(s => s.has_new_assignments || s.new_correction_count);
        const header = `Term: ${term} — ${result.summary.length} course(s)`;
        const legend = hasNew ? '* = has new items' : '';
        const courses = result.summary.map(s => formatAssignment(s, dt?.items[s.course_id]));

        return {
            content: [{ type: 'text', text: [dt?.header, header, legend, '', ...courses].filter(Boolean).join('\n') }],
        };
    }
);

function formatAssignment(s: AssignmentCourseSummaryItem, delta?: string) {
    const hasNew = s.has_new_assignments || s.new_correction_count;
    const marker = hasNew ? '* ' : '- ';

    const details: string[] = [];
    details.push(`  ${s.total_assignments} assignment(s)`);
    if (s.new_assignments_count) details.push(`  ${s.new_assignments_count} new`);
    if (s.new_correction_count) details.push(`  ${s.new_correction_count} new correction(s)`);
    if (s.has_online_submission) details.push(`  Online submission available`);

    return [
        `${marker}${s.course_title} (${s.course_id})`,
        ...details,
        `  ${delta || '[no changes since last check]'}`,
        '',
    ].join('\n');
}

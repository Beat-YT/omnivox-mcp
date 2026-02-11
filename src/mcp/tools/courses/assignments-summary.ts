import { GetTravauxSommaireModel } from "@api/Lea";
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

        const texts = result.summary.map(s => ({
            type: 'text' as const,
            text: mapSummaryToText(s),
        }));

        return {
            content: [
                { type: 'text', text: `Assignments summary for term ${result.term_id}: ${result.summary.length} course(s).` },
                ...texts,
            ],
            structuredContent: result,
        };
    }
);

function mapSummaryToText(s: AssignmentCourseSummaryItem) {
    return [
        `${s.course_title} (${s.course_id})`,
        `Total: ${s.total_assignments}, New: ${s.new_assignments_count}, New Corrections: ${s.new_correction_count}`,
        s.has_online_submission && 'Online submission available',
        '',
    ].filter(Boolean).join('\n');
}

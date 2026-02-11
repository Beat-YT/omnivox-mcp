import { GetTravauxListeModel } from "@api/Lea";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { AssignmentListItem } from "@schemas/courses/assignments-list";
import { transformAssignmentsList } from "@transformers/courses/assignments-list";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    course_id: z.string(),
    term_id: z.string().optional(),
});

mcpServer.registerTool('get-course-assignments',
    {
        title: 'Get Course Assignments',
        description: 'Retrieve the list of assignments for a specific course.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const term = args.term_id || await getDefaultTermId();
        const model = await GetTravauxListeModel(args.course_id, term);
        const result = transformAssignmentsList(model, term, args.course_id);

        const texts = result.assignments.map(a => ({
            type: 'text' as const,
            text: mapAssignmentToText(a),
        }));

        return {
            content: [
                { type: 'text', text: `${result.assignments.length} assignment(s) for course ${args.course_id}.` },
                ...texts,
            ],
            structuredContent: result,
        };
    }
);

function mapAssignmentToText(a: AssignmentListItem) {
    return [
        `${a.title}${a.is_submitted ? ' [SUBMITTED]' : ''}${a.has_correction ? ' [CORRECTED]' : ''}`,
        a.due_at && `Due: ${a.due_at}`,
        a.category && `Category: ${a.category}`,
        a.content_preview && `Preview: ${a.content_preview}`,
        '',
    ].filter(Boolean).join('\n');
}

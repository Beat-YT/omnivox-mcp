import { GetTravauxDetailModel } from "@api/Lea";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { assignmentDetailSchema } from "@schemas/courses/assignment-detail";
import { transformAssignmentDetail } from "@transformers/courses/assignment-detail";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    course_id: z.string(),
    assignment_id: z.string(),
    term_id: z.string().optional(),
});

mcpServer.registerTool('get-assignment-detail',
    {
        title: 'Get Assignment Detail',
        description: 'Retrieve detailed information about a specific assignment, including instructions, submissions, and corrections.',
        inputSchema: input,
        outputSchema: assignmentDetailSchema.nullable(),
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const term = args.term_id || await getDefaultTermId();
        const model = await GetTravauxDetailModel(args.course_id, args.assignment_id, term);
        const detail = transformAssignmentDetail(model);

        if (!detail) {
            return {
                content: [{ type: 'text', text: 'Assignment not found or could not be parsed.' }],
            };
        }

        const lines = [
            `Assignment: ${detail.title}`,
            detail.category && `Category: ${detail.category}`,
            detail.published_at && `Published: ${detail.published_at}`,
            detail.due_at && `Due: ${detail.due_at}`,
            `Submitted: ${detail.is_submitted}`,
            `Submission Open: ${detail.is_submission_open}`,
            `Late Submission: ${detail.allow_late_submission}`,
            detail.student_submissions?.length && `Student Submissions: ${detail.student_submissions.length}`,
            detail.teacher_documents?.length && `Teacher Documents: ${detail.teacher_documents.length}`,
            detail.correction_files?.length && `Correction Files: ${detail.correction_files.length}`,
        ].filter(Boolean).join('\n');

        return {
            content: [{ type: 'text', text: lines }],
            structuredContent: detail,
        };
    }
);

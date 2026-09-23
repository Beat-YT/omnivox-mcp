import { GetTravauxDetailModel } from "@api/Lea";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { assignmentDetailSchema } from "@schemas/courses/assignment-detail";
import { transformAssignmentDetail } from "@transformers/courses/assignment-detail";
import { assignmentIdSchema, courseIdSchema, termIdSchema } from "@common/validation";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    course_id: courseIdSchema,
    assignment_id: assignmentIdSchema,
    term_id: termIdSchema.optional(),
});

mcpServer.registerTool('get-assignment-detail',
    {
        title: 'Get Assignment Detail',
        description: 'Retrieve detailed information about a specific assignment, including instructions, submissions, and corrections.',
        inputSchema: input,
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
            `# ${detail.title}`,
            detail.category && `- Category: ${detail.category}`,
            detail.published_at && `- Published: ${detail.published_at}`,
            detail.due_at && `- Due: ${detail.due_at}`,
            `- Submitted: ${detail.is_submitted ? 'yes' : 'no'}`,
            `- Submission open: ${detail.is_submission_open ? 'yes' : 'no'}`,
            `- Late submission allowed: ${detail.allow_late_submission ? 'yes' : 'no'}`,
        ];

        if (detail.student_submissions?.length) {
            lines.push('', `## Your submissions (${detail.student_submissions.length})`);
            lines.push(...detail.student_submissions.map(s => `- ${s.file_name} (${s.submitted_at}${s.is_late_submission ? ', late' : ''})`));
        }
        if (detail.teacher_documents?.length) {
            lines.push('', `## Teacher documents (${detail.teacher_documents.length})`);
            lines.push(...detail.teacher_documents.map(d => `- ${d.file_name}`));
        }
        if (detail.correction_files?.length) {
            lines.push('', `## Correction files (${detail.correction_files.length})`);
            lines.push(...detail.correction_files.map(d => `- ${d.file_name}`));
        }

        return {
            content: [{ type: 'text', text: lines.filter(Boolean).join('\n') }],
            structuredContent: detail,
        };
    }
);

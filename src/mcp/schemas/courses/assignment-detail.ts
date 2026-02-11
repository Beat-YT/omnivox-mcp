import { z } from "zod"
import { is } from "zod/v4/locales";

const roleEnum = z.enum(["submission", "teacher_document", "correction"]);

export const assignmentSubmissionSchema = z.object({
    submission_id: z.string(),
    role: roleEnum,

    file_name: z.string(),
    file_size_bytes: z.number(),

    mime_type: z.string().optional(),
    extension: z.string().optional(),

    student_comment: z.string().optional(),

    submitted_at: z.string(),
    downloaded_by_teacher_at: z.string().optional(),
    is_late_submission: z.boolean(),
})

export const assignmentFileSchema = z.object({
    file_id: z.string().optional(),
    role: roleEnum,

    file_name: z.string(),
    file_size_bytes: z.number(),

    mime_type: z.string().optional(),
    extension: z.string().optional(),

    uploaded_at: z.string().optional(),
    first_viewed_at: z.string().optional(),
})

export const assignmentDetailSchema = z.object({
    id: z.string(),
    title: z.string(),
    category: z.string().optional(),

    published_at: z.string().optional(),
    due_at: z.string().optional(),

    allow_multiple_submissions: z.boolean(),
    allow_late_submission: z.boolean(),

    is_visible: z.boolean(),
    is_submission_open: z.boolean(),
    is_submitted: z.boolean(),

    instructions_html: z.string().optional(),

    student_submissions: z.array(assignmentSubmissionSchema).optional(),
    teacher_documents: z.array(assignmentFileSchema).optional(),
    correction_files: z.array(assignmentFileSchema).optional(),
})

export type AssignmentDetail = z.infer<typeof assignmentDetailSchema>

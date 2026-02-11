import { z } from "zod"

export const assignmentListItemSchema = z.object({
    id: z.string(),
    title: z.string(),
    category: z.string().optional(),

    published_at: z.string().optional(),
    due_at: z.string().optional(),

    is_visible: z.boolean(),
    is_submission_open: z.boolean(),
    is_submitted: z.boolean(),

    allow_late_submission: z.boolean(),

    submitted_count: z.number().optional(),
    has_correction: z.boolean(),
    
    content_preview: z.string().optional(),
})

export type AssignmentListItem = z.infer<typeof assignmentListItemSchema>

export type AssignmentsList = {
    term_id?: string
    course_id: string
    assignments: AssignmentListItem[]
}

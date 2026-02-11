import { z } from "zod"

export const assignmentCourseSummaryItemSchema = z.object({
    course_id: z.string(),
    course_code: z.string(),
    course_title: z.string(),
    group: z.string(),

    total_assignments: z.number(),
    new_assignments_count: z.number(),
    new_correction_count: z.number(),

    has_new_assignments: z.boolean(),
    has_online_submission: z.boolean(),
})

export type AssignmentCourseSummaryItem = z.infer<typeof assignmentCourseSummaryItemSchema>

export type AssignmentsSummary = {
    term_id?: string
    summary: AssignmentCourseSummaryItem[]
}

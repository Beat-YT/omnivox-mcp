import { z } from "zod"

export const courseItemSchema = z.object({
    id: z.string(),
    title: z.string(),
    course_code: z.string().optional(),
    group: z.string().optional(),

    unread_documents: z.number().optional(),
    unread_announcements: z.number().optional(),
    unread_assignments: z.number().optional(),
    unread_grades: z.number().optional(),

    total_documents: z.number().optional(),
    total_announcements: z.number().optional(),
    total_assignments: z.number().optional(),
    total_evals: z.number().optional(),
})

export const coursesSummarySchema = z.object({
    term_id: z.string(),
    courses: z.array(courseItemSchema),
})

export type CourseItem = z.infer<typeof courseItemSchema>
export type CourseSummary = z.infer<typeof coursesSummarySchema>
import { z } from "zod"

export const AbsenceItemSchema = z.object({
    date: z.string(), // ISO
    hours: z.number()
})

export const CourseAbsenceSchema = z.object({
    course_id: z.string(),
    name: z.string().optional(),
    total_hours_absent: z.number(),
    absences: z.array(AbsenceItemSchema)
})

export const AbsencesSummarySchema = z.object({
    term_id: z.string(),
    courses: z.array(CourseAbsenceSchema)
})

export type AbsenceItem = z.infer<typeof AbsenceItemSchema>
export type CourseAbsence = z.infer<typeof CourseAbsenceSchema>
export type AbsencesSummary = z.infer<typeof AbsencesSummarySchema>

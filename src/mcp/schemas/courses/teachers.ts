import { z } from "zod"

export const teacherItemSchema = z.object({
    mio_id: z.string(),
    name: z.string(),
    department: z.string().optional(),
    office: z.string().optional(),
    phone: z.string().optional(),
})

export const teachersSummarySchema = z.object({
    term_id: z.string(),
    teachers: z.array(teacherItemSchema),
})

export type TeacherItem = z.infer<typeof teacherItemSchema>
export type TeachersSummary = z.infer<typeof teachersSummarySchema>

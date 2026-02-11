import { z } from "zod"

export const scheduleItemSchema = z.object({
    title: z.string(),
    course_code: z.string().optional(),
    group: z.string().optional(),
    type: z.union([
        z.enum(["Theorie", "Laboratoire", "Examen"]),
        z.string()
    ]).optional(),
    day_str: z.string(),
    day_schedule: z.number().int().min(0).max(7),
    start_min: z.number().int(),
    end_min: z.number().int(),
    duration_min: z.number().int().optional(),
    rooms: z.array(z.string()).optional(),
    time_str: z.string(),
})

export type ScheduleItem = z.infer<typeof scheduleItemSchema>
export interface Schedule {
    [key: string]: unknown
    term_id: string
    schedule: ScheduleItem[]
}
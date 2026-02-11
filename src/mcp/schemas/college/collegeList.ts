import { z } from "zod"

export const collegeItemSchema = z.object({
    code: z.string(),
    name: z.string(),
    omnivoxUrl: z.string().optional(),
})

export type CollegeItem = z.infer<typeof collegeItemSchema>

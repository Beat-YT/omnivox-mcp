import { z } from "zod"

export const CollegeItemSchema = z.object({
    code: z.string(),
    name: z.string(),
})

export const CollegeListResponseSchema = z.object({
    count: z.number(),
    colleges: z.array(CollegeItemSchema),
})

export type CollegeItem = z.infer<typeof CollegeItemSchema>
export type CollegeListResponse = z.infer<typeof CollegeListResponseSchema>

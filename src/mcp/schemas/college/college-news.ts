import { z } from "zod"

export const collegeNewsItemSchema = z.object({
    id: z.string(),

    title: z.string(),

    content_preview: z.string().optional(),
    content_html: z.string().optional(),

    published_at: z.string().optional(),
    expires_at: z.string().optional(),

    is_active: z.boolean(),
    is_featured: z.boolean(),
    is_urgent: z.boolean(),
})

export type CollegeNewsItem = z.infer<typeof collegeNewsItemSchema>
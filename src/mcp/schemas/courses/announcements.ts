import { z } from "zod"

export const announcementItemSchema = z.object({
    id: z.string(),
    title: z.string(),

    published_at: z.string().optional(),
    expires_at: z.string().optional(),

    is_read: z.boolean(),
    is_visible: z.boolean(),

    html_content: z.string().optional(),
    text_preview: z.string().optional(),

    is_active: z.boolean(),
})

export type AnnouncementItem = z.infer<typeof announcementItemSchema>

export type AnnouncementSummary = {
    term_id: string
    course_id: string
    course_name?: string
    announcements: AnnouncementItem[]
}

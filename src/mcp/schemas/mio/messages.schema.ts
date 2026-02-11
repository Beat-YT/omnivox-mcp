import { z } from "zod"

export const MessageAttachmentSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    size_bytes: z.number(),
    created_at: z.string().optional()
})

export const MessageSchema = z.object({
    id: z.string(),

    subject: z.string().optional(),
    excerpt: z.string().optional(),
    body_html: z.string().optional(),

    sent_at: z.string(),

    sender: z.object({
        id: z.string().optional(),
        name: z.string().optional(),
        number: z.string().optional(),
        type: z.enum(["student", "staff", "org"]).optional()
    }),

    unread: z.boolean().optional(),

    sent_metrics: z.object({
        total_recipients: z.number().optional(),
        total_reads: z.number().optional(),
        any_read: z.boolean().optional()
    }).optional(),

    flags: z.object({
        important: z.boolean(),
        mark_unread: z.boolean()
    }),

    attachments: z.array(MessageAttachmentSchema),

    reply_to_id: z.string().optional(),

    is_draft: z.boolean().optional(),
    is_trash: z.boolean().optional()
})

export const MessagesResponseSchema = z.object({
    messages: z.array(MessageSchema),

    meta: z.object({
        total: z.number(),
        unread: z.number(),
        has_more: z.boolean().optional(),
        server_time: z.string().optional(),
        folder: z.string().optional()
    })
})

export type Message = z.infer<typeof MessageSchema>
export type MessagesResponse = z.infer<typeof MessagesResponseSchema>
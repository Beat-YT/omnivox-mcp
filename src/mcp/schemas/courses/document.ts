import { z } from 'zod';

export const courseDocumentSchema = z.object({
    id: z.string(),

    title: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),

    filename: z.string().optional(),
    extension: z.string().optional(),

    size_bytes: z.number().int().optional(),

    mime_type: z.string().optional(),

    published_at: z.string().optional(),
    viewed_at: z.string().optional(),

    is_viewed: z.boolean().optional(),

    external_url: z.string().optional()
})

export const courseDocumentResponseSchema = z.object({
    term_id: z.string(),
    course_id: z.string(),
    course_name: z.string().optional(),
    documents: z.array(courseDocumentSchema)
})

export type CourseDocument = z.infer<typeof courseDocumentSchema>;
export type CourseDocumentResponse = z.infer<typeof courseDocumentResponseSchema>;
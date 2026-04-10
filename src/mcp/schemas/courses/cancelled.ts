import { z } from "zod";

export const CancelledClassSchema = z.object({
    id: z.string(),
    start: z.string(),
    end: z.string(),
    course_id: z.string(),
    course_name: z.string(),
    teacher: z.string().optional(),
    rooms: z.array(z.string()),
    comment: z.string().optional(),
});

export const CancelledClassesSchema = z.object({
    fetched_at: z.string(),
    cancelled_classes: z.array(CancelledClassSchema),
});

export type CancelledClass = z.infer<typeof CancelledClassSchema>;
export type CancelledClasses = z.infer<typeof CancelledClassesSchema>;

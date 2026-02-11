import { z } from "zod";

export const collegeUpdateItemSchema = z.object({
    service_id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    module: z.string().optional(),
    count: z.number(),
    dismissable: z.boolean(),
});

export const collegeUpdatesSchema = z.object({
    updates: z.array(collegeUpdateItemSchema),
    last_updated: z.string().optional(),
    default_term: z.string().optional(),
    available_terms: z.array(z.string()).optional(),
});

export type CollegeUpdateItem = z.infer<typeof collegeUpdateItemSchema>;
export type CollegeUpdates = z.infer<typeof collegeUpdatesSchema>;

import { z } from "zod"

export const PersonSchema = z.object({
    id: z.string(),
    number: z.string(),
    name: z.string(),
    type: z.enum(["student", "teacher", "employee"]),
    program: z.string().optional(),
})

export const PeopleSearchResponseSchema = z.object({
    results: z.array(PersonSchema),
})

export type Person = z.infer<typeof PersonSchema>
export type PeopleSearchResponse = z.infer<typeof PeopleSearchResponseSchema>

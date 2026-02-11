import { z } from "zod"

export const FolderSchema = z.object({
    id: z.string(),
    label: z.string(),
    type: z.enum([
        "inbox",
        "sent",
        "drafts",
        "flags",
        "trash",
        "custom"
    ]),
    unread_msg_count: z.number(),
    total_msg_count: z.number()
})

export const FoldersResponseSchema = z.object({
    folders: z.array(FolderSchema)
})

export type Folder = z.infer<typeof FolderSchema>
export type FoldersResponse = z.infer<typeof FoldersResponseSchema>
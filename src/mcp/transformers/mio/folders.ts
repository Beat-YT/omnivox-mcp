import { FoldersResponse } from "@schemas/mio/folders.schema"
import { MioFolders } from "@typings/Mio/Folders"


function mapFolderType(id: string) {
    if (id.includes("MioRecu")) return "inbox"
    if (id.includes("MioEnvoye")) return "sent"
    if (id.includes("Brouillon")) return "drafts"
    if (id.includes("Drapeau")) return "flags"
    if (id.includes("Supprimer")) return "trash"
    return "custom"
}

export function transformMioFolders(raw: MioFolders.ResponseModel): FoldersResponse {
    return {
        folders: (raw.ListeFolders ?? []).map((f: any) => ({
            id: f.Id,
            label: f.NomCategorie,
            type: mapFolderType(f.Id),
            unread_msg_count: f.NbMessageNonLu ?? 0,
            total_msg_count: f.NbMessageTotal ?? 0
        }))
    }
}

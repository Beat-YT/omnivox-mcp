import { CommuniquesListeModel } from "@typings/Lea/CommuniquesListeModel"
import { announcementItemSchema, AnnouncementItem, AnnouncementSummary } from "@schemas/courses/announcements"
import { extractHtmlPreview } from "@common/transformHelpers"


export function transformAnnouncements(
    response: CommuniquesListeModel.ResponseModel,
    term_id: string, course_id: string
): AnnouncementSummary {

    const now = Date.now()

    const announcements = response.ListeInfosCommuniques
        .map(communique => {
            if (!communique.IdCommunique || !communique.Titre) {
                return null
            }

            return announcementItemSchema.parse({
                id: String(communique.IdCommunique),
                title: communique.Titre,
                published_at: new Date(communique.DateDebutDiffusion).toISOString(),
                expires_at: new Date(communique.DateFinDiffusion).toISOString(),
                is_read: communique.Visionne,
                is_visible: communique.IsPermetVisionnement,
                html_content: communique.Contenu,
                text_preview: extractHtmlPreview(communique.Contenu, 400),
                is_active:
                    communique.IsPermetVisionnement &&
                    communique.DateFinDiffusion > now,
            } as AnnouncementItem)
        })
        .filter(Boolean) as AnnouncementItem[]

    return {
        term_id,
        course_id,
        course_name: response.NomCours || response.ListeInfosCommuniques[0]?.NomCours || undefined,
        announcements,
    } as AnnouncementSummary
}

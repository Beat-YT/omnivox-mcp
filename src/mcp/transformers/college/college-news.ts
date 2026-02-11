import { extractHtmlPreview, toIso } from "@common/transformHelpers"
import { collegeNewsItemSchema } from "@schemas/college/college-news"
import { Actualite } from "@typings/college"


function isActive(start?: number | null, end?: number | null): boolean {
    const now = Date.now()
    if (start && now < start) return false
    if (end && now > end) return false
    return true
}

export function transformCollegeNews(response: Actualite[]) {

    const items = response.map((raw) => {
        const active = isActive(
            raw.TimestampDateDebutPublication,
            raw.TimestampDateFinPublication
        )

        return collegeNewsItemSchema.parse({
            id: String(raw.IdActualite),
            title: raw.Titre?.trim() ?? "",
            content_html: raw.Contenu ?? raw.Resume,
            content_preview: extractHtmlPreview(raw.Resume || raw.Contenu),
            published_at: toIso(raw.TimestampDateDebutPublication),
            expires_at: toIso(raw.TimestampDateFinPublication),
            is_active: active,
            is_featured: !!raw.IndicateurNouvelleALaUne,
            is_urgent: !!raw.IsMesureUrgence,
        })
    })

    return items;
}

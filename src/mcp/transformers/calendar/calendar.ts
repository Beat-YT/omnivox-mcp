import { toIso } from "@common/transformHelpers"
import { CalendarEvent, CalendarPage, CalendarCategory } from "@schemas/calendar/calendar"
import { CalendrierModel } from "@typings/Calendrier/CalendrierModel"

function computeStatus(startIso: string, endIso?: string | null) {
    const now = Date.now()
    const start = Date.parse(startIso)
    const end = endIso ? Date.parse(endIso) : null

    if (end && now > end) return "past"
    if (!end && now > start) return "past"
    if (now >= start && (!end || now <= end)) return "ongoing"
    return "upcoming"
}

/**
 * Map Omnivox raw type → normalized category
 */
function mapCategory(type: string): CalendarCategory {
    const t = type?.toUpperCase()

    if (t === "ZZCR") return "course_meeting"
    if (t === "TRAV") return "assignment"
    if (t === "EVAL") return "eval"

    if (t === "DEBS") return "semester_start"
    if (t === "FINS") return "semester_end"
    if (t === "FINC") return "grades_deadline"
    if (t === "EVLEA") return "private_event"

    if (["JFER"].includes(t)) return "holiday"

    if (["JPOR", "JEXA", "JREL", "JRES", "ASCO", "JEUF", "JLUN"].includes(t))
        return "institutional"

    return "other"
}

function pickTitle(evt: any) {
    return (
        evt.TitreAffiche ||
        evt.Evenement?.Titre ||
        evt.Evenement?.TitreAng ||
        "Untitled"
    )
}

function pickDescription(evt: any) {
    return (
        evt.DescriptionAffiche ||
        evt.Evenement?.Description ||
        evt.Evenement?.DescriptionAng ||
        undefined
    )
}

function isRealLink(url?: string) {
    return url?.startsWith("http")
}

/**
 * Transform a single raw Omnivox event → normalized CalendarEvent
 */
export function transformCalendarEvent(raw: CalendrierModel.ListeEvenement): CalendarEvent {
    const evt = raw.Evenement;
    const details = evt.Details;

    const title = pickTitle(raw)
    const description = pickDescription(raw)

    const startIso = toIso(evt.TimestampDateEvenement)!
    const endIso = toIso(evt.TimestampDateFin)

    const category = mapCategory(evt.Type)

    return {
        id: String(evt.IdEvenement),
        code: evt.Type ?? "UNKNOWN",

        category,

        title,
        titleEn: evt.TitreAng || undefined,

        description,
        descriptionEn: evt.DescriptionAng || undefined,

        start: startIso,
        end: endIso,

        allDay: !endIso,

        status: computeStatus(startIso, endIso),

        course: details.NoCours && details.NoGroupe
            ? {
                course_id: `${details.NoCours}.${details.NoGroupe}`,
                term_id: details.AnSession || undefined,
                name: details.NomCours || undefined
            }
            : undefined,

        classType: details.TitreTypeComposante || undefined,
        location: details.NoLocal || undefined,

        link: isRealLink(details.LienExterne) ? details.LienExterne : undefined,

        weight: details.Ponderation > 0 ? details.Ponderation : undefined,

        onlineSubmission: details.DepotEnLigne > 0 ? true : undefined,

        assignmentId: details.IdTravail || undefined,

        source: details.IsEvenementLea ? "lea" : "college"
    }
}

/**
 * Transform a full Omnivox calendar page
 */
export function transformCalendarModel(raw: CalendrierModel.ResponseModel): CalendarPage {
    const events = (raw.ListeEvenements ?? []).map(transformCalendarEvent)

    return {
        events,
        hasPreviousPage: !!raw.IndicateurPagePrecedente,
        hasNextPage: !!raw.IndicateurPageSuivante,
        currentPage: raw.DecalagePagination ?? undefined,
        calendarType: raw.TypeCalendrier ?? undefined
    }
}

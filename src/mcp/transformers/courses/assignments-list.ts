import { extractHtmlPreview, toIso } from "@common/transformHelpers"
import {
    assignmentListItemSchema,
    AssignmentListItem,
    AssignmentsList,
} from "@schemas/courses/assignments-list"
import { TravauxListeModel } from "@typings/Lea/TravauxListeModel"

export function transformAssignmentsList(
    response: TravauxListeModel.ResponseModel,
    term_id: string,
    course_id: string,
): AssignmentsList {

    const assignments = response.ListeTravaux
        .map(travail => {
            if (!travail.IDTravail || !travail.Titre) return null

            return assignmentListItemSchema.parse({
                id: travail.IDTravail,
                title: travail.Titre,
                category: travail.NomCategorie ?? undefined,

                published_at: toIso(travail.DateHeureDiffusion),
                due_at: toIso(travail.DateHeureRemise),

                is_visible: !!travail.IsPeutVisualiser,
                is_submission_open: !!travail.IsRemisePermise,
                is_submitted: !!travail.EstRemis,

                allow_late_submission: !!travail.RetardAccepte,

                submitted_count: travail.ListeDepotsTravail?.length ?? 0,
                has_correction: !!travail.ListeCopieCorigee?.length,

                content_preview: extractHtmlPreview(travail.Enonce, 240),
            } as AssignmentListItem)
        })
        .filter(Boolean) as AssignmentListItem[]

    return {
        term_id,
        course_id,
        assignments
    }
}
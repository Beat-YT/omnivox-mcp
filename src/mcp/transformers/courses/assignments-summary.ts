import { TravauxSommaireModel } from "@typings/Lea/TravauxSommaireModel"
import {
    assignmentCourseSummaryItemSchema,
    AssignmentCourseSummaryItem,
    AssignmentsSummary
} from "@schemas/courses/assignments-summary"

export function transformAssignmentsSummary(
    response: TravauxSommaireModel.ResponseModel
): AssignmentsSummary {

    const summary = response.ListeSommaire
        .map(item => {
            if (!item.NoCours || !item.NoGroupe || !item.NomCours) {
                return null
            }

            return assignmentCourseSummaryItemSchema.parse({
                course_id: `${item.NoCours}.${item.NoGroupe}`,
                course_code: item.NoCours,
                course_title: item.NomCours,
                group: item.NoGroupe,

                total_assignments: item.NbEnoncesTotal ?? 0,
                new_assignments_count: item.NbNouveaute ?? 0,
                new_correction_count: item.NouvellesCorrections ?? 0,

                has_new_assignments: !!item.IndicateurNouveauTravaux,
                has_online_submission: (item.DepotEnLigne ?? 0) > 0,

                pending_titles: item.ListeTitreTravauxARemettre?.length
                    ? item.ListeTitreTravauxARemettre
                    : undefined,
            } as AssignmentCourseSummaryItem)
        })
        .filter(Boolean) as AssignmentCourseSummaryItem[]

    return {
        term_id: response.AnSession ?? undefined,
        summary,
    } as AssignmentsSummary
}

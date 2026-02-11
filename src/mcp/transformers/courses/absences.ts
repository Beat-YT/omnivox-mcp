import { toIso } from "@common/transformHelpers"
import { AbsencesSummary } from "@schemas/courses/absences"
import { AbsencesSommaireModel } from "@typings/Lea/AbsencesSommaireModel"

export function transformLeaAbsences(raw: AbsencesSommaireModel.ResponseModel): AbsencesSummary {
    return {
        term_id: raw?.ListeSommaire?.[0]?.AnSession ?? "",
        courses: (raw.ListeSommaire ?? []).map((course: any) => ({
            course_id: `${course.NoCours}.${course.NoGroupe}`,
            name: course.NomCours || undefined,
            total_hours_absent: course.TotalNbHeureAbsence ?? 0,
            absences: (course.ListeAbsences ?? []).map((a: any) => ({
                date: toIso(a.DateAbsence)!,
                hours: a.NbHeureAbs ?? 0
            }))
        }))
    }
}

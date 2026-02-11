import { TeachersSummary } from "@schemas/courses/teachers"
import { EnseignantsSommaireModel } from "@typings/Lea/EnseignantsSommaire"

export function transformTeachers(raw: EnseignantsSommaireModel.ResponseModel): TeachersSummary {
    return {
        term_id: raw.ListeSommaire?.[0]?.AnSession ?? "",
        teachers: (raw.ListeSommaire ?? []).map(t => ({
            mio_id: t.OID,
            name: `${t.Prenom} ${t.Nom}`.trim(),
            department: t.NomDepartement || undefined,
            office: t.EmplacementBureau || undefined,
            phone: t.NoTelephone || undefined,
        }))
    }
}

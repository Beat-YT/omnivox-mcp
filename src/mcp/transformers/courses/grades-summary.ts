import {
    gradeCourseSummaryItemSchema,
    GradeSummaryItem,
    GradesSummary
} from "@schemas/courses/grades-summary"
import { NotesSommaireModel } from "@typings/Lea/NotesSommaireModel"
import { tr } from "zod/v4/locales"

const INVALID_INT = -2147483648

function normalizeScaledPercent(value?: number | null): number | null {
    if (value === undefined || value === null) return null
    if (value === INVALID_INT) return null
    return value / 100
}

function parsePercentString(value?: string | null): number | null {
    if (!value) return null
    const n = Number(value)
    if (!Number.isFinite(n)) return null
    return n
}

function computeStatus(accumulatedWeight: number | null, hasFinal: boolean): "no_data" | "in_progress" | "completed" {
    if (hasFinal) return "completed"
    if (accumulatedWeight === null) return "no_data"
    if (accumulatedWeight >= 99.5) return "completed"
    if (accumulatedWeight > 0) return "in_progress"
    return "no_data"
}

export function transformGradeItem(
    raw: NotesSommaireModel.ListeInfosNote
): GradeSummaryItem {
    const termId = raw.AnSession
    const finalGrade = parsePercentString(raw.NoteFinale)
    const classAverageFinal = parsePercentString(
        raw.MoyenneFinale != null ? String(raw.MoyenneFinale) : null
    )

    const courseAverage = normalizeScaledPercent(raw.Moyenne)
    const courseMedian = normalizeScaledPercent(raw.Mediane)
    const courseStdDev = normalizeScaledPercent(raw.EcartType)

    const projectedGrade = normalizeScaledPercent(
        raw.NoteProjetee ? Number(raw.NoteProjetee) : null
    )
    const projectedCourseAverage = normalizeScaledPercent(raw.MoyenneProjetee)

    const accumulatedWeight = normalizeScaledPercent(
        raw.PourcentAccumul ? Number(raw.PourcentAccumul) : null
    )

    const hasFinalGrade = finalGrade !== null
    const isPassed = !!finalGrade && finalGrade >= 60
    const relativeToClass =
        finalGrade !== null && classAverageFinal !== null
            ? finalGrade - classAverageFinal
            : null

    const status = computeStatus(accumulatedWeight, hasFinalGrade)

    return gradeCourseSummaryItemSchema.parse({
        course_id: `${raw.NoCours}.${raw.NoGroupe}`,
        course_code: raw.NoCours,
        group: raw.NoGroupe,
        title: raw.NomCours,
        term_id: termId,

        final_grade: finalGrade,
        class_average_final: classAverageFinal,

        course_average: courseAverage,
        course_median: courseMedian,
        course_std_dev: courseStdDev,

        projected_grade: projectedGrade,
        projected_course_average: projectedCourseAverage,

        accumulated_weight: accumulatedWeight,
        new_evaluations_count: raw.NouveauEvals ?? 0,

        has_final_grade: hasFinalGrade,
        is_passed: isPassed,
        relative_to_class: relativeToClass,
        status,
    })
}

export function transformGradesSummary(
    response: NotesSommaireModel.ResponseModel,
    term_id?: string
): GradesSummary {

    const courses = response.ListeInfosNotes.map(raw => transformGradeItem(raw))

    return {
        term_id,
        courses,
    }
}

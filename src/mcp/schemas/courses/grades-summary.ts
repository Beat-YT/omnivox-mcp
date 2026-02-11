import { z } from "zod"

export const gradeStatusSchema = z.enum(["no_data", "in_progress", "completed"])

export const gradeCourseSummaryItemSchema = z.object({
    // Identity
    course_id: z.string(),         // IdClasse
    course_code: z.string(),
    group: z.string(),
    title: z.string(),
    term_id: z.string(),

    // performances
    final_grade: z.number().nullable(),          // 0–100, null if not available
    class_average_final: z.number().nullable(),  // 0–100, from MoyenneFinale
    course_average: z.number().nullable(),       // 0–100, from Moyenne/100
    course_median: z.number().nullable(),        // 0–100
    course_std_dev: z.number().nullable(),       // 0–100, scaled

    // Projection (if meaningful)
    projected_grade: z.number().nullable(),      // 0–100, from NoteProjetee/100
    projected_course_average: z.number().nullable(), // 0–100, from MoyenneProjetee/100

    // Progress
    accumulated_weight: z.number().nullable(),   // 0–100, PourcentAccumul/100
    new_evaluations_count: z.number().optional(),

    // LLM helpers
    has_final_grade: z.boolean(),
    is_passed: z.boolean(),                      // assumes passing >= 60
    relative_to_class: z.number().nullable(),    // final_grade - class_average_final
    status: gradeStatusSchema,
})

export const gradesSummary = z.object({
    term_id: z.string().optional(),
    courses: z.array(gradeCourseSummaryItemSchema)
})

export type GradeSummaryItem = z.infer<typeof gradeCourseSummaryItemSchema>
export type GradesSummary = z.infer<typeof gradesSummary>

import { DefaultModel } from "@typings/Lea/DefaultModel";
import { courseItemSchema, CourseItem, CourseSummary } from "@schemas/courses/summary"

export function transformCoursItem(cours: DefaultModel.ListeCour) {
    if (!cours.Titre || !cours.NoCours || !cours.NoGroupe) {
        return null;
    }

    return courseItemSchema.parse({
        id: `${cours.NoCours}.${cours.NoGroupe}`,
        title: cours.Titre,
        course_code: cours.NoCours,
        group: cours.NoGroupe,
        unread_documents: cours.ListeModulesLea.Documents.NotificationsNonConsultes,
        unread_announcements: cours.ListeModulesLea.Communiques.NotificationsNonConsultes,
        unread_assignments: cours.ListeModulesLea.Travaux.NotificationsNonConsultes,
        unread_grades: cours.ListeModulesLea.Notes.NotificationsNonConsultes,
        total_documents: cours.ListeModulesLea.Documents.NotificationsTotal,
        total_announcements: cours.ListeModulesLea.Communiques.NotificationsTotal,
        total_assignments: cours.ListeModulesLea.Travaux.NotificationsTotal,
        total_evals: cours.ListeModulesLea.Notes.NotificationsTotal,
    } as CourseItem)
}

export function transformCoursesSummary(response: DefaultModel.ResponseModel): CourseSummary {
    const courses = response.ListeCours.map(
        c => transformCoursItem(c)
    ).filter(c => !!c) as CourseItem[];

    return {
        term_id: response.AnSession,
        courses: courses,
    };
}
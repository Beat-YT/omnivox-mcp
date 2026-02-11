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
        has_documents: cours.ListeModulesLea.Documents.NotificationsTotal > 0,
        has_announcements: cours.ListeModulesLea.Communiques.NotificationsTotal > 0,
        has_assignments: cours.ListeModulesLea.Travaux.NotificationsTotal > 0,
        has_grades: cours.ListeModulesLea.Notes.NotificationsTotal > 0,
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
import { toIso } from "@common/transformHelpers";
import { CancelledClass, CancelledClasses } from "@schemas/courses/cancelled";
import { CoursAnnuleModel } from "@typings/CoursAnnuleModel";

export function transformCoursAnnule(raw: CoursAnnuleModel.ResponseModel): CancelledClasses {
    const cancelled_classes: CancelledClass[] = (raw.ListeAnnulationCours ?? []).map(a => {
        const day = new Date(a.DateCoursAnnule);
        const y = day.getUTCFullYear();
        const m = day.getUTCMonth();
        const d = day.getUTCDate();

        return {
            id: a.IDAnnulation,
            start: new Date(y, m, d, parseHour(a.HeureDebutAnnulation), parseMinute(a.HeureDebutAnnulation)).toISOString(),
            end: new Date(y, m, d, parseHour(a.HeureFinAnnulation), parseMinute(a.HeureFinAnnulation)).toISOString(),
            course_id: `${a.NoCours}.${a.NoGroupe}`,
            course_name: a.NomCours,
            teacher: a.NomProf || undefined,
            rooms: a.Local ?? [],
            comment: a.CommentaireProf || undefined,
        };
    });

    cancelled_classes.sort((a, b) => a.start.localeCompare(b.start));

    return {
        fetched_at: toIso(raw.DateCoursAnnule) ?? new Date().toISOString(),
        cancelled_classes,
    };
}

function parseHour(hhmm: string): number {
    return parseInt(hhmm.padStart(4, '0').slice(0, 2), 10);
}

function parseMinute(hhmm: string): number {
    return parseInt(hhmm.padStart(4, '0').slice(2), 10);
}

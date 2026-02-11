import { scheduleItemSchema, ScheduleItem, Schedule } from "@schemas/schedule.schema";
import { HoraireModel } from "@typings/HoraireModel";

const days = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "", ""];

export function transformHoraireToSchedule(response: HoraireModel.ResponseHoraire) {
    const scheduleItems = response.HoraireDex.Plages.map(plage => {
        const [hashCode, groupNumber] = plage.Groupes[0].split('|');

        const course = response.HoraireDex.Cours.find(c => c.HashCode.toString() === hashCode);
        const group = response.HoraireDex.Groupes.find(g => g.Numero === groupNumber && g.HashCodeCours.toString() === hashCode);

        const start_min = plage.HeureDebutInt * 60 + plage.MinuteDebutInt;
        const end_min = plage.HeureFinInt * 60 + plage.MinuteFinInt;
        const time_str = `${getTimeStr(plage.HeureDebutInt, plage.MinuteDebutInt)}-${getTimeStr(plage.HeureFinInt, plage.MinuteFinInt)}`;

        return scheduleItemSchema.parse({
            title: plage.TitreCours,
            course_code: course?.Numero,
            group: groupNumber || plage.NumeroCours,
            day_schedule: plage.Jour,
            day_str: days[plage.Jour],
            start_min,
            end_min,
            duration_min: end_min - start_min,
            time_str,
            rooms: plage.Locaux.map(loc => `${loc.Pavillon} ${loc.Numero}`.trim()),
            type: plage.TypePeriode,
        } as ScheduleItem)
    })

    scheduleItems.sort((a, b) => {
        if (a.day_schedule !== b.day_schedule) {
            return a.day_schedule - b.day_schedule;
        }
        return a.start_min - b.start_min;
    });

    return {
        term_id: response.AnSession,
        schedule: scheduleItems
    } as Schedule
}

function getTimeStr(hour: number, minute: number) {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

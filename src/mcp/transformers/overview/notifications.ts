import { Notifications, notificationsSchema } from "@schemas/overview/notifications";
import { AppUpdatesResponse } from "@typings/AppUpdates";

const TITLE_MAP: Record<string, { label: string, title: string }> = {
    'cvir_docu': {
        label: 'Documents',
        title: 'There is one or more new document that have not been opened by the student.',
    },
    'cvir_comm': {
        label: 'Announcements',
        title: 'There is one or more new announcement that have not been opened by the student.',
    },
    'cvir_trav': {
        label: 'Assignments',
        title: 'There is one or more new or updated assignment that have not been opened by the student.',
    },
    'cvir_note': {
        label: 'Grades',
        title: 'There is one or more new or updated grade that have not been opened by the student.',
    },
    'mio': {
        label: 'MIO Messages',
        title: 'There is one or more new MIO message that have not been opened by the student.',
    },
    'SRAE':  {
        label: 'Student Access Centre',
        title: 'There is one or more new notification related to the Student Access Centre (Services adaptés aux étudiants en situation de handicap) that have not been opened by the student.',
    }
};

export function transformNotifications(response: AppUpdatesResponse): Notifications {
    const notifications = response.ListeUpdates
        .filter(u => u.NbNotifications > 0)
        .map(u => {

            const titleInfo = TITLE_MAP[u.IdService];

            return {
                service_id: u.IdService,
                label: titleInfo?.label || u.NomRetour || u.IdService,
                count: u.NbNotifications,
                title: titleInfo?.title || u.Nom?.trim() || undefined,
                description: u.Description?.trim() || undefined,
            }
        });

    return notificationsSchema.parse({ notifications });
}

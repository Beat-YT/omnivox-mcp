import { toIso } from "@common/transformHelpers";
import { collegeUpdatesSchema } from "@schemas/college/updates";
import { AppUpdatesResponse } from "@typings/AppUpdates";

export function transformCollegeUpdates(response: AppUpdatesResponse) {
    const updates = response.ListeUpdates.map((raw) => ({
        service_id: raw.IdService,
        title: raw.Nom?.trim() ?? "",
        description: raw.Description?.trim() || undefined,
        category: raw.NomRetour?.trim() || undefined,
        module: raw.ModuleMobile || undefined,
        count: raw.NbNotifications,
        dismissable: raw.IndicateurPeutDismiss,
    }));

    return collegeUpdatesSchema.parse({
        updates,
        last_updated: toIso(response.DateHeureDernierMiseAJour),
        default_term: response.AnSessionDisponible?.AnSessionDefault,
        available_terms: response.AnSessionDisponible?.AnSessionDisponible,
    });
}

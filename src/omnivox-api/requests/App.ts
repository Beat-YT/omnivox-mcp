import { CollegeDef } from "@typings/college";
import { AppUpdatesResponse } from "@typings/AppUpdates";
import { omnivox } from "../puppet";

export function UpdateListeCollegeUser() {
    return omnivox.postJson<CollegeDef[]>(
        '/Mobl/App/UpdateListeCollegeUser',
        { }
    );
}

export function GetAppUpdates(term?: string) {
    return omnivox.postJson<AppUpdatesResponse>(
        '/Mobl/App/Notification',
        { anSession: term || null, isFirstLoadQD9: true }
    );
}

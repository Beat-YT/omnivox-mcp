import { CollegeDef } from "@typings/college";
import { AppUpdatesResponse } from "@typings/AppUpdates";
import { makeSkytechRequest } from "../puppet/index";

export function UpdateListeCollegeUser() {
    return makeSkytechRequest<CollegeDef[]>(
        '/Mobl/App/UpdateListeCollegeUser',
        { }
    );
}

export function GetAppUpdates(term?: string) {
    return makeSkytechRequest<AppUpdatesResponse>(
        '/Mobl/App/Notification',
        { anSession: term || null, isFirstLoadQD9: true }
    );
}

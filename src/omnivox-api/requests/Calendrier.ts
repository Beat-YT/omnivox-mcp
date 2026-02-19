import { makeSkytechRequest } from "../puppet/index";
import { CalendrierModel } from "@typings/Calendrier/CalendrierModel";

export function GetCalendrierModel(page: number = 0) {
    return makeSkytechRequest<CalendrierModel.ResponseModel>(
        '/Mobl/Calendrier/GetCalendrierModel',
        {
            "decalagePagination": page,
            "typeCalendrier": "scolaire",
            "anSession": "",
            "coursGroupe": "",
            "filtre": "choix_tous",
            "filtresDisabled[0].Key": "CalScolaire",
            "filtresDisabled[0].Value": false,
            "filtresDisabled[1].Key": "Lea",
            "filtresDisabled[1].Value": false,
            "filtresDisabled[2].Key": "Perso",
            "filtresDisabled[2].Value": false,
            "filtresDisabled[3].Key": "Communaute",
            "filtresDisabled[3].Value": true,
            "filtresDisabled[4].Key": "Cours",
            "filtresDisabled[4].Value": false,
            "filtresDisabled[5].Key": "Examen",
            "filtresDisabled[5].Value": true,
            "filtresDisabled[6].Key": "RendezVous",
            "filtresDisabled[6].Value": true
        }
    );
}

export function SetCalendarFilters(filters: any) {
    return makeSkytechRequest<void>(
        '/Mobl/College/SetFiltre',
        filters
    );
}

export function FirstLoadTest() {
    return makeSkytechRequest(
        '/Mobl/College/EvenementsWeb_GetFirstLoad',
        {}
    );
}

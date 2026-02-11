import { HoraireModel } from "@typings/HoraireModel";
import { makeSkytechRequest } from "../puppet/index";

export function GetHoraireModel(term?: string) {
    return makeSkytechRequest<HoraireModel.ResponseHoraire>(
        '/Mobl/Horaire/GetHoraireModel',
        { AnSession: term || null }
    );
}

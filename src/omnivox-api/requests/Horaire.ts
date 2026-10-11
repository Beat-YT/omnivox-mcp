import { HoraireModel } from "@typings/HoraireModel";
import { omnivox } from "../puppet";

export function GetHoraireModel(term?: string) {
    return omnivox.postJson<HoraireModel.ResponseHoraire>(
        '/Mobl/Horaire/GetHoraireModel',
        { AnSession: term || null }
    );
}

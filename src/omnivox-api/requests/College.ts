import { Actualite } from "@typings/college";
import { omnivox } from "../puppet";

export function GetListeActualite(count: number = 21) {
    return omnivox.postJson<Actualite[]>(
        '/Mobl/College/ListeActualite',
        { NombreItem: count, ReferenceNouvelle: null }
    );
}

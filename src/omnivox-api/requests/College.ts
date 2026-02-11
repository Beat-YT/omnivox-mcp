import { Actualite } from "@typings/college";
import { makeSkytechRequest } from "../puppet/index";

export function GetListeActualite(count: number = 21) {
    return makeSkytechRequest<Actualite[]>(
        '/Mobl/College/ListeActualite',
        { NombreItem: count, ReferenceNouvelle: null }
    );
}

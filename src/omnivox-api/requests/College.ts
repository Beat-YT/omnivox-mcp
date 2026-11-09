import { Actualite } from "@typings/college";
import { omnivox } from "../puppet";

/** Latest news, or the news published before `afterId` when paging. */
export function GetListeActualite(count: number = 21, afterId?: string) {
    return omnivox.postJson<Actualite[]>(
        '/Mobl/College/ListeActualite',
        { NombreItem: count, ReferenceNouvelle: afterId ?? null }
    );
}

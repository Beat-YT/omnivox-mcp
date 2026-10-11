import { ResponseEnvelope } from "../ResponseEnvelope";

export namespace EnseignantsSommaireModel {
    export interface ResponseModel extends ResponseEnvelope {
        ListeSommaire: ListeSommaire[];
        AnSessionDisponible: AnSessionDisponible;
    }

    export interface AnSessionDisponible {
        AnSessionDisponible: string[];
        AnSessionDefault: string;
    }

    export interface ListeSommaire {
        AnSession: string;
        Nom: string;
        Prenom: string;
        OID: string;
        DesactiverMIO: string;
        EmplacementBureau: string;
        NomDepartement: string;
        NoTelephone: string;
    }
}
import { ResponseEnvelope } from "../ResponseEnvelope";

export namespace AbsencesSommaireModel {
    export interface ResponseModel extends ResponseEnvelope {
        ListeSommaire: ListeSommaire[];
        AnSessionDisponible: AnSessionDisponible;
    }

    export interface AnSessionDisponible {
        AnSessionDisponible: string[];
        AnSessionDefault: string;
    }

    export interface ListeSommaire {
        NoDA: string;
        NoCours: string;
        NoGroupe: string;
        NomCours: string;
        AnSession: string;
        TotalNbHeureAbsence: number;
        ListeAbsences: ListeAbsence[];
    }

    export interface ListeAbsence {
        NoDA: string;
        NoCours: string;
        NoGroupe: string;
        NomCours: string;
        AnSession: string;
        NbHeureAbs: number;
        DateAbsence: number;
        TimeStampDateAbsence: number;
    }
}
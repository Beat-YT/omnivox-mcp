import { ResponseEnvelope } from "../ResponseEnvelope";

export namespace NotesSommaireModel {
    export interface ResponseModel extends ResponseEnvelope {
        ListeInfosNotes: ListeInfosNote[];
        AnSessionDisponible: AnSessionDisponible;
    }

    export interface AnSessionDisponible {
        AnSessionDisponible: string[];
        AnSessionDefault: string;
    }

    export interface ListeInfosNote {
        AnSession: string;
        IdClasse: string;
        NoCours: string;
        NoGroupe: string;
        NomCours: string;
        Moyenne: number;
        Mediane: number;
        EcartType: number;
        MoyenneProjetee: number;
        MedianeProjetee: number;
        NoteFinale: string;
        MoyenneFinale: null | string;
        NotePonderee: string;
        NoteProjetee: string;
        PourcentAccumul: string;
        NouveauEvals: number;
    }
}
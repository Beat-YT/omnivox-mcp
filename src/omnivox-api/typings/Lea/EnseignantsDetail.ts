import { ResponseEnvelope } from "../ResponseEnvelope";

export namespace EnseignantsDetailModel {
    export interface ResponseModel extends ResponseEnvelope {
        InfosDetailsEnseignants: InfosDetailsEnseignants;
    }

    export interface InfosDetailsEnseignants {
        ListePeriodesDisponibites: any[];
        NomProf: string;
        Nom: string;
        Prenom: string;
        AnSession: string;
        EmplacementBureau: string;
        NomDepartement: string;
        NumeroDepartement: null;
        NoTelephone: string;
        NoTelephoneSecondaire: string;
        SiteWeb: string;
        Courriel: string;
        ListeJourSemaine: number[];
        ListeAnSessionCours: ListeAnSessionCour[];
    }

    export interface ListeAnSessionCour {
        AnSession: string;
        Cours: Cour[];
    }

    export interface Cour {
        NoCours: string;
        NomCours: string;
    }
}
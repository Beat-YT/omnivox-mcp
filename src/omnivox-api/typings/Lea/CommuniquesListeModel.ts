import { ResponseEnvelope } from "../ResponseEnvelope";

export namespace CommuniquesListeModel {
    export interface ResponseModel extends ResponseEnvelope {
        ListeInfosCommuniques: ListeInfosCommunique[];
        NoCours: null;
        NoGroupe: null;
        AnSession: null;
        NomCours: null;
    }

    export interface ListeInfosCommunique {
        IdCommunique: number;
        Titre: string;
        Contenu: string;
        DateDebutDiffusion: number;
        TimeStampDateDebutDiffusion: number;
        DateFinDiffusion: number;
        NoCours: string;
        NoGroupe: string;
        NomCours: string;
        Visionne: boolean;
        IsPermetVisionnement: boolean;
    }

}
import { ResponseEnvelope } from "../ResponseEnvelope";

export namespace DocumentsListeModel {
    export interface ResponseModel extends ResponseEnvelope {
        ListeDocuments: ListeDocument[];
        NoCours: null;
        NoGroupe: null;
        NomCours: null;
    }

    export interface ListeDocument {
        IdDocCoursDocument: string;
        NoCours: string;
        NoGroupe: string;
        NomCours: string;
        Titre: string;
        TitreCategorie: string;
        NomDocument: string;
        Extension: string;
        TailleOctet: number;
        ContentType: string;
        DateDebutDistribution: string;
        DateDebutDistributionDateTime: number;
        TimeStampDateDebutDistribution: number;
        DateFinDistribution: string;
        DateFinDistributionDateTime: number;
        TimeStampDateFinDistribution: null;
        DateConsultation: string;
        DateConsultationDateTime: number;
        TimeStampDateConsultation: number;
        Description: string;
        OrdreCategorie: number;
        OrdreDocument: number;
        DateLectureDocument: number;
        TimeStampDateLectureDocument: null;
        IndicateurCategorieRetracte: boolean;
        IndicateurTelechargementPartiel: number;
        IndicateurDocumentVisualise: boolean;
        ListeDocumentFichier: null;
        IsPeutVisualiser: boolean;
        TypeDocument: number;
        TypeLien: string;
        TagIcone: string;
        UrlLienExterne: string;
    }
}
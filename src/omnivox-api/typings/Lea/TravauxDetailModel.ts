export namespace TravauxDetailModel {
    export interface ResponseModel {
        Updating: boolean;
        IsPeriodeArret: boolean;
        NaviguerPage: null;
        Travail: Travail;
        InfosAutoLoginCvir: InfosAutoLoginCvir;
        DateRetourSysteme: number;
        CacheConfig: CacheConfig;
        IsAvailable: boolean;
    }

    export interface CacheConfig {
        ListeCleCacheOverride: any[];
        TempsCache: number;
    }

    export interface InfosAutoLoginCvir {
        SID: string;
        UrlLea: string;
        TKSEncrypte: null;
        NomCookieTKS: null;
    }

    export interface Travail {
        ListeDepotsTravail: ListeDepotsTravail[];
        ListeEnonce: any[];
        ListeDocumentsTravail: Liste[];
        ListeCopieCorigee: Liste[];
        IDTravail: string;
        Titre: string;
        NomCategorie: string;
        DepotEnLigne: number;
        RetardAccepte: boolean;
        DetailRemiseNonSysteme: string;
        DateHeureRemise: number;
        TimeStampDateHeureRemise: number;
        Enonce: string;
        DateHeureDiffusion: number;
        TimeStampDateHeureDiffusion: number;
        AutorisePlusieursRemises: boolean;
        TitreCours: null;
        DetailRemiseAlternatifElectronique: string;
        IsTravailNonConsulte: boolean;
        IsPeutVisualiser: boolean;
        RangCategorie: number;
        RangTravail: number;
        IsRemisePermise: boolean;
        IsRemiseEnRetardPermise: boolean;
        EstRemis: boolean;
    }

    export interface Liste {
        IdTravail: string;
        IDDocumentTravail: null | string;
        IDDepotEtudiant: null | string;
        NomFichier: string;
        TailleOctet: number;
        ContentType: string;
        Extension: string;
        DatePremConsultDocEtudiant: number;
        TimeStampDatePremConsultDocEtudiant: number;
        DateDepot: number;
        TimeStampDateDepot: number;
    }

    export interface ListeDepotsTravail {
        IdTravail: string;
        IDDepotEtudiant: string;
        NomFichierDepotEtudiant: string;
        TailleOctetDepotEtudiant: number;
        CommentaireDepotEtudiant: string;
        ContentTypeDepotEtudiant: string;
        DateHeureTelechargementEnseignant: number;
        TimeStampDateHeureTelechargementEnseignant: number;
        DateDepotEtudiant: number;
        TimeStampDateDepotEtudiant: number;
        Extension: string;
    }
}
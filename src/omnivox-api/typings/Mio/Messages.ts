export namespace MioModel {
    export interface ResponseModel {
        Updating: boolean;
        IsPeriodeArret: boolean;
        NaviguerPage: null;
        ListeMessages: ListeMessage[];
        IsUpdateRequired: boolean;
        DateHeureServeur: number;
        NbMessagesTotal: number;
        NbMessagesNonLus: number;
        AfficherMessagesCategorie: boolean;
        IsMioBloque: boolean;
        UtilisationQuota?: number;
        DateRetourSysteme: number;
        CacheConfig: CacheConfig;
        IsAvailable: boolean;
    }

    export interface CacheConfig {
        ListeCleCacheOverride: any[];
        TempsCache: number;
    }

    export interface ListeMessage {
        HasAttachment: boolean;
        NomCompletEnvoyeur: string;
        TitreAfficheEnvoyeur: string;
        NomRecepteur: null;
        PrenomRecepteur: null;
        NomCompletRecepteur: string;
        IndicateurLocal: boolean;
        TailleAttachements: number;
        Id: string;
        Sujet: string;
        TimestampDateEnvoi: number;
        NbAttachements: number;
        ListeDestinataires: ListeDestinataire[];
        OIDEnvoyeur: string;
        NomEnvoyeur: string;
        PrenomEnvoyeur: string;
        NumeroEnvoyeur: string;
        CouleurProfileEnvoyeur: null;
        DateFinAbsenceEnvoyeur: number;
        DateFinAbsenceEnvoyeurDescription: string;
        IsEnvoyeurSearchable: boolean;
        ExtraitMessage: string;
        Message: string;
        Unread: boolean;
        Indicateurs: Indicateurs;
        NbDestinataires: number;
        AffichePhoto: boolean;
        AfficheNoDa: boolean;
        OIDRecepteur: null;
        Attachements: Attachement[];
        Images: null;
        MioEnvoi: boolean;
        IsDansCorbeille: boolean;
        IDMessageReply: string;
        DerniereAction: number;
        NomCategorie: string;
        AfficheDestinataire: boolean;
        TypeIndividu: number;
        ImageTypeIndividu: string;
        IsPeutVisualiser: boolean;
        NbLectures: number;
        IsIncludeOriginal: boolean;
        IsBrouillon: boolean;
    }

    export interface Attachement {
        IDFichierAttachement: string;
        IDMessage: string;
        NomFichier: string;
        ContentType: string;
        TailleOctet: number;
        DateHeureCreation: number;
        Etat: number;
        Contenu: null;
    }

    export interface Indicateurs {
        Drapeau: boolean;
        ARelire: boolean;
    }

    export interface ListeDestinataire {
        OID: string;
        NomComplet: string;
        NomFormat: string;
        TypeIndividu: string;
        DateVisualisation: number;
        DateFinAbsenceString: null | string;
        DateFinAbsence: number;
        IsAbsent: boolean;
        NomCompletAvecAbsence: null;
        IsSearchable: boolean;
        Numero: null | string;
    }
}
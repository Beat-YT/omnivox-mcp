export namespace CommuniquesListeModel {
    export interface ResponseModel {
        ListeInfosCommuniques: ListeInfosCommunique[];
        Updating: boolean;
        IsPeriodeArret: boolean;
        NaviguerPage: null;
        NoCours: null;
        NoGroupe: null;
        AnSession: null;
        NomCours: null;
        DateRetourSysteme: number;
        CacheConfig: CacheConfig;
        IsAvailable: boolean;
    }

    export interface CacheConfig {
        ListeCleCacheOverride: any[];
        TempsCache: number;
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
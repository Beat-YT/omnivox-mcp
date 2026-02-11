export namespace MioFolders {
    export interface ResponseModel {
        ListeFolders: ListeFolder[];
        Updating: boolean;
        IsPeriodeArret: boolean;
        NaviguerPage: null;
        DateRetourSysteme: number;
        CacheConfig: CacheConfig;
        IsAvailable: boolean;
    }

    export interface CacheConfig {
        ListeCleCacheOverride: any[];
        TempsCache: number;
    }

    export interface ListeFolder {
        Id: string;
        IdCategorie: string;
        NomCategorie: string;
        NomCategorieCourt: string;
        Image: string;
        NbMessageNonLu: number;
        NbMessageTotal: number;
    }
}
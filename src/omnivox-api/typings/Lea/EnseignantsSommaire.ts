export namespace EnseignantsSommaireModel {
    export interface ResponseModel {
        ListeSommaire: ListeSommaire[];
        Updating: boolean;
        IsPeriodeArret: boolean;
        NaviguerPage: null;
        AnSessionDisponible: AnSessionDisponible;
        DateRetourSysteme: number;
        CacheConfig: CacheConfig;
        IsAvailable: boolean;
    }

    export interface AnSessionDisponible {
        AnSessionDisponible: string[];
        AnSessionDefault: string;
    }

    export interface CacheConfig {
        ListeCleCacheOverride: any[];
        TempsCache: number;
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
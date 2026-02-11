export namespace AbsencesSommaireModel {
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
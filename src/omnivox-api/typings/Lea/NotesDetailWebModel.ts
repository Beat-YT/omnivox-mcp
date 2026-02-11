export namespace NotesDetailWebModel {
    export interface ResponseModel {
        InfosAutoLoginCvir: InfosAutoLoginCvir;
        NoteEvaluationWeb: NoteEvaluationWeb;
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

    export interface InfosAutoLoginCvir {
        SID: string;
        UrlLea: string;
        TKSEncrypte: null;
        NomCookieTKS: null;
    }

    export interface NoteEvaluationWeb {
        Enseignants: string[];
    }
}
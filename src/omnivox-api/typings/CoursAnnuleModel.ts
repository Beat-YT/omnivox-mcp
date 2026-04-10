export namespace CoursAnnuleModel {
    export interface ResponseModel {
        ListeAnnulationCours: AnnulationCours[];
        DateCoursAnnule: number;
        Updating: boolean;
        IsPeriodeArret: boolean;
        NaviguerPage: null;
        IndicateurAucunCoursAnnule: boolean;
        DateRetourSysteme: number;
        CacheConfig: CacheConfig;
        IsAvailable: boolean;
    }

    export interface AnnulationCours {
        DateCoursAnnule: number;
        HeureDebutAnnulation: string;
        HeureFinAnnulation: string;
        NoCours: string;
        NoGroupe: string;
        NomCours: string;
        NomProf: string;
        Local: string[];
        CommentaireProf: string;
        HasCommentaireProfTexte: boolean;
        DureeCommentaireProf: number | null;
        FichierCommentaireProf: string;
        HasCommentaireProfVocal: boolean;
        IDAnnulation: string;
        DateAbs: number;
    }

    export interface CacheConfig {
        ListeCleCacheOverride: string[];
        TempsCache: number;
    }
}

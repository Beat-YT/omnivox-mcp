export namespace NotesSommaireModel {
    export interface ResponseModel {
        ListeInfosNotes: ListeInfosNote[];
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

    export interface ListeInfosNote {
        AnSession: string;
        IdClasse: string;
        NoCours: string;
        NoGroupe: string;
        NomCours: string;
        Moyenne: number;
        Mediane: number;
        EcartType: number;
        MoyenneProjetee: number;
        MedianeProjetee: number;
        NoteFinale: string;
        MoyenneFinale: null | string;
        NotePonderee: string;
        NoteProjetee: string;
        PourcentAccumul: string;
        NouveauEvals: number;
    }
}
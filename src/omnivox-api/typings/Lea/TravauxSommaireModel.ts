export namespace TravauxSommaireModel {
    export interface ResponseModel {
        ListeSommaire: ListeSommaire[];
        Updating: boolean;
        IsPeriodeArret: boolean;
        NaviguerPage: null;
        AnSession: string;
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
        ListeTitreTravauxARemettre: any[];
        IdCoursGroupe: number;
        NoCours: string;
        NoGroupe: string;
        NomCours: string;
        NbEnoncesTotal: number;
        NouvellesCorrections: number;
        NbNouveaute: number;
        IndicateurNouveauTravaux: boolean;
        DepotEnLigne: number;
    }
}
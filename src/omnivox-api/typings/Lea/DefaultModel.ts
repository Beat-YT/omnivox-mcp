export namespace DefaultModel {
    export interface ResponseModel {
        AnSessionDisponible: AnSessionDisponible;
        AnSession: string;
        InfoCoursGroupeSelectionne: null;
        IndexInfoCoursGroupeSelectionne: number;
        ListeCours: ListeCour[];
        ProchainCours: ProchainCours;
        HasError: boolean;
        Updating: boolean;
        IsPeriodeArret: boolean;
        NaviguerPage: null;
        IsClasseADistanceDisponible: boolean;
        IsCoursDiffereDisponible: boolean;
        IsEtudiant: boolean;
        DateRetourSysteme: number;
        CacheConfig: CacheConfig;
        IsAvailable: boolean;
    }

    export interface AnSessionDisponible {
        AnSessionDisponible: string[];
        AnSessionDefault: string;
    }

    export interface CacheConfig {
        ListeCleCacheOverride: string[];
        TempsCache: number;
    }

    export interface ListeCour {
        IdCoursGroupe: number;
        Titre: null | string;
        NoCours: null | string;
        NoGroupe: null | string;
        ListeModulesLea: { [key: string]: ListeModulesLeaValue };
        TagCoursGroupeCoursDiffere: string;
    }

    export interface ListeModulesLeaValue {
        NotificationsNonConsultes: number;
        NotificationsTotal: number;
        NomIcone: string;
        FormatModuleMobile: null | string;
        TextMsgDictio: string;
        LienLea: null | string;
        LienPortail: null | string;
        IdHtml: null;
        Ordre: number;
        EstBloque: boolean;
    }

    export interface ProchainCours {
        IdCoursGroupe: number;
        Titre: null;
        NoCours: null;
        NoGroupe: null;
        ListeModulesLea: ProchainCoursListeModulesLea;
        TagCoursGroupeCoursDiffere: string;
    }

    export interface ProchainCoursListeModulesLea {
    }
}
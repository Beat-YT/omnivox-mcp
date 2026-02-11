export namespace CalendrierModel {
    export interface ResponseModel {
        ListeEvenements: ListeEvenement[];
        Updating: boolean;
        IsPeriodeArret: boolean;
        NaviguerPage: null;
        PositionNouvelleAujourdhui: number;
        IndicateurPagePrecedente: boolean;
        IndicateurPageSuivante: boolean;
        TypeCalendrier: string;
        AnSession: null;
        CoursGroupe: null;
        IsTutoratInstalle: boolean;
        IsServicesAdaptesInstalle: boolean;
        IsHoraireExamenInstalle: boolean;
        ListeTypes: string[];
        HoraireDisponible: boolean;
        IsOmnivoxV19: boolean;
        DecalagePagination: number;
        ClasseDistanceDisponible: boolean;
        AnSessionDisponible: null;
        DateRetourSysteme: number;
        CacheConfig: CacheConfig;
        IsAvailable: boolean;
    }

    export interface CacheConfig {
        ListeCleCacheOverride: any[];
        TempsCache: number;
    }

    export interface ListeEvenement {
        Evenement: Evenement;
        EstTermine: boolean;
        EstEnCours: boolean;
        EstPeriode: boolean;
        EstAnneeDifferente: boolean;
        EstPeriodeMemeJournee: boolean;
        TypeAffiche: null;
        TitreAffiche: string;
        DescriptionAffiche: null | string;
    }

    export interface Evenement {
        IdEvenement: string;
        Type: string;
        Titre: string;
        Description: string;
        TitreAng: string;
        DescriptionAng: string;
        TimestampDateEvenement: number;
        TimestampDateFin: number;
        Details: Details;
        EstTermine: boolean;
        EstEnCours: boolean;
        EstSeulementGrille: boolean;
        PositionJour: string;
    }

    export interface Details {
        LienExterne: string;
        TitreCommunaute: null | string;
        URLCommunaute: null;
        IdWebPart: string;
        NoCours: null | string;
        NoGroupe: null | string;
        AnSession: null;
        NomCours: null;
        IdDocument: null;
        IdEvaluation: number;
        Ponderation: number;
        IdTravail: null;
        ModeRemise: number;
        IdRencontreTutorat: null;
        TypeParticipationTutorat: number;
        NomAutreParticipantTutorat: null;
        URLMioAutreParticipantTutorat: null;
        IndicateurActiviteTutorat: boolean;
        IndicateurAfficheQDN: boolean;
        IdRencontreServicesAdaptes: null;
        URLMio: null;
        NomMio: null;
        NoLocal: null | string;
        IsCoursV19: boolean;
        URLMio2: null;
        NomMio2: null;
        IsEvenementLea: boolean;
        IsEvenementPriveLea: boolean;
        DepotEnLigne: number;
        DetailRemiseNonSysteme: null;
        DetailRemiseAlternatifElectronique: null;
        StatutDiffusion: number;
        PublicCible: null;
        RangAffichage: number;
        PossedeImage: boolean;
        IDGroupe: number;
        TypePeriode: null;
        ModeParticipation: null | string;
        TitreTypeComposante: null | string;
        TypeEnseignement: null | string;
        IsMultiCoursGroupes: boolean;
        NoCoursGroupesFormat: null;
    }
}
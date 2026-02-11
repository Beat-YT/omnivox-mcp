export namespace HoraireModel {
    export interface ResponseHoraire {
        AnSession: string;
        InfoAnSessionDisponible: InfoAnSessionDisponible;
        HoraireDex: HoraireDex;
        CoursInactifLea: any[];
        Updating: boolean;
        IsPeriodeArret: boolean;
        NaviguerPage: null;
        CodeRetentionMessage: null;
        DateRetourSysteme: number;
        CacheConfig: CacheConfig;
        IsAvailable: boolean;
    }

    export interface CacheConfig {
        ListeCleCacheOverride: string[];
        TempsCache: number;
    }

    export interface HoraireDex {
        ListeVolumes: any[];
        HoraireSemaineDisponible: boolean;
        Plages: Plage[];
        Cours: Cour[];
        Groupes: Groupe[];
        RegroupementsCours: null;
        ParametreHoraireCaseCours: ParametreHoraireCaseCours;
        InformationsHoraire: InformationsHoraire;
        IndicateurRecuperationRequise: boolean;
        ImageClaraSemaine: null;
        ImageClaraSession: null;
        URLImageClaraSession: null;
        IndicateurAffichageSemaine: boolean;
        HoraireDisponible: boolean;
        RetourListeCours: string;
        ContratReussiteASigner: boolean;
    }

    export interface Cour {
        Numero: string;
        Titre: string;
        Groupes: string[];
        Classes: Class[];
        EpreuveSynthese: boolean;
        ListeVolumes: any[];
        IndicateurHoraireSemaine: string;
        HashCode: number;
    }

    export interface Class {
        IsMultiCours: boolean;
        Groupes: string[];
        ID: string;
        ServEns: string;
    }

    export interface Groupe {
        Numero: string;
        Titre: string;
        DateDebut: number;
        DateFin: number;
        HashCodeCours: number;
        Messages: Message[];
        ServEns: string;
        Campus: string;
        Profs: Prof[];
        NombreHeuresContact: number;
    }

    export interface Message {
        Contenu: string;
        Titre: string;
        Numero: number;
        DocumentAssocie: string;
    }

    export interface Prof {
        Nom: string;
        Prenom: string;
        NoEnseignant: null;
        OIDEnseignant: string;
    }

    export interface InformationsHoraire {
        MessagesHoraire: any[];
        InformationCasier: InformationCasier;
        NomAPI: string;
        EtatHoraire: string;
        StatutHoraire: null;
        StatutEtudiant: string;
        FuseauHoraire: string;
        ListeCours: null;
        InfoSupp: null;
    }

    export interface InformationCasier {
        NumeroCasier: string;
        NomPartenaireCasier: string;
        PrenomPartenaireCasier: string;
        NumTelephonePartenaireCasier: string;
        NumEtudiantPartenaireCasier: string;
        CombinaisonCadenasCasier: string;
    }

    export interface ParametreHoraireCaseCours {
        AffNumeroCours: boolean;
        AffTitreCours: boolean;
        AffNumeroGroupe: boolean;
        AffLocal: boolean;
        AffEnseignant: boolean;
        AffTypePeriode: boolean;
        AffHeureFinPeriode: boolean;
    }

    export interface Plage {
        Id: number;
        NumeroCoursAffiche: null;
        EstEnConflit: boolean;
        Jour: number;
        HeureDebut: number;
        HeureFin: number;
        NoPeriodeJourDebut: number;
        NoPeriodeJourFin: number;
        DateDebut: number;
        DateFin: number;
        Locaux: Locaux[];
        Groupes: string[];
        TypePeriode: string;
        IDUniteOrg: number;
        IdRencontre: number;
        TitreCours: string;
        NumeroCours: string;
        TypeDonnee: "COURS";
        PrenomProf: null;
        NomProf: null;
        NumeroProf: null;
        OidProf: null;
        Profs: Prof[];
        HeureDebutInt: number;
        MinuteDebutInt: number;
        HeureFinInt: number;
        MinuteFinInt: number;
        IndicateurPossedeMessageGroupe: boolean;
        ModeParticipation: "P";
        IsPossedeSeancesRedefinis: boolean;
        ModeParticipationRedefinis: null;
        ModeParticipationCourant: "P";
        AnSession: string;
        InfoClasseDistance: string;
        TypeEnseignement: "S";
        TypeEnseignementRedefinis: null;
        TypeEnseignementCourant: "S";
        IsPossedeSeancesRedefinisTypeEnseignement: boolean;
    }

    export interface Locaux {
        Numero: string;
        Pavillon: string;
    }

    export interface InfoAnSessionDisponible {
        AnSessionDisponible: string[];
        AnSessionDefault: string;
    }

}
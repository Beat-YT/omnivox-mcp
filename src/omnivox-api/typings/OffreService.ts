export interface ServiceMenuItem {
    Id: string;
    CodeModule: string;
    Module: string | null;
    Texte: string;
    Description: string;
    OrdreAffichage: number;
    UrlService: string;
    EstDisponibleMenu: boolean;
    EstActif: boolean;
    EstBloque: boolean;
    RaisonBloque: string | null;
    EstModuleMobile: boolean;
    EstModuleResponsive: boolean;
    EstDisponibleOffline: boolean;
    VersionMinimum: string | null;
    ModuleParent: string | null;
    DateRetour: number;
    Image: string | null;
    ImageMenu: string | null;
    ImageSelected: string | null;
    IconeService: number;
    IconeServiceString: string;
    RestoreLevels: string;
}

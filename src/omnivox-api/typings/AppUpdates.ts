export interface AppUpdatesResponse {
    ListeUpdates: UpdateItem[];
    DateHeureDernierMiseAJour: number;
    IsConnected: boolean;
    Version: string | null;
    ChargerInfoSupSavq: boolean;
    AnSessionDisponible: {
        AnSessionDisponible: string[];
        AnSessionDefault: string;
    };
}

export interface UpdateItem {
    ModuleMobile: string | null;
    NbNotifications: number;
    OrdreAffichage: number;
    IdService: string;
    Nom: string;
    NomMobile: string | null;
    Description: string | null;
    UrlService: string | null;
    Source: string | null;
    ListeIDQuoiDeNeuf: string;
    Couleur: string | null;
    CouleurSolid: string | null;
    SVGHTMLMarkup: string | null;
    NomRetour: string | null;
    Image: number;
    IndicateurPeutDismiss: boolean;
}

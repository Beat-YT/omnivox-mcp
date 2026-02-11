export interface CollegeDef {
    CodeCollege: string;
    UrlCollege: string;
    NomCollege: string;
}

export interface Actualite {
    IdActualite: string;
    OIDNews: string;
    Titre: string;
    Source: string;
    SourceURL: string;
    Resume: string;
    ListeImage: any[];
    Contenu: string;
    TimestampDateDebutPublication: number;
    TimestampDateFinPublication: number;
    TimestampDateModification: number;
    TimestampDateCreation: number;
    IsCollapse: boolean;
    NbCommentaires: number;
    UrlVideo: string;
    IsNouvelleCollege: boolean;
    IndicateurNouvelleALaUne: boolean;
    Couleur: any;
    Layout: number;
    IsMesureUrgence: boolean;
    CouleurMesureUrgence: null;
    IsMesureUrgenceBlanche: boolean;
    CouleurTexteMesureUrgence: null;
    UrlMesureUrgence: null;
}

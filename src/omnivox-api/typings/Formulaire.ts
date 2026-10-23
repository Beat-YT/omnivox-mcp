import { ResponseEnvelope } from "./ResponseEnvelope";

export interface Formulaire {
    IsActif: boolean;
    UrlService: string;
    CouleurImage: string | null;
    Nom: string;
    Description: string;
    UrlImage: string;
}

export interface FormulaireModel extends ResponseEnvelope {
    ListeFormulaires: Formulaire[];
}

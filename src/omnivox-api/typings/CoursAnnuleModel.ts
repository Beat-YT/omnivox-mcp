import { ResponseEnvelope } from "./ResponseEnvelope";

export namespace CoursAnnuleModel {
    export interface ResponseModel extends ResponseEnvelope {
        ListeAnnulationCours: AnnulationCours[];
        DateCoursAnnule: number;
        IndicateurAucunCoursAnnule: boolean;
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
}

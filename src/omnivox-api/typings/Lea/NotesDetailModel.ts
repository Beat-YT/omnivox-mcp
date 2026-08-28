// All grade values are fixed-point x100 (8840 = 88.40). "No value" is null or
// the int sentinels 2147483647 / -2147483648.
export namespace NotesDetailModel {
    export interface ResponseModel {
        Evaluations: Evaluation[];
        Categories: Category[];
        Sommaire: Sommaire;
        UniquementNonCategorise: boolean;
        ListeIdEvaluationNonConsulte: string;
        IsPeutVisualiser: boolean;
    }

    export interface Evaluation {
        IDEvaluation: string;
        NomEvaluation: string;
        Note: number | null;          // x100, after adjustments (null = not graded)
        NoteBase: number;             // x100, before adjustments
        NbPts: number;                // x100, maximum points
        Ponderation: number;          // x100, weight (% of final grade)
        Moyenne: number | null;       // x100, class average
        Mediane: number | null;       // x100
        EcartType: number | null;     // x100, standard deviation
        DateEvaluation: number | null; // epoch ms
        TypeEvaluation: number;       // 1 = normal, 20 = bonus, 40 = penalty
        IDCategorie: string;          // negative = pseudo-category (bonus/penalty)
        RangEval: string;
        IsVisualise: boolean;
        Ajustements: Ajustement[];
        CommentairesEtudiant: CommentaireEtudiant[];
        TexteCommentaireGroupe: string;
        TimestampCommentaireGroupe: number | null;
        NomProfCommentaireGroupe: string;
    }

    export interface Ajustement {
        NomAjustement: string;
        ValeurAjustement: number;     // x100
        Type: number;                 // 1 = bonus (+), 2 = penalty (-)
    }

    export interface CommentaireEtudiant {
        TexteCommentaireEtudiant: string;
        TimestampCommentaireEtudiant: number;
        NomProfCommentaireEtudiant: string;
    }

    export interface Category {
        IDCategorie: string;
        NomCategorie: string;         // empty for pseudo-categories
        PonderationCategorie: number | null; // x100
        MoyenneCategorie: number;     // x100, points earned toward final grade
        MoyenneMinimalCategorie: number | null;
        TypeCategorie: number | null;
        NombreEvaluationIgnoreCategorie: number;
        NoteFinaleMaximumCategorie: number | null;
    }

    export interface Sommaire {
        NoteFinale: string;
        NotePonderee: number;         // x100, excludes bonus evaluations
        NoteProjetee: number;         // x100, includes bonus
        Moyenne: number;              // x100
        MoyenneProjetee: number;      // x100
        MoyenneFinale: string | null;
        Mediane: number;              // x100
        MedianeProjetee: number;      // x100
        EcartType: number;            // x100
        EcartTypeProjetee: number;    // x100
        PourcentAccumul: number;      // x100
    }
}

import { ResponseEnvelope } from "../ResponseEnvelope";

export namespace NotesDetailWebModel {
    export interface ResponseModel extends ResponseEnvelope {
        InfosAutoLoginCvir: InfosAutoLoginCvir;
        NoteEvaluationWeb: NoteEvaluationWeb;
    }

    export interface InfosAutoLoginCvir {
        SID: string;
        UrlLea: string;
        TKSEncrypte: null;
        NomCookieTKS: null;
    }

    export interface NoteEvaluationWeb {
        Enseignants: string[];
    }
}
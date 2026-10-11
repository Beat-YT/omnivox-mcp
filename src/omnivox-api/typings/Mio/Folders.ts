import { ResponseEnvelope } from "../ResponseEnvelope";

export namespace MioFolders {
    export interface ResponseModel extends ResponseEnvelope {
        ListeFolders: ListeFolder[];
    }

    export interface ListeFolder {
        Id: string;
        IdCategorie: string;
        NomCategorie: string;
        NomCategorieCourt: string;
        Image: string;
        NbMessageNonLu: number;
        NbMessageTotal: number;
    }
}
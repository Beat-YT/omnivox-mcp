import { ResponseEnvelope } from "./ResponseEnvelope";

export interface DocumentCollege {
    IDDocument: string;
    Titre: string;
    NomDocument: string;
    Extention: string;
    ContentType: string;
    TailleOctet: number;
    Description: string;
    Commentaire: string | null;
    Provenance: number;
    TypeDocument: number;
    PathFichier: string | null;
    EstConsulte: boolean;
    EstObligatoire: boolean;
    DateCreation: number;
    DateDerniereModif: number;
    DateDebut: number;
    DateFin: number;
    DateConsultation: number;
}

export interface DocMessageCollegeModel extends ResponseEnvelope {
    NombreDocuments: number;
    NombreMessages: number;
    NombreContrats: number;
    NombreTotal: number;
    ListeDocumentsMessages: {
        ListeDocuments: DocumentCollege[];
        ListeMessageVocaux: unknown[];
        ListeMessages: unknown[];
        ListeContrats: unknown[];
        ListeRapportsTache: unknown[];
    };
}

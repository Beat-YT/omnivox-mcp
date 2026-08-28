import { makePuppeteerDownload, DownloadResult } from "../puppet";
import { getConfig } from "../config";

export function GetDocumentFichier(courseId: string, documentId: string, term: string): Promise<DownloadResult> {
    const config = getConfig();
    const baseUrl = new URL(config.DefaultPage).origin;
    const qs = new URLSearchParams({
        idDocCoursDocument: documentId,
        isDansSousDossier: 'false',
        anSession: term,
        idClasse: courseId,
        nomFichierServeurFichier: documentId
    });

    return makePuppeteerDownload(`${baseUrl}/Mobl/LeaEtudiant/GetDocumentFichier?${qs.toString()}`);
}

export function GetEnonceTravailFichier(courseId: string, assignmentId: string, assignmentFileId: string, term: string): Promise<DownloadResult> {
    const config = getConfig();
    const baseUrl = new URL(config.DefaultPage).origin;
    const qs = new URLSearchParams({
        idTravail: assignmentId,
        idDocumentTravail: assignmentFileId,
        anSession: term,
        idClasse: courseId,
    });

    return makePuppeteerDownload(`${baseUrl}/Mobl/LeaEtudiant/GetEnonceTravailFichier?${qs.toString()}`);
}

export function GetDepotTravailFichier(courseId: string, assignmentId: string, submissionFileId: string, term: string): Promise<DownloadResult> {
    const config = getConfig();
    const baseUrl = new URL(config.DefaultPage).origin;
    const qs = new URLSearchParams({
        idTravail: assignmentId,
        idDepot: submissionFileId,
        anSession: term,
        idClasse: courseId,
    });

    return makePuppeteerDownload(`${baseUrl}/Mobl/LeaEtudiant/GetDepotTravailFichier?${qs.toString()}`);
}

export function GetCopieCorrigeTravailFichier(courseId: string, assignmentId: string, correctedFileId: string, term: string): Promise<DownloadResult> {
    const config = getConfig();
    const baseUrl = new URL(config.DefaultPage).origin;
    const qs = new URLSearchParams({
        idTravail: assignmentId,
        idDepot: correctedFileId,
        anSession: term,
        idClasse: courseId,
    });

    return makePuppeteerDownload(`${baseUrl}/Mobl/LeaEtudiant/GetCopieCorrigeTravailFichier?${qs.toString()}`);
}

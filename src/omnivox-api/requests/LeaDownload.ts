import { makePuppeteerDownload, DownloadResult } from "../puppet";
import { getConfig, OmnivoxConfig } from "../config";

function getOmnivoxBaseUrl(): string {
    let config: OmnivoxConfig | undefined = undefined;

    try {
        config = getConfig();
        const parsedUrl = new URL(config.DefaultPage);

        // sanity check url
        if (!parsedUrl.hostname.toLowerCase().endsWith('.omnivox.ca')) {
            throw new Error(`Invalid Omnivox base URL: ${config.DefaultPage} (not ending with .omnivox.ca)`);
        }

        return parsedUrl.origin;
    } catch (error) {
        console.error(`Error parsing Omnivox base URL ${config?.DefaultPage}`, error);
        throw new Error(`Invalid Omnivox base URL: ${config?.DefaultPage}`);
    }
}

export function GetDocumentFichier(courseId: string, documentId: string, term: string): Promise<DownloadResult> {
    const baseUrl = getOmnivoxBaseUrl();

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
    const baseUrl = getOmnivoxBaseUrl();
    const qs = new URLSearchParams({
        idTravail: assignmentId,
        idDocumentTravail: assignmentFileId,
        anSession: term,
        idClasse: courseId,
    });

    return makePuppeteerDownload(`${baseUrl}/Mobl/LeaEtudiant/GetEnonceTravailFichier?${qs.toString()}`);
}

export function GetDepotTravailFichier(courseId: string, assignmentId: string, submissionFileId: string, term: string): Promise<DownloadResult> {
    const baseUrl = getOmnivoxBaseUrl();
    const qs = new URLSearchParams({
        idTravail: assignmentId,
        idDepot: submissionFileId,
        anSession: term,
        idClasse: courseId,
    });

    return makePuppeteerDownload(`${baseUrl}/Mobl/LeaEtudiant/GetDepotTravailFichier?${qs.toString()}`);
}

export function GetCopieCorrigeTravailFichier(courseId: string, assignmentId: string, correctedFileId: string, term: string): Promise<DownloadResult> {
    const baseUrl = getOmnivoxBaseUrl();
    const qs = new URLSearchParams({
        idTravail: assignmentId,
        idDepot: correctedFileId,
        anSession: term,
        idClasse: courseId,
    });

    return makePuppeteerDownload(`${baseUrl}/Mobl/LeaEtudiant/GetCopieCorrigeTravailFichier?${qs.toString()}`);
}

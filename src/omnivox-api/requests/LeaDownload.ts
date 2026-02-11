import { NotesDetailWebModel } from "@typings/Lea/NotesDetailWebModel";
import { loadPageInFrame, makePuppeteerDownload, DownloadResult } from "../puppet";
import { getInnerText, parseTable } from "../puppet/tableParser";
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

export async function GetWebListeEval(NotesDetailWeb: NotesDetailWebModel.ResponseModel, noCours: string, noGroupe: string, AnSes: string) {
    const qs = new URLSearchParams({
        ModeAff: 'NOTEEVAL',
        ModeMobile: '1',
        SID: NotesDetailWeb.InfosAutoLoginCvir.SID,
        AnSes: AnSes,
        ServEnsCVIR: '',
        ServEns: '',
        NoCours: noCours,
        NoGroupe: noGroupe,
        Item: 'intro',
        L: 'ANG',
        TypeScroll: 'Inner'
    });

    const url = `https://${NotesDetailWeb.InfosAutoLoginCvir.UrlLea}/cvir/note/ListeEvalCVIR.ovx?${qs.toString()}`;
    const { frame, dispose } = await loadPageInFrame(url);

    try {
        const evalsTable = await parseTable(frame, '.table-notes');
        const summary = await getInnerText(frame, '.tb-sommaire');
        const evolution = await frame.$$eval('.evo', (els) =>
            els.map((el) => el.innerHTML.replace(/<br\s*\/?>/gi, ' | ').replace(/<[^>]*>/g, '').trim())
                .filter(Boolean)
                .join('\n')
        );

        return [
            `## ${noCours} (Group ${noGroupe})`,
            `Teacher: ${NotesDetailWeb.NoteEvaluationWeb.Enseignants.join(', ')}`,
            '',
            '### Evaluations',
            evalsTable,
            '',
            '### Summary',
            summary,
            '',
            '### Grade Evolution',
            evolution || '---',
        ].join('\n');
    } finally {
        await dispose();
    }
}

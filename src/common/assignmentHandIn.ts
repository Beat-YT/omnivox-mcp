import { toDisplayDate } from "@common/transformHelpers";
import { TravauxListeModel } from "@typings/Lea/TravauxListeModel";

/**
 * Shape shared by `GetTravauxListeModel().ListeTravaux[]` and `GetTravauxDetailModel().Travail`.
 *
 * Lea's `EstRemis` flag flips as soon as any file lands in the deposit, so it says nothing about
 * whether the work is finished. The helpers here never emit a "submitted" or "done" state: they
 * describe the deadline and what is actually sitting in the deposit, and leave the judgement to
 * the model and the user.
 */
export type Travail = TravauxListeModel.ListeTravaux;
export type DepotTravail = TravauxListeModel.ListeDepotsTravail;

const DAY_MS = 86_400_000;

export function dueMs(t: Travail) {
    return t.DateHeureRemise > 0 ? t.DateHeureRemise : 0;
}

export function depositFiles(t: Travail): DepotTravail[] {
    return (t.ListeDepotsTravail ?? []).filter(d => d.NomFichierDepotEtudiant);
}

export function hasOnlineDeposit(t: Travail) {
    return (t.DepotEnLigne ?? 0) > 0;
}

export function isLateDeposit(t: Travail, d: DepotTravail) {
    const due = dueMs(t);
    return due > 0 && d.DateDepotEtudiant > due;
}

/** Heading tag about the deadline. Never says the work is done. */
export function deadlineTag(t: Travail, now = Date.now()): string | undefined {
    const due = dueMs(t);
    if (!due) return undefined;
    if (due < now) return '[PAST DUE]';

    const dueDate = new Date(due);
    const today = new Date(now);
    const sameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    if (sameDay(dueDate, today)) return '[DUE TODAY]';
    const tomorrow = new Date(now + DAY_MS);
    if (sameDay(dueDate, tomorrow)) return '[DUE TOMORROW]';
    return `[DUE IN ${Math.ceil((due - now) / DAY_MS)}d]`;
}

export function headingTags(t: Travail, now = Date.now()) {
    const tags = [
        deadlineTag(t, now),
        t.ListeCopieCorigee?.length ? '[CORRECTED]' : undefined,
    ].filter(Boolean) as string[];
    const marker = t.IsTravailNonConsulte ? ' *new*' : '';
    return tags.map(x => ` ${x}`).join('') + marker;
}

/** The `- Deposit:` bullet: file count, whether hand-in is open, upload rules. */
export function depositLine(t: Travail) {
    if (!hasOnlineDeposit(t)) {
        return '- Deposit: no online deposit for this assignment, hand in the way the teacher asked';
    }

    const count = depositFiles(t).length;
    const parts = [
        count ? `${count} file(s)` : 'empty',
        t.IsRemisePermise ? 'hand-in open' : 'hand-in closed',
    ];
    if (t.IsRemisePermise) parts.push(t.AutorisePlusieursRemises ? 'more uploads allowed' : 'single upload only');
    if (t.RetardAccepte) parts.push('late accepted');

    return `- Deposit: ${parts.join(', ')}`;
}

/** One sub-bullet per file in the deposit: name, upload time, size, late marker. */
export function depositFileLines(t: Travail) {
    return depositFiles(t).map(d => {
        const when = toDisplayDate(d.DateDepotEtudiant);
        const meta = [when, formatBytes(d.TailleOctetDepotEtudiant)].filter(Boolean).join(', ');
        return `  - ${d.NomFichierDepotEtudiant}${meta ? ` (${meta})` : ''}${isLateDeposit(t, d) ? ' [late]' : ''}`;
    });
}

/** Free-text hand-in instructions the teacher wrote (paper hand-in, alternate electronic route). */
export function handInInstructionLines(t: Travail) {
    const lines: string[] = [];
    const paper = t.DetailRemiseNonSysteme?.trim();
    const alternate = t.DetailRemiseAlternatifElectronique?.trim();
    if (paper) lines.push(`- Hand-in instructions: ${paper}`);
    if (alternate) lines.push(`- Alternate electronic hand-in: ${alternate}`);
    return lines;
}

/** Files in the deposit while hand-in is still open and the deadline is ahead: the model must not treat it as done. */
export function needsFinalVersionCheck(t: Travail, now = Date.now()) {
    const due = dueMs(t);
    return depositFiles(t).length > 0 && !!t.IsRemisePermise && (due === 0 || due > now);
}

export const FINAL_VERSION_NOTE =
    'A file in the deposit only means something was uploaded. It is not a sign the work is finished. ' +
    'While hand-in is open and the deadline is ahead, confirm with the user that the uploaded file is the version they want graded, ' +
    'and keep tracking the deadline until it passes or they confirm.';

export function formatBytes(bytes?: number) {
    if (!bytes || bytes < 0) return undefined;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

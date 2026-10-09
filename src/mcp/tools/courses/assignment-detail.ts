import { GetTravauxDetailModel } from "@api/Lea";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { extractHtmlPreview, toDisplayDate } from "@common/transformHelpers";
import { assignmentIdSchema, courseIdSchema, termIdSchema } from "@common/validation";
import {
    depositFiles,
    depositLine,
    dueMs,
    FINAL_VERSION_NOTE,
    formatBytes,
    handInInstructionLines,
    headingTags,
    isLateDeposit,
    needsFinalVersionCheck,
} from "@common/assignmentHandIn";
import { TravauxDetailModel } from "@typings/Lea/TravauxDetailModel";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    course_id: courseIdSchema,
    assignment_id: assignmentIdSchema,
    term_id: termIdSchema.optional(),
});

mcpServer.registerTool('get-assignment-detail',
    {
        title: 'Get Assignment Detail',
        description: 'Full detail of one assignment: deadline, instructions, what is in the hand-in deposit, teacher documents and corrected copies, with the file IDs get-assignment-file-link needs. A file in the deposit means something was uploaded, not that the work is finished.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const term = args.term_id || await getDefaultTermId();
        const model = await GetTravauxDetailModel(args.course_id, args.assignment_id, term);
        const t = model?.Travail;

        if (!t?.IDTravail || !t.Titre) {
            return { isError: true, content: [{ type: 'text', text: 'Assignment not found.' }] };
        }

        const due = dueMs(t);
        const lines = [
            `# ${t.Titre}${headingTags(t)}`,
            t.NomCategorie && `- Category: ${t.NomCategorie}`,
            t.DateHeureDiffusion > 0 && `- Published: ${toDisplayDate(t.DateHeureDiffusion)}`,
            due ? `- Due: ${toDisplayDate(due)}` : '- Due: no deadline set',
            depositLine(t),
            ...handInInstructionLines(t),
            `- ID: ${t.IDTravail}`,
        ].filter(Boolean) as string[];

        const instructions = extractHtmlPreview(t.Enonce, 20_000);
        if (instructions) lines.push('', '## Instructions', instructions);

        const deposits = depositFiles(t);
        lines.push('', `## Deposit files (${deposits.length})`);
        if (!deposits.length) lines.push('Nothing uploaded yet.');
        for (const d of deposits) {
            const meta = [toDisplayDate(d.DateDepotEtudiant), formatBytes(d.TailleOctetDepotEtudiant)].filter(Boolean).join(', ');
            lines.push(`- ${d.NomFichierDepotEtudiant}${meta ? ` (${meta})` : ''}${isLateDeposit(t, d) ? ' [late]' : ''}`);
            if (d.CommentaireDepotEtudiant?.trim()) lines.push(`  - Comment: ${d.CommentaireDepotEtudiant.trim()}`);
            lines.push(`  - Downloaded by teacher: ${toDisplayDate(d.DateHeureTelechargementEnseignant) ?? 'no'}`);
            lines.push(`  - File ID: ${d.IDDepotEtudiant} (role: submission)`);
        }

        const teacherDocs = (t.ListeDocumentsTravail ?? []).filter(d => d.NomFichier);
        if (teacherDocs.length) {
            lines.push('', `## Teacher documents (${teacherDocs.length})`);
            for (const d of teacherDocs) lines.push(...formatFile(d, d.IDDocumentTravail, 'teacher_document'));
        }

        const corrections = (t.ListeCopieCorigee ?? []).filter(d => d.NomFichier);
        if (corrections.length) {
            lines.push('', `## Correction files (${corrections.length})`);
            for (const d of corrections) lines.push(...formatFile(d, d.IDDepotEtudiant, 'correction'));
        }

        const content: { type: 'text'; text: string; annotations?: { audience: ('assistant' | 'user')[] } }[] = [
            { type: 'text', text: lines.join('\n') },
        ];
        if (needsFinalVersionCheck(t)) {
            content.push({ type: 'text', text: FINAL_VERSION_NOTE, annotations: { audience: ['assistant'] } });
        }

        return { content };
    }
);

function formatFile(d: TravauxDetailModel.Liste, fileId: string | null, role: string) {
    const size = formatBytes(d.TailleOctet);
    const lines = [`- ${d.NomFichier}${size ? ` (${size})` : ''}`];
    if (d.DateDepot > 0) lines.push(`  - Uploaded: ${toDisplayDate(d.DateDepot)}`);
    lines.push(`  - First viewed: ${toDisplayDate(d.DatePremConsultDocEtudiant) ?? 'not yet'}`);
    if (fileId) lines.push(`  - File ID: ${fileId} (role: ${role})`);
    return lines;
}

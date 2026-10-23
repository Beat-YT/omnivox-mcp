import { GetDocMessageCollegeModel } from "@api/DocMessageCollege";
import { toDisplayDate } from "@common/transformHelpers";
import { DocumentCollege } from "@typings/DocMessageCollege";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({});

mcpServer.registerTool('get-college-documents',
    {
        title: 'Get College Documents',
        description: 'List the official documents the college has sent to the student (admission letters, enrollment confirmations, notices, acknowledgments). Read-only: a mandatory document that has not been opened blocks every Lea tool until the student opens it in Omnivox themselves, and opening it is recorded on the student file, so this tool only names the document. Use it when another tool reports a mandatory college document block.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async () => {
        const model = await GetDocMessageCollegeModel();
        const documents = model.ListeDocumentsMessages?.ListeDocuments ?? [];

        const blocking = documents.filter(d => d.EstObligatoire && !d.EstConsulte);
        const unviewed = documents.filter(d => !d.EstConsulte).length;

        const lines = [
            `# College documents (${documents.length})`,
            `${documents.length} document(s)${unviewed ? `, ${unviewed} unread` : ''}${blocking.length ? `, ${blocking.length} mandatory unread` : ''}`,
        ];

        if (model.NombreMessages || model.NombreContrats) {
            lines.push(`${model.NombreMessages} message(s) and ${model.NombreContrats} contract(s) are also listed in Omnivox but are not shown here.`);
        }

        lines.push('');

        if (blocking.length) {
            lines.push(
                'Omnivox blocks Lea until the student opens these in Omnivox (Mes documents). Opening is recorded on the student file, so the student has to do it themselves:',
                ...blocking.map(d => `- ${d.Titre.trim()}`),
                '',
            );
        }

        if (documents.length === 0) {
            lines.push('No college documents.');
        }

        lines.push(...documents.map(formatDocument));

        return {
            content: [
                { type: 'text', text: lines.join('\n') },
                {
                    type: 'text',
                    text: 'Note for the assistant: opening a college document is recorded on the student file and often counts as a legally binding acknowledgment (contracts, admission conditions, mandatory notices). Never open one on the student\'s behalf, and do not use a service link, Lea web or any other route to work around a document block. The student must open it themselves in Omnivox.',
                    annotations: { audience: ['assistant'] },
                } as any,
            ],
        };
    }
);

function formatDocument(doc: DocumentCollege) {
    const tags = [
        doc.EstConsulte ? '' : ' *new*',
        doc.EstObligatoire ? (doc.EstConsulte ? ' [MANDATORY]' : ' [MANDATORY, BLOCKS LEA]') : '',
    ].join('');

    const description = doc.Description?.trim();
    const expires = toDisplayDate(doc.DateFin);
    const opened = doc.EstConsulte ? toDisplayDate(doc.DateConsultation) : undefined;

    const details = [
        `- Published: ${toDisplayDate(doc.DateCreation) ?? '?'}`,
        expires && `- Expires: ${expires}`,
        opened && `- Opened: ${opened}`,
        description && `- Description: ${description}`,
        doc.Extention && `- File: ${doc.Extention}${doc.TailleOctet ? `, ${formatSize(doc.TailleOctet)}` : ''}`,
        `- ID: ${doc.IDDocument}`,
    ].filter(Boolean);

    return [`## ${doc.Titre.trim()}${tags}`, ...details, ''].join('\n');
}

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

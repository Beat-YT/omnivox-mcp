import { GetDocumentsListeModel } from "@api/Lea";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { extractHtmlPreview, formatBytes, toDisplayDate } from "@common/transformHelpers";
import { courseIdSchema, termIdSchema } from "@common/validation";
import { DocumentsListeModel } from "@typings/Lea/DocumentsListeModel";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    term_id: termIdSchema.optional(),
    course_id: courseIdSchema,
});

mcpServer.registerTool('get-course-documents',
    {
        title: 'Get course documents',
        description: 'Retrieve a list of documents for a specific course.',
        inputSchema: input,
        annotations: {
            destructiveHint: false,
            readOnlyHint: true,
        },
    },
    async (args) => {
        const term = args.term_id || await getDefaultTermId();
        const model = await GetDocumentsListeModel(args.course_id, term);
        const documents = model.ListeDocuments ?? [];

        const courseName = model.NomCours || documents[0]?.NomCours;
        const title = courseName ? `${courseName} (${args.course_id})` : args.course_id;
        const unviewed = documents.filter(d => !d.IndicateurDocumentVisualise).length;

        const lines = [
            `# Documents: ${title}`,
            `${documents.length} document(s)${unviewed ? `, ${unviewed} unread` : ''}`,
            '',
        ];

        if (documents.length === 0) {
            lines.push('No documents for this course.');
        }

        lines.push(...documents.map(formatDocument));

        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
)

function formatDocument(doc: DocumentsListeModel.ListeDocument) {
    const now = Date.now();
    const expired = doc.DateFinDistributionDateTime > 0 && doc.DateFinDistributionDateTime < now;
    const readBy = toDisplayDate(doc.DateLectureDocument);
    const unread = !doc.IndicateurDocumentVisualise;
    const tags = [
        unread ? ' *new*' : '',
        expired ? ' [EXPIRED]' : '',
    ].join('');

    const description = extractHtmlPreview(doc.Description);
    const externalUrl = doc.UrlLienExterne ? decodeURIComponent(doc.UrlLienExterne) : undefined;
    const opened = unread ? undefined : toDisplayDate(doc.DateConsultationDateTime);
    const size = formatBytes(doc.TailleOctet);

    const details = [
        `- Published: ${toDisplayDate(doc.DateDebutDistributionDateTime) ?? '?'}`,
        readBy && `- Must read by: ${readBy}`,
        opened && `- Opened: ${opened}`,
        doc.TitreCategorie && `- Category: ${doc.TitreCategorie}`,
        description && `- Description: ${description}`,
        doc.NomDocument && `- File: ${doc.NomDocument}${size ? ` (${size})` : ''}`,
        externalUrl && `- URL: ${externalUrl}`,
        `- ID: ${doc.IdDocCoursDocument}`,
    ].filter(Boolean);

    return [`## ${extractHtmlPreview(doc.Titre) || doc.NomDocument || doc.IdDocCoursDocument}${tags}`, ...details, ''].join('\n');
}

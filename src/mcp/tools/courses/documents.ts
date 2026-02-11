import { GetDocumentsListeModel } from "@api/Lea";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { CourseDocument } from "@schemas/courses";
import { transformDocuments } from "@transformers/courses/document";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    term_id: z.string().optional(),
    course_id: z.string(),
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
        const course_id = args.course_id;
        const model = await GetDocumentsListeModel(course_id, term);
        const documents = transformDocuments(model, term, course_id);

        const unviewed = documents.documents.filter(d => !d.is_viewed).length;
        const header = `${documents.course_name || course_id} — ${documents.documents.length} document(s)${unviewed ? `, ${unviewed} unread` : ''}`;
        const legend = unviewed ? '* = not viewed' : '';
        const docs = documents.documents.map(formatDocument);

        return {
            content: [{ type: 'text', text: [header, legend, '', ...docs].filter(Boolean).join('\n') }],
        };
    }
)

function formatDocument(doc: CourseDocument) {
    const marker = doc.is_viewed ? '- ' : '* ';
    const date = doc.published_at ? new Date(doc.published_at).toLocaleDateString() : '?';

    const details: string[] = [];
    if (doc.category) details.push(`  Category: ${doc.category}`);
    if (doc.description) details.push(`  ${doc.description}`);
    if (doc.filename) details.push(`  File: ${doc.filename}`);
    if (doc.external_url) details.push(`  URL: ${doc.external_url}`);
    details.push(`  ID: ${doc.id}`);

    return [
        `${marker}[${date}] ${doc.title}`,
        ...details,
        '',
    ].join('\n');
}
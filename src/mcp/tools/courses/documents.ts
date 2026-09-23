import { GetDocumentsListeModel } from "@api/Lea";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { CourseDocument } from "@schemas/courses";
import { transformDocuments } from "@transformers/courses/document";
import { courseIdSchema, termIdSchema } from "@common/validation";
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
        const course_id = args.course_id;
        const model = await GetDocumentsListeModel(course_id, term);
        const documents = transformDocuments(model, term, course_id);

        const unviewed = documents.documents.filter(d => !d.is_viewed).length;
        const title = documents.course_name ? `${documents.course_name} (${course_id})` : course_id;
        const header = `# Documents: ${title}`;
        const meta = `${documents.documents.length} document(s)${unviewed ? `, ${unviewed} unread` : ''}`;
        const docs = documents.documents.map(formatDocument);

        return {
            content: [{ type: 'text', text: [header, meta, '', ...docs].join('\n') }],
        };
    }
)

function formatDocument(doc: CourseDocument) {
    const marker = doc.is_viewed ? '' : ' *new*';
    const date = doc.published_at ? doc.published_at.slice(0, 10) : '?';

    const details: string[] = [];
    details.push(`- Published: ${date}`);
    if (doc.category) details.push(`- Category: ${doc.category}`);
    if (doc.description) details.push(`- Description: ${doc.description}`);
    if (doc.filename) details.push(`- File: ${doc.filename}`);
    if (doc.external_url) details.push(`- URL: ${doc.external_url}`);
    details.push(`- ID: ${doc.id}`);

    return [
        `## ${doc.title}${marker}`,
        ...details,
        '',
    ].join('\n');
}
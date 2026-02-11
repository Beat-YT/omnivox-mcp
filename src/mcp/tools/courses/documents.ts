import { GetDocumentsListeModel } from "@api/Lea";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { CourseDocument, courseDocumentResponseSchema } from "@schemas/courses";
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
        outputSchema: courseDocumentResponseSchema,
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

        const docTexts = documents.documents.map(c => ({
            type: 'text' as const,
            text: mapCourseToText(c),
            annotations: {
                audience: ["user"] as ("user" | "assistant")[],
            }
        }))

        return {
            content: [
                {
                    annotations: {
                        audience: ["assistant"],
                    },
                    type: 'text',
                    text: `Here is the list of documents for course ${course_id} in term ID: ${term} (${documents.documents.length} documents total)`
                },
                ...docTexts,
            ],
            structuredContent: documents,
        };
    }
)

function mapCourseToText(doc: CourseDocument) {
    return [
        `Document: ${doc.title}`,
        `ID: ${doc.id}`,
        `Description: ${doc.description || 'N/A'}`,
        `Category: ${doc.category || 'N/A'}`,
        doc.filename && `Filename: ${doc.filename || 'N/A'}`,
        doc.extension && `Extension: ${doc.extension}`,
        doc.external_url && `External URL: ${doc.external_url}`,
        `Viewed: ${bool(doc.is_viewed)}`,
        `Published At: ${new Date(doc.published_at || '').toLocaleString() || 'N/A'}`,
        ``
    ].filter(Boolean).join('\n');
}

function bool(value: boolean) {
    return value ? 'true' : 'false';
}
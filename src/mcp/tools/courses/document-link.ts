import { getDefaultTermId } from "@common/omnivoxHelper";
import { GetDocumentFichier } from "@api/LeaDownload";
import { mcpServer } from "src/mcp/server";
import { isHttpMode } from "@common/transportMode";
import { createWebToken } from "src/security/omniWebToken";
import { saveDownload } from "@common/downloads";
import { courseIdSchema, termIdSchema } from "@common/validation";
import { z } from "zod";

const input = z.object({
    course_id: courseIdSchema,
    document_id: z.string(),
    term_id: termIdSchema.optional(),
});

mcpServer.registerTool('get-document-link',
    {
        title: 'Get Lea Document',
        description: 'Fetch a Lea document. In HTTP mode with MCP_SERVER_URL set, returns a browser link that expires after 15 minutes; otherwise saves the file locally and returns its path. Marks the document as read on Omnivox, so use get-course-documents first if you are only browsing.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const term = args.term_id || await getDefaultTermId();

        const serverBaseUrl = process.env.MCP_SERVER_URL;
        if (isHttpMode() && serverBaseUrl) {
            const token = createWebToken({
                type: 'lea-document',
                courseId: args.course_id,
                documentId: args.document_id,
                termId: term,
            });

            const url = `${serverBaseUrl}/download/document?token=${token}`;

            return {
                content: [{ type: 'text', text: `Download link (expires in 15 minutes): ${url}` }],
            };
        }

        // Save file to disk
        const file = await GetDocumentFichier(args.course_id, args.document_id, term);
        const filePath = await saveDownload(file, `${args.document_id}.bin`);

        return {
            content: [{ type: 'text', text: `File saved to: ${filePath}` }],
        };
    }
);

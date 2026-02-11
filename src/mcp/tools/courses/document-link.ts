import { getDefaultTermId } from "@common/omnivoxHelper";
import { GetDocumentFichier } from "@api/LeaDownload";
import { mcpServer } from "src/mcp/server";
import { isHttpMode } from "@common/transportMode";
import { createWebToken } from "src/security/omniWebToken";
import { dataDir } from "@common/dataDir";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

const input = z.object({
    course_id: z.string(),
    document_id: z.string(),
    term_id: z.string().optional(),
});

mcpServer.registerTool('get-document-link',
    {
        title: 'Get Lea Document',
        description: 'Generate a temporary download link for a Lea document. The link expires after 15 minutes. Give this link to the user so they can open the file in their browser.',
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
        const response = await GetDocumentFichier(args.course_id, args.document_id, term);

        const disposition = response.contentDisposition || '';
        const filenameMatch = disposition.match(/filename[^;=\n]*=["']?([^"';\n]*)["']?/);
        const filename = filenameMatch?.[1] || `${args.document_id}.bin`;

        const downloadsDir = path.join(dataDir, 'downloads');
        fs.mkdirSync(downloadsDir, { recursive: true });
        const filePath = path.join(downloadsDir, filename);
        fs.writeFileSync(filePath, response.data);

        return {
            content: [{ type: 'text', text: `File saved to: ${filePath}` }],
        };
    }
);

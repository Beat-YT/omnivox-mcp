import { getDefaultTermId } from "@common/omnivoxHelper";
import { GetEnonceTravailFichier, GetDepotTravailFichier, GetCopieCorrigeTravailFichier } from "@api/LeaDownload";
import { mcpServer } from "src/mcp/server";
import { isHttpMode } from "@common/transportMode";
import { createWebToken } from "src/security/omniWebToken";
import { dataDir } from "@common/dataDir";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

const input = z.object({
    course_id: z.string(),
    assignment_id: z.string(),
    file_id: z.string(),
    role: z.enum(['teacher_document', 'submission', 'correction']),
    term_id: z.string().optional(),
});

mcpServer.registerTool('get-assignment-file-link',
    {
        title: 'Get Assignment File',
        description: 'Generate a temporary download link for an assignment file (teacher document, student submission, or corrected copy). The link expires after 15 minutes. Give this link to the user so they can open the file in their browser.',
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
                type: 'lea-assignment-file',
                courseId: args.course_id,
                assignmentId: args.assignment_id,
                fileId: args.file_id,
                role: args.role,
                termId: term,
            });

            const url = `${serverBaseUrl}/download/assignment-file?token=${token}`;

            return {
                content: [{ type: 'text', text: `Download link (expires in 15 minutes): ${url}` }],
            };
        }

        // Save file to disk
        let response;
        switch (args.role) {
            case 'teacher_document':
                response = await GetEnonceTravailFichier(args.course_id, args.assignment_id, args.file_id, term);
                break;
            case 'submission':
                response = await GetDepotTravailFichier(args.course_id, args.assignment_id, args.file_id, term);
                break;
            case 'correction':
                response = await GetCopieCorrigeTravailFichier(args.course_id, args.assignment_id, args.file_id, term);
                break;
        }

        const disposition = response.contentDisposition || '';
        const filenameMatch = disposition.match(/filename[^;=\n]*=["']?([^"';\n]*)["']?/);
        const filename = filenameMatch?.[1] || `${args.file_id}.bin`;

        const downloadsDir = path.join(dataDir, 'downloads');
        fs.mkdirSync(downloadsDir, { recursive: true });
        const filePath = path.join(downloadsDir, filename);
        fs.writeFileSync(filePath, response.data);

        return {
            content: [{ type: 'text', text: `File saved to: ${filePath}` }],
        };
    }
);

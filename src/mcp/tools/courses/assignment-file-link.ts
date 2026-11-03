import { getDefaultTermId } from "@common/omnivoxHelper";
import { GetEnonceTravailFichier, GetDepotTravailFichier, GetCopieCorrigeTravailFichier } from "@api/LeaDownload";
import { mcpServer } from "src/mcp/server";
import { isHttpMode } from "@common/transportMode";
import { createWebToken } from "src/security/omniWebToken";
import { saveDownload } from "@common/downloads";
import { assignmentFileIdSchema, assignmentIdSchema, courseIdSchema, termIdSchema } from "@common/validation";
import { z } from "zod";

const input = z.object({
    course_id: courseIdSchema,
    assignment_id: assignmentIdSchema,
    file_id: assignmentFileIdSchema,
    role: z.enum(['teacher_document', 'submission', 'correction']),
    term_id: termIdSchema.optional(),
});

mcpServer.registerTool('get-assignment-file-link',
    {
        title: 'Get Assignment File',
        description: 'Fetch an assignment file (teacher document, student submission, or corrected copy). In HTTP mode with MCP_SERVER_URL set, returns a browser link that expires after 15 minutes; otherwise saves the file locally and returns its path. Get file IDs and roles from get-assignment-detail.',
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
        let file;
        switch (args.role) {
            case 'teacher_document':
                file = await GetEnonceTravailFichier(args.course_id, args.assignment_id, args.file_id, term);
                break;
            case 'submission':
                file = await GetDepotTravailFichier(args.course_id, args.assignment_id, args.file_id, term);
                break;
            case 'correction':
                file = await GetCopieCorrigeTravailFichier(args.course_id, args.assignment_id, args.file_id, term);
                break;
        }

        const filePath = await saveDownload(file, `${args.file_id}.bin`);

        return {
            content: [{ type: 'text', text: `File saved to: ${filePath}` }],
        };
    }
);

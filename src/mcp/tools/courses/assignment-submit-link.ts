import { GetTravauxDetailModel } from "@api/Lea";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { isHttpMode } from "@common/transportMode";
import { assignmentIdSchema, courseIdSchema, termIdSchema } from "@common/validation";
import { createWebToken } from "src/security/omniWebToken";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    course_id: courseIdSchema,
    assignment_id: assignmentIdSchema,
    term_id: termIdSchema.optional(),
});

mcpServer.registerTool('get-assignment-submit-link',
    {
        title: 'Get Assignment Submit Link',
        description: 'Get a short link that opens the Omnivox hand-in page for an assignment, already logged in. Give it to the user so they can upload their file in their own browser — this tool never submits anything itself. Link expires after 15 minutes. Fails if online submission is closed for the assignment, or if the server has no public URL (MCP_SERVER_URL).',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
        },
    },
    async (args) => {
        const serverBaseUrl = process.env.MCP_SERVER_URL;
        if (!isHttpMode() || !serverBaseUrl) {
            throw new Error('get-assignment-submit-link requires HTTP mode with MCP_SERVER_URL set to the server\'s public base URL (e.g. https://omnivox.example.com). The link must redirect the user\'s browser through this server.');
        }

        const term = args.term_id || await getDefaultTermId();
        const model = await GetTravauxDetailModel(args.course_id, args.assignment_id, term);
        const travail = model?.Travail;

        if (!travail) {
            return { content: [{ type: 'text', text: 'Assignment not found.' }] };
        }

        if (!travail.IsRemisePermise) {
            const reason = travail.EstRemis && !travail.AutorisePlusieursRemises
                ? 'it has already been submitted and the teacher does not allow multiple submissions'
                : 'online submission is closed for it (deadline passed, or the teacher did not enable online hand-in)';
            return {
                content: [{ type: 'text', text: `Cannot generate a submit link for "${travail.Titre}": ${reason}.` }],
            };
        }

        const token = createWebToken({
            type: 'lea-assignment-submit',
            courseId: args.course_id,
            assignmentId: args.assignment_id,
            termId: term,
        });

        const url = `${serverBaseUrl}/link/assignment-submit?token=${token}`;
        const status = travail.EstRemis ? 'Already submitted once — this will add another submission.' : 'Not yet submitted.';

        return {
            content: [{
                type: 'text',
                text: `Submit link for "${travail.Titre}" (expires in 15 minutes): ${url}\n${status} Opening it logs the user into Omnivox and lands on the upload page.`,
            }],
        };
    }
);

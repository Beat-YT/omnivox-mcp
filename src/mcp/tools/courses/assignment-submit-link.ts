import { GetTravauxDetailModel } from "@api/Lea";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { isHttpMode } from "@common/transportMode";
import { toDisplayDate } from "@common/transformHelpers";
import { assignmentIdSchema, courseIdSchema, termIdSchema } from "@common/validation";
import { depositFiles, dueMs } from "@common/assignmentHandIn";
import { createWebToken } from "src/security/omniWebToken";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    course_id: courseIdSchema,
    assignment_id: assignmentIdSchema,
    term_id: termIdSchema.optional(),
});

// Exempt from the markdown-only convention in CLAUDE.md: this tool keeps outputSchema and
// structuredContent so clients can read the URL as a field instead of parsing text.
const output = z.object({
    url: z.string(),
    msg: z.string(),
});

mcpServer.registerTool('get-assignment-submit-link',
    {
        title: 'Get Assignment Submit Link',
        description: 'Get a short link that opens the Omnivox hand-in page for an assignment, already logged in. Give it to the user so they can upload their file in their own browser — this tool never submits anything itself. Link expires after 15 minutes. Fails if online submission is closed for the assignment, or if the server has no public URL (MCP_SERVER_URL).',
        inputSchema: input,
        outputSchema: output,
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
        const t = model?.Travail;

        if (!t?.IDTravail) {
            return { isError: true, content: [{ type: 'text', text: 'Assignment not found.' }] };
        }

        const files = depositFiles(t);

        if (!t.IsRemisePermise) {
            const reason = files.length && !t.AutorisePlusieursRemises
                ? `the deposit already holds ${files.length} file(s) and the teacher allows a single upload`
                : 'online hand-in is closed for it (deadline passed, or the teacher did not enable online hand-in)';
            return {
                isError: true,
                content: [{ type: 'text', text: `Cannot generate a submit link for "${t.Titre}": ${reason}.` }],
            };
        }

        const token = createWebToken({
            type: 'lea-assignment-submit',
            courseId: args.course_id,
            assignmentId: args.assignment_id,
            termId: term,
        });

        const due = dueMs(t);
        const depositNote = files.length
            ? ` The deposit already holds ${files.length} file(s): ${files.map(f => f.NomFichierDepotEtudiant).join(', ')}. Uploading adds a file next to them, it does not replace them.`
            : ' The deposit is empty.';

        const result = {
            url: `${serverBaseUrl}/link/assignment-submit?token=${token}`,
            msg: `Submit link for "${t.Titre}" (expires in 15 minutes).${due ? ` Due ${toDisplayDate(due)}.` : ''}${depositNote} Opening it logs the user into Omnivox and lands on the upload page. Nothing is submitted until they upload there.`,
        };

        return {
            content: [{ type: 'text', text: JSON.stringify(result) }],
            structuredContent: result,
        };
    }
);

import { GetTravauxListeModel } from "@api/Lea";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { extractHtmlPreview, toDisplayDate } from "@common/transformHelpers";
import { courseIdSchema, termIdSchema } from "@common/validation";
import {
    depositFileLines,
    depositLine,
    dueMs,
    FINAL_VERSION_NOTE,
    handInInstructionLines,
    headingTags,
    needsFinalVersionCheck,
    Travail,
} from "@common/assignmentHandIn";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    course_id: courseIdSchema,
    term_id: termIdSchema.optional(),
});

mcpServer.registerTool('get-course-assignments',
    {
        title: 'Get Course Assignments',
        description: 'List the assignments of a course with their deadline and what is in the hand-in deposit. A file in the deposit means something was uploaded, not that the work is finished. Incomplete by nature: many teachers never post assignments here, so an empty list does not mean there is no homework. Cross-check the course syllabus from get-course-documents.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const term = args.term_id || await getDefaultTermId();
        const model = await GetTravauxListeModel(args.course_id, term);
        const travaux = (model.ListeTravaux ?? []).filter(t => t.IDTravail && t.Titre);

        const lines = [
            `# Assignments: ${args.course_id}`,
            `${travaux.length} assignment(s)`,
            '',
        ];
        if (travaux.length) lines.push(...travaux.map(t => formatAssignment(t)));
        else lines.push('No assignments posted on Lea for this course.');

        const content: { type: 'text'; text: string; annotations?: { audience: ('assistant' | 'user')[] } }[] = [
            { type: 'text', text: lines.join('\n') },
        ];
        if (travaux.some(t => needsFinalVersionCheck(t))) {
            content.push({ type: 'text', text: FINAL_VERSION_NOTE, annotations: { audience: ['assistant'] } });
        }

        return { content };
    }
);

function formatAssignment(t: Travail) {
    const due = dueMs(t);
    const preview = extractHtmlPreview(t.Enonce, 240);

    return [
        `## ${t.Titre}${headingTags(t)}`,
        due ? `- Due: ${toDisplayDate(due)}` : '- Due: no deadline set',
        t.NomCategorie && `- Category: ${t.NomCategorie}`,
        depositLine(t),
        ...depositFileLines(t),
        ...handInInstructionLines(t),
        preview && `- Preview: ${preview}`,
        `- ID: ${t.IDTravail}`,
    ].filter(Boolean).join('\n') + '\n';
}

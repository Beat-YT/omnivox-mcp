import { GetCommuniquesListeModel } from "@api/Lea";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { htmlToText, toDisplayDay } from "@common/transformHelpers";
import { courseIdSchema, termIdSchema } from "@common/validation";
import { CommuniquesListeModel } from "@typings/Lea/CommuniquesListeModel";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    course_id: courseIdSchema,
    term_id: termIdSchema.optional(),
});

mcpServer.registerTool('get-course-announcements',
    {
        title: 'Get Course Announcements',
        description: 'Retrieve announcements (communiqués) for a specific course.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const term = args.term_id || await getDefaultTermId();
        const model = await GetCommuniquesListeModel(args.course_id, term);
        const announcements = (model.ListeInfosCommuniques ?? [])
            .sort((a, b) => b.DateDebutDiffusion - a.DateDebutDiffusion);

        const courseName = model.NomCours || announcements[0]?.NomCours;
        const title = courseName ? `${courseName} (${args.course_id})` : args.course_id;
        const unread = announcements.filter(a => !a.Visionne).length;

        const lines = [
            `# Announcements: ${title}`,
            `${announcements.length} announcement(s)${unread ? `, ${unread} unread` : ''}`,
            '',
        ];

        if (announcements.length === 0) {
            lines.push('No announcements for this course.');
        }

        lines.push(...announcements.map(formatAnnouncement));

        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
);

function formatAnnouncement(a: CommuniquesListeModel.ListeInfosCommunique) {
    const expires = toDisplayDay(a.DateFinDiffusion);
    const tags = [
        a.Visionne ? '' : ' *new*',
        expires && a.DateFinDiffusion < Date.now() ? ' [EXPIRED]' : '',
    ].join('');

    const lines = [
        `## ${a.Titre?.trim() || '(no title)'}${tags}`,
        `- Published: ${toDisplayDay(a.DateDebutDiffusion) ?? '?'}`,
        expires && `- Expires: ${expires}`,
    ].filter(Boolean);

    const body = htmlToText(a.Contenu);
    if (body) lines.push('', body);

    return [...lines, ''].join('\n');
}

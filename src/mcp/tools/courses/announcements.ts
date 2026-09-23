import { GetCommuniquesListeModel } from "@api/Lea";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { AnnouncementItem } from "@schemas/courses/announcements";
import { transformAnnouncements } from "@transformers/courses/announcements";
import { courseIdSchema, termIdSchema } from "@common/validation";
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
        const result = transformAnnouncements(model, term, args.course_id);

        const title = result.course_name ? `${result.course_name} (${args.course_id})` : args.course_id;
        const lines = [
            `# Announcements: ${title}`,
            `${result.announcements.length} announcement(s)`,
            '',
            ...result.announcements.map(mapAnnouncementToText),
        ];

        return {
            content: [{ type: 'text', text: lines.join('\n') }],
            structuredContent: result,
        };
    }
);

function mapAnnouncementToText(a: AnnouncementItem) {
    return [
        `## ${a.title}${a.is_read ? '' : ' *new*'}${a.is_active ? '' : ' [EXPIRED]'}`,
        a.published_at && `- Published: ${a.published_at}`,
        a.text_preview && `- Preview: ${a.text_preview}`,
    ].filter(Boolean).join('\n') + '\n';
}

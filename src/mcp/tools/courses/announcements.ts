import { GetCommuniquesListeModel } from "@api/Lea";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { AnnouncementItem } from "@schemas/courses/announcements";
import { transformAnnouncements } from "@transformers/courses/announcements";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    course_id: z.string(),
    term_id: z.string().optional(),
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

        const texts = result.announcements.map(a => ({
            type: 'text' as const,
            text: mapAnnouncementToText(a),
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: `${result.announcements.length} announcement(s) for course ${args.course_id}${result.course_name ? ` (${result.course_name})` : ''}.`,
                },
                ...texts,
            ],
            structuredContent: result,
        };
    }
);

function mapAnnouncementToText(a: AnnouncementItem) {
    return [
        `${a.title}${a.is_read ? '' : ' [UNREAD]'}${a.is_active ? '' : ' [EXPIRED]'}`,
        a.published_at && `Published: ${a.published_at}`,
        a.text_preview && `Preview: ${a.text_preview}`,
        '',
    ].filter(Boolean).join('\n');
}

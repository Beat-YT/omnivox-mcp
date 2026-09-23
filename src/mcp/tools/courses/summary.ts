import { GetDefaultModel } from "@api/Lea";
import { computeDelta, flattenSnapshot, itemDeltaText } from "@common/deltaTracker";
import { CourseItem } from "@schemas/courses";
import { transformCoursesSummary } from "@transformers/courses/summary";
import { termIdSchema } from "@common/validation";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    term_id: termIdSchema.optional(),
});

mcpServer.registerTool('get-courses-summary',
    {
        title: 'Get Courses Summary',
        description: 'Retrieve a summary of courses for a given term or the current term.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const model = await GetDefaultModel(args.term_id);
        const summary = transformCoursesSummary(model);

        const snapshot = flattenSnapshot(summary.courses, c => c.id, {
            total_documents: c => c.total_documents ?? 0,
            total_announcements: c => c.total_announcements ?? 0,
            total_assignments: c => c.total_assignments ?? 0,
            total_evals: c => c.total_evals ?? 0,
            unread_documents: c => c.unread_documents ?? 0,
            unread_announcements: c => c.unread_announcements ?? 0,
            unread_assignments: c => c.unread_assignments ?? 0,
            unread_grades: c => c.unread_grades ?? 0,
        });
        const deltas = computeDelta(`get-courses-summary:${summary.term_id}`, snapshot);
        const dt = itemDeltaText(deltas, m => m.replace(/_/g, ' '));

        const header = `# Courses — term ${summary.term_id} (${summary.courses.length})`;
        const courses = summary.courses.map(c => formatCourse(c, dt?.items[c.id]));

        return {
            content: [{ type: 'text', text: [header, dt?.header, '', ...courses].filter(l => l != null).join('\n') }],
        };
    }
)

function formatCourse(c: CourseItem, delta?: string) {
    const unread: string[] = [];
    if (c.unread_documents)     unread.push(`${c.unread_documents} new docs`);
    if (c.unread_announcements) unread.push(`${c.unread_announcements} new announcements`);
    if (c.unread_assignments)   unread.push(`${c.unread_assignments} new assignments`);
    if (c.unread_grades)        unread.push(`${c.unread_grades} new evals`);

    const totals = [
        `${c.total_documents ?? 0} docs`,
        `${c.total_announcements ?? 0} announcements`,
        `${c.total_assignments ?? 0} assignments`,
        `${c.total_evals ?? 0} evals`,
    ].join(', ');

    const lines = [
        `## ${c.title} (${c.id})`,
        `- Totals: ${totals}`,
    ];

    if (unread.length) {
        lines.push(`- Unread: ${unread.join(', ')}`);
    }

    lines.push(`- Changes: ${delta || '[no changes since last check]'}`);
    lines.push('');
    return lines.join('\n');
}

import { GetDefaultModel } from "@api/Lea";
import { CourseItem, coursesSummarySchema } from "@schemas/courses";
import { transformCoursesSummary } from "@transformers/courses/summary";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    term_id: z.string().optional(),
});

mcpServer.registerTool('get-courses-summary',
    {
        title: 'Get Courses Summary',
        description: 'Retrieve a summary of courses for a given term or the current term.',
        inputSchema: input,
        outputSchema: coursesSummarySchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const model = await GetDefaultModel(args.term_id);
        const summary = transformCoursesSummary(model);

        const courseTexts = summary.courses.map(c => ({
            type: 'text' as const,
            text: mapCourseToText(c)
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: `Here is the summary of the user's courses on for term ID: ${summary.term_id} (${summary.courses.length} courses total)`
                },
                ...courseTexts,
            ],
            structuredContent: summary
        }
    }
)

function mapCourseToText(course: CourseItem) {
    return [
        `Course: ${course.title}`,
        `Code: ${course.course_code}`,
        `Group: ${course.group}`,
        `Unread: documents=${course.unread_documents}, announcements=${course.unread_announcements}, assignments=${course.unread_assignments}, grades=${course.unread_grades}`,
        `Has: documents=${bool(course.has_documents)}, announcements=${bool(course.has_announcements)}, assignments=${bool(course.has_assignments)}, grades=${bool(course.has_grades)}`,
        ``
    ].join('\n');
}

function bool(value: boolean) {
    return value ? 'true' : 'false';
}
import { GetCalendrierModel } from "@api/Calendrier";
import { CalendarEvent, CalendarPageSchema } from "@schemas/calendar/calendar";
import { transformCalendarModel } from "@transformers/calendar/calendar";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    page: z.number().optional(),
});

mcpServer.registerTool('get-calendar',
    {
        title: 'Get Calendar',
        description: 'Retrieve upcoming calendar events (classes, exams, assignments, holidays, etc.).',
        inputSchema: input,
        outputSchema: CalendarPageSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const model = await GetCalendrierModel(args.page ?? 0);
        const page = transformCalendarModel(model);

        const eventTexts = page.events.map(e => ({
            type: 'text' as const,
            text: mapEventToText(e),
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: `Calendar: ${page.events.length} events (page ${page.currentPage ?? 0}, hasNext=${page.hasNextPage}, hasPrev=${page.hasPreviousPage})`,
                },
                ...eventTexts,
            ],
            structuredContent: page,
        };
    }
);

function mapEventToText(e: CalendarEvent) {
    return [
        `${e.category.toUpperCase()}: ${e.title}`,
        `Date: ${e.start}${e.end ? ` → ${e.end}` : ''} (${e.status})`,
        e.course && `Course: ${e.course.course_id}`,
        e.location && `Location: ${e.location}`,
        e.weight && `Weight: ${e.weight}%`,
        e.description && `Description: ${e.description}`,
        '',
    ].filter(Boolean).join('\n');
}

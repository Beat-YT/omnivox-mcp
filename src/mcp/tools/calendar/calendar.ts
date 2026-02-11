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
        description: 'Retrieve upcoming calendar events (classes, exams, assignments, etc.).',
        inputSchema: input,
        // outputSchema: CalendarPageSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const model = await GetCalendrierModel(args.page ?? 0);
        const page = transformCalendarModel(model);

        // Group events by date for readable text output
        const grouped = new Map<string, CalendarEvent[]>();
        for (const e of page.events) {
            const day = formatDate(e.start);
            if (!grouped.has(day)) grouped.set(day, []);
            grouped.get(day)!.push(e);
        }

        const lines: string[] = [];

        // @ts-ignore
        for (const [day, events] of grouped) {
            lines.push(`\n--- ${day} ---`);
            for (const e of events) {
                lines.push(mapEventToText(e));
            }
        }

        return {
            content: [
                {
                    type: 'text',
                    text: [
                        `Current Time: ${new Date().toLocaleString('en-CA', { timeZoneName: 'short' })}`,
                        'Times are shown in local time. Events marked (past) have already occurred.',
                        `Current Page: ${args.page ?? 0}, Has Previous: ${page.hasPreviousPage}, Has Next: ${page.hasNextPage}`,
                    ].join('\n'),
                    annotations: { audience: ['assistant'] },
                },
                {
                    type: 'text',
                    text: lines.join('\n'),
                },
            ],
            // structuredContent: page,
        };
    }
);

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function mapEventToText(e: CalendarEvent): string {
    const parts: string[] = [];

    if (e.allDay) {
        parts.push(`[${e.category}] ${e.title}`);
    } else {
        const time = `${formatTime(e.start)}–${e.end ? formatTime(e.end) : '?'}`;
        parts.push(`${time} ${e.title}${e.location ? ` (${e.location})` : ''}`);
    }

    if (e.classType) parts.push(` type: ${e.classType}`);
    if (e.course) parts.push(`  course: ${e.course.name ?? e.course.course_id}`);
    if (e.weight) parts.push(`  weight: ${e.weight / 100}%`);
    if (e.description) parts.push(`  ${e.description}`);
    if (e.status === 'past') parts.push(`  (past)`);

    return parts.join('\n');
}

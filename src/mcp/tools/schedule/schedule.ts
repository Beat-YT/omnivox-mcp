import { GetHoraireModel } from "@api/Horaire";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { ScheduleItem } from "@schemas/schedule.schema";
import { transformHoraireToSchedule } from "@transformers/schedule";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    term_id: z.string().optional(),
});

mcpServer.registerTool('get-schedule',
    {
        title: 'Get Schedule',
        description: 'Retrieve the weekly class schedule (timetable) for a given term or the current term.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const term = args.term_id || await getDefaultTermId();
        const model = await GetHoraireModel(term);

        if (args.term_id && model.AnSession !== args.term_id) {
            return {
                content: [{ type: 'text', text: `Schedule for term ${args.term_id} is not available. The API returned term ${model.AnSession} instead.` }],
                isError: true,
            };
        }

        const schedule = transformHoraireToSchedule(model);

        const texts = schedule.schedule.map(s => ({
            type: 'text' as const,
            text: mapScheduleItemToText(s),
        }));

        return {
            content: [
                { type: 'text', text: `Schedule for term ${schedule.term_id}: ${schedule.schedule.length} time slots.` },
                ...texts,
            ],
            structuredContent: schedule,
        };
    }
);

function mapScheduleItemToText(s: ScheduleItem) {
    return [
        `${s.day_str} ${s.time_str} — ${s.title}`,
        s.course_code && `Code: ${s.course_code} (Group ${s.group})`,
        s.type && `Type: ${s.type}`,
        s.rooms?.length && `Room: ${s.rooms.join(', ')}`,
        '',
    ].filter(Boolean).join('\n');
}

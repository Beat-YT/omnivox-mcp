import { GetHoraireModel } from "@api/Horaire";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { ScheduleItem } from "@schemas/schedule.schema";
import { transformHoraireToSchedule } from "@transformers/schedule";
import { termIdSchema } from "@common/validation";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    term_id: termIdSchema.optional(),
});

mcpServer.registerTool('get-schedule',
    {
        title: 'Get Schedule',
        description: 'Retrieve the static weekly class schedule (timetable) for a given term or the current term. Same every week: it does not reflect holidays, day swaps or cancelled classes. Use get-calendar for those.',
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

        const lines = [`# Weekly schedule — term ${schedule.term_id} (${schedule.schedule.length} slots)`];
        let currentDay = '';
        for (const s of schedule.schedule) {
            if (s.day_str !== currentDay) {
                currentDay = s.day_str;
                lines.push('', `## ${currentDay}`);
            }
            lines.push(mapScheduleItemToText(s));
        }

        return {
            content: [{ type: 'text', text: lines.join('\n') }],
            structuredContent: schedule,
        };
    }
);

function mapScheduleItemToText(s: ScheduleItem) {
    const details = [
        s.course_code && `${s.course_code}.${s.group}`,
        s.type,
        s.rooms?.length && `room ${s.rooms.join(', ')}`,
    ].filter(Boolean);
    return `- ${s.time_str}: ${s.title}${details.length ? ` (${details.join(', ')})` : ''}`;
}

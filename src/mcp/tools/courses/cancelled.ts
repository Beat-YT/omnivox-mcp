import { GetCoursAnnuleModel } from "@api/CoursAnnule";
import { CancelledClass } from "@schemas/courses/cancelled";
import { transformCoursAnnule } from "@transformers/courses/cancelled";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({});

mcpServer.registerTool('get-cancelled-classes',
    {
        title: 'Get Cancelled Classes',
        description: 'Retrieve upcoming cancelled class sessions with time, course, teacher, room and any teacher comment.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async () => {
        const model = await GetCoursAnnuleModel();
        const data = transformCoursAnnule(model);

        if (data.cancelled_classes.length === 0) {
            return {
                content: [{ type: 'text', text: 'No cancelled classes.' }],
            };
        }

        const header = `${data.cancelled_classes.length} cancelled class(es):`;
        const lines = data.cancelled_classes.map(formatCancelled);

        return {
            content: [{ type: 'text', text: [header, '', ...lines].join('\n') }],
        };
    }
);

function formatCancelled(c: CancelledClass): string {
    const start = new Date(c.start);
    const end = new Date(c.end);
    const date = start.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const time = `${formatTime(start)}-${formatTime(end)}`;
    const parts = [
        `- ${date} ${time}: ${c.course_name} (${c.course_id})`,
        c.teacher && `  Teacher: ${c.teacher}`,
        c.rooms.length && `  Room: ${c.rooms.join(', ')}`,
        c.comment && `  Note: ${c.comment}`,
    ];
    return parts.filter(Boolean).join('\n');
}

function formatTime(d: Date): string {
    return d.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false });
}

import { CalendarEvent } from "@schemas/calendar/calendar";
import { CourseItem } from "@schemas/courses/summary";
import { CollegeNewsItem } from "@schemas/college/college-news";

type DeltaText = { header: string; items: Record<string, string> } | null;

export interface ServiceUpdate {
    service_id: string;
    label: string;
    count: number;
    title?: string;
    description?: string;
}

export function formatServiceUpdates(items: ServiceUpdate[], dt: DeltaText): string | null {
    if (items.length === 0) return null;

    const lines = items.map(i => {
        const desc = i.description ? ` — ${i.description}` : '';
        const showTitle = i.title && i.title !== String(i.count);
        const titlePart = showTitle ? `: ${i.title}` : '';
        const delta = dt?.items[i.service_id];
        return `${i.label} (${i.count})${titlePart}${desc}${delta ? ' ' + delta : ''}`;
    });

    return ['## Notifications:', ...lines].join('\n');
}

/** Per-course delta counts (new items since last call), keyed by course ID. */
export type CourseNewCounts = Record<string, {
    announcements: number;
    assignments: number;
    grades: number;
}>;

export function formatCourseNewItems(courses: CourseItem[], newCounts: CourseNewCounts | null): string | null {
    const entries: string[] = [];

    for (const c of courses) {
        const parts: string[] = [];

        // "unread" = Omnivox native unread count (documents only)
        if (c.unread_documents) parts.push(`${c.unread_documents} unread docs`);

        // "new" = delta since last call (only positive)
        const nc = newCounts?.[c.id];
        if (nc) {
            if (nc.announcements > 0) parts.push(`+${nc.announcements} new announcements`);
            if (nc.assignments > 0)   parts.push(`+${nc.assignments} new assignments`);
            if (nc.grades > 0)        parts.push(`+${nc.grades} new grades`);
        }

        if (parts.length > 0) {
            entries.push(`* ${c.title} (${c.id}): ${parts.join(', ')}`);
        }
    }

    if (entries.length === 0) return null;

    return ['## Per-course updates:', ...entries].join('\n');
}

export function formatMioInbox(dt: DeltaText): string | null {
    if (!dt) return null;
    const delta = dt.items['inbox'];
    if (delta) return `## New MIO messages: ${delta}`;
    return null;
}

export function formatUpcomingEvals(events: CalendarEvent[]): string | null {
    const upcoming = events
        .filter(e => e.category === 'eval' && e.status === 'upcoming')
        .slice(0, 3);

    if (upcoming.length === 0) return null;

    const lines = ['## Upcoming evals:'];
    for (const e of upcoming) {
        const date = new Date(e.start).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
        const time = e.allDay ? '' : ` ${new Date(e.start).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
        const course = e.course?.name ?? e.course?.course_id ?? '';
        const weight = e.weight ? ` (${e.weight / 100}%)` : '';
        lines.push(`- ${date}${time} — ${e.title}${weight}${course ? `, ${course}` : ''}`);
    }
    lines.push('Note: Some professors do not post eval dates on Lea. Check course syllabus for the full schedule.');
    return lines.join('\n');
}

export function formatFeaturedNews(items: CollegeNewsItem[]): string | null {
    const featured = items.find(n => n.is_featured);
    if (!featured) return null;
    let preview = featured.content_preview ?? '';
    if (preview.length > 120) preview = preview.slice(0, 120).trimEnd() + '…';
    return `## Featured news:\n${featured.title}${preview ? ` — ${preview}` : ''}`;
}

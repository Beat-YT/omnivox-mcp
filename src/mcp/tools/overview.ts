import { GetAppUpdates } from "@api/App";
import { GetCalendrierModel } from "@api/Calendrier";
import { GetListeActualite } from "@api/College";
import { GetDefaultModel } from "@api/Lea";
import { GetListeFoldersModel } from "@api/Mio";
import { computeDelta, flattenSnapshot, itemDeltaText } from "@common/deltaTracker";
import { transformCalendarModel } from "@transformers/calendar/calendar";
import { transformCollegeNews } from "@transformers/college/college-news";
import { transformCoursesSummary } from "@transformers/courses/summary";
import { transformMioFolders } from "@transformers/mio/folders";
import {
    formatServiceUpdates,
    formatCourseNewItems,
    formatMioInbox,
    formatUpcomingEvals,
    formatFeaturedNews,
    CourseNewCounts,
} from "@transformers/overview";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

// Services already covered by GetDefaultModel (per-course) or GetListeFoldersModel (MIO)
const REDUNDANT_SERVICES = new Set(['cvir_docu', 'cvir_comm', 'cvir_trav', 'cvir_note', 'mio']);

const SERVICE_LABELS: Record<string, string> = {
    cvir_even: 'New events',
    FRME: 'Forms to complete',
};

const input = z.object({
    term_id: z.string().optional(),
});

mcpServer.registerTool('get-overview',
    {
        title: 'Get Overview',
        description: 'Get a summary of all new and unread items across all services: per-course new documents, announcements, assignments, and grades with delta tracking, new MIO messages (delta on inbox total), upcoming evals, featured college news, plus events and college forms. This is the best starting point to see what needs attention.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const [data, leaModel, mioModel, calModel, newsData] = await Promise.all([
            GetAppUpdates(args.term_id),
            GetDefaultModel(args.term_id),
            GetListeFoldersModel(),
            GetCalendrierModel(0),
            GetListeActualite(),
        ]);

        // --- Service-level updates ---
        const serviceItems = data.ListeUpdates
            .filter(u => u.NbNotifications > 0 && !REDUNDANT_SERVICES.has(u.IdService))
            .map(u => ({
                service_id: u.IdService,
                label: SERVICE_LABELS[u.IdService] || u.NomRetour || u.IdService,
                count: u.NbNotifications,
                title: u.Nom?.trim() || undefined,
                description: u.Description?.trim() || undefined,
            }));

        const serviceSnapshot = flattenSnapshot(serviceItems, i => i.service_id, {
            count: i => i.count,
        });
        const serviceDeltas = computeDelta('get-overview', serviceSnapshot);
        const serviceDt = itemDeltaText(serviceDeltas, m => m === 'count' ? '' : m.replace(/_/g, ' '));

        // --- Per-course updates (delta on totals = genuinely new items) ---
        const courseSummary = transformCoursesSummary(leaModel);
        const courseSnapshot = flattenSnapshot(courseSummary.courses, c => c.id, {
            total_announcements: c => c.total_announcements ?? 0,
            total_assignments: c => c.total_assignments ?? 0,
            total_evals: c => c.total_evals ?? 0,
        });
        const courseDeltas = computeDelta(`get-overview:courses:${courseSummary.term_id}`, courseSnapshot);

        let courseNewCounts: CourseNewCounts | null = null;
        if (courseDeltas) {
            courseNewCounts = {};
            for (const d of courseDeltas) {
                const sepIdx = d.key.indexOf(':');
                const courseId = d.key.substring(0, sepIdx);
                const metric = d.key.substring(sepIdx + 1);
                if (!courseNewCounts[courseId]) courseNewCounts[courseId] = { announcements: 0, assignments: 0, grades: 0 };
                if (metric === 'total_announcements') courseNewCounts[courseId].announcements = d.diff;
                if (metric === 'total_assignments') courseNewCounts[courseId].assignments = d.diff;
                if (metric === 'total_evals') courseNewCounts[courseId].grades = d.diff;
            }
        }

        // --- MIO inbox ---
        const mioFolders = transformMioFolders(mioModel);
        const inbox = mioFolders.folders.find(f => f.type === 'inbox');
        let mioDt: ReturnType<typeof itemDeltaText> = null;
        if (inbox) {
            const mioSnapshot = flattenSnapshot([inbox], () => 'inbox', {
                total: f => f.total_msg_count,
            });
            const mioDeltas = computeDelta('get-overview:mio', mioSnapshot);
            mioDt = itemDeltaText(mioDeltas, () => 'messages');
        }

        // --- Build content blocks ---
        const calPage = transformCalendarModel(calModel);
        const news = transformCollegeNews(newsData);

        const sections = [
            formatServiceUpdates(serviceItems, serviceDt),
            formatCourseNewItems(courseSummary.courses, courseNewCounts),
            formatMioInbox(mioDt),
            formatUpcomingEvals(calPage.events),
            formatFeaturedNews(news),
        ];

        const content = sections
            .filter((text): text is string => text !== null)
            .map(text => ({ type: 'text' as const, text }));

        if (content.length === 0) {
            content.push({ type: 'text', text: 'Nothing new.' });
        }

        content.push({
            type: 'text',
            text: [
                '## Drill down:',
                '- Full schedule & evals → get-calendar',
                '- Course documents → get-course-documents',
                '- Course announcements → get-course-announcements',
                '- Course assignments → get-course-assignments',
                '- Grades detail → get-course-evals',
                '- MIO messages → get-mio-messages',
                '- All college news → get-college-news',
            ].join('\n'),
            annotations: { audience: ['assistant'] },
        } as any);

        return { content };
    }
);

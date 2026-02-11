import { GetAppUpdates } from "@api/App";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const SERVICE_LABELS: Record<string, string> = {
    cvir_docu: 'New documents',
    cvir_comm: 'New announcements',
    cvir_trav: 'New assignments',
    cvir_note: 'New grades',
    cvir_even: 'New events',
    mio: 'Unread MIO messages',
    FRME: 'Forms to complete',
};

const input = z.object({
    term_id: z.string().optional(),
});

mcpServer.registerTool('get-overview',
    {
        title: 'Get Overview',
        description: 'Get a summary of all new and unread items across all services: new MIO messages, new documents, new announcements, new assignments, new grades, and college forms. This is the best starting point to see what needs attention.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const data = await GetAppUpdates(args.term_id);

        const items = data.ListeUpdates
            .filter(u => u.NbNotifications > 0)
            .map(u => ({
                service_id: u.IdService,
                label: SERVICE_LABELS[u.IdService] || u.NomRetour || u.IdService,
                count: u.NbNotifications,
                title: u.Nom?.trim() || undefined,
                description: u.Description?.trim() || undefined,
                module: u.ModuleMobile || undefined,
                dismissable: u.IndicateurPeutDismiss,
            }));

        const lines = items.map(i => {
            const desc = i.description ? ` — ${i.description}` : '';
            // For Lea/MIO badge counts, the title is just the count number
            const showTitle = i.title && i.title !== String(i.count);
            const titlePart = showTitle ? `: ${i.title}` : '';
            return `${i.label}: ${i.count}${titlePart}${desc}`;
        });

        if (lines.length === 0) {
            lines.push('Nothing new.');
        }

        return {
            content: [
                { type: 'text', text: lines.join('\n') },
            ],
            structuredContent: {
                items,
                default_term: data.AnSessionDisponible?.AnSessionDefault,
            },
        };
    }
);

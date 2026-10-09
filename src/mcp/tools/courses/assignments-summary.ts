import { GetTravauxSommaireModel } from "@api/Lea";
import { computeDelta, flattenSnapshot, itemDeltaText } from "@common/deltaTracker";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { termIdSchema } from "@common/validation";
import { TravauxSommaireModel } from "@typings/Lea/TravauxSommaireModel";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    term_id: termIdSchema.optional(),
});

mcpServer.registerTool('get-assignments-summary',
    {
        title: 'Get Assignments Summary',
        description: 'Per-course assignment counts for a term, with the titles Lea still lists as to hand in. Only counts assignments teachers posted on Lea; an empty summary does not mean the student is caught up. Use get-course-assignments for deadlines and deposit contents.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const term = args.term_id || await getDefaultTermId();
        const model = await GetTravauxSommaireModel(term);
        const courses = (model.ListeSommaire ?? []).filter(c => c.NoCours && c.NoGroupe && c.NomCours);

        const snapshot = flattenSnapshot(courses, courseId, {
            total_assignments: c => c.NbEnoncesTotal ?? 0,
            new_assignments_count: c => c.NbNouveaute ?? 0,
            new_correction_count: c => c.NouvellesCorrections ?? 0,
        });
        const deltas = computeDelta(`get-assignments-summary:${term}`, snapshot);
        const dt = itemDeltaText(deltas, m => m.replace(/_/g, ' '));

        const header = `# Assignments — term ${term} (${courses.length} courses)`;
        const body = courses.map(c => formatCourse(c, dt?.items[courseId(c)]));

        return {
            content: [{ type: 'text', text: [header, dt?.header, '', ...body].filter(l => l != null).join('\n') }],
        };
    }
);

function courseId(c: TravauxSommaireModel.ListeSommaire) {
    return `${c.NoCours}.${c.NoGroupe}`;
}

function formatCourse(c: TravauxSommaireModel.ListeSommaire, delta?: string) {
    const details: string[] = [];
    details.push(`- Total: ${c.NbEnoncesTotal ?? 0}`);
    if (c.NbNouveaute) details.push(`- New: ${c.NbNouveaute}`);
    if (c.NouvellesCorrections) details.push(`- New corrections: ${c.NouvellesCorrections}`);
    if ((c.DepotEnLigne ?? 0) > 0) details.push(`- Online hand-in available`);

    const pending = (c.ListeTitreTravauxARemettre ?? []).filter(Boolean);
    if (pending.length) {
        details.push(`- Still to hand in according to Lea (${pending.length}):`);
        details.push(...pending.map(title => `  - ${title}`));
    }

    return [
        `## ${c.NomCours} (${courseId(c)})`,
        ...details,
        `- Changes: ${delta || '[no changes since last check]'}`,
        '',
    ].join('\n');
}

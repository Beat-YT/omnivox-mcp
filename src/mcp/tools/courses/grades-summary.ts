import { GetNotesSommaireModel } from "@api/Lea";
import { computeDelta, flattenSnapshot, itemDeltaText } from "@common/deltaTracker";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { isRealInt } from "@common/transformHelpers";
import { termIdSchema } from "@common/validation";
import { NotesSommaireModel } from "@typings/Lea/NotesSommaireModel";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    term_id: termIdSchema.optional(),
});

mcpServer.registerTool('get-grades-summary',
    {
        title: 'Get Grades Summary',
        description: 'Retrieve a list of grades summaries for the user\'s courses in a given term or the current term.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        }
    },
    async (args) => {
        const term = args.term_id || await getDefaultTermId();
        const model = await GetNotesSommaireModel(term);
        const courses = model.ListeInfosNotes ?? [];

        const snapshot = flattenSnapshot(courses, c => `${c.NoCours}.${c.NoGroupe}`, {
            new_evaluations_count: c => c.NouveauEvals ?? 0,
            accumulated_weight: c => val(c.PourcentAccumul) ?? 0,
        });
        const deltas = computeDelta(`get-grades-summary:${term}`, snapshot);
        const dt = itemDeltaText(deltas, m => m.replace(/_/g, ' '));

        const lines = [
            `# Grades — term ${term} (${courses.length} courses)`,
            dt?.header,
            '',
            ...courses.map(c => formatGrade(c, dt?.items[`${c.NoCours}.${c.NoGroupe}`])),
        ];

        return {
            content: [{ type: 'text', text: lines.filter(l => l != null).join('\n') }],
        };
    }
)

function formatGrade(c: NotesSommaireModel.ListeInfosNote, delta?: string) {
    const earned = val(c.NotePonderee);
    const graded = val(c.PourcentAccumul);
    const projected = val(c.NoteProjetee);
    const avg = val(c.Moyenne) || null;
    const median = val(c.Mediane) || null;
    const stdDev = val(c.EcartType) || null;

    const lines = [
        `## ${c.NomCours} (${c.NoCours}.${c.NoGroupe})${c.NouveauEvals ? ' *new*' : ''}`,
    ];

    const finalGrade = Number(c.NoteFinale) || null;
    if (finalGrade) {
        lines.push(`- Final grade: ${finalGrade}%${c.MoyenneFinale ? ` (class avg ${c.MoyenneFinale}%)` : ''}`);
    } else if (!graded && !earned) {
        lines.push('- No evaluations graded yet, 100% of the final grade is still to come');
    } else {
        lines.push(`- Current: ${fmt(earned)}/${fmt(graded)} (earned/graded weight), ${pct(100 - (graded ?? 0))} remaining`);
        if (projected != null && earned != null && graded && projected !== round(earned / graded * 100)) {
            lines.push(`- Projected grade (with bonuses/penalties): ${fmt(projected)}/100`);
        }
    }

    if (avg && median) {
        lines.push(`- Class: avg ${pct(avg)}, median ${pct(median)}${stdDev ? `, std dev ${pct(stdDev)}` : ''}`);
    }

    if (c.NouveauEvals) {
        lines.push(`- New evals: ${c.NouveauEvals}`);
    }

    lines.push(`- Changes: ${delta || '[no changes since last check]'}`);
    lines.push('');

    return lines.join('\n');
}

// x100 fixed-point (number or numeric string) -> number, sentinels/empty -> null
function val(n: number | string | null | undefined): number | null {
    if (n == null || n === '') return null;
    const num = Number(n);
    return isRealInt(num) ? num / 100 : null;
}

function round(n: number, decimals = 2) {
    return Number(n.toFixed(decimals));
}

function fmt(n: number | null, decimals = 2): string {
    return n == null ? '—' : String(round(n, decimals));
}

function pct(n: number | null): string {
    return n == null ? '—' : `${fmt(n, 1)}%`;
}

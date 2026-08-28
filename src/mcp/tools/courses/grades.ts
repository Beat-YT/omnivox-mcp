import { GetNotesDetailModel, GetNotesDetailWebModel, GetNotesSommaireModel } from "@api/Lea";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { NotesDetailModel } from "@typings/Lea/NotesDetailModel";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    term_id: z.string().optional(),
    course_id: z.string(),
});

const INT_MAX = 2147483647;
const INT_MIN = -2147483648;

// x100 fixed-point -> number, sentinels/null -> null
function val(n: number | null | undefined): number | null {
    if (n == null || n === INT_MAX || n === INT_MIN) return null;
    return n / 100;
}

function fmt(n: number | null, decimals = 2): string {
    if (n == null) return '—';
    return String(Number(n.toFixed(decimals)));
}

function pct(n: number | null): string {
    return n == null ? '—' : `${fmt(n, 1)}%`;
}

function signed(n: number): string {
    return `${n >= 0 ? '+' : ''}${fmt(n, 1)}`;
}

function day(ts: number | null | undefined): string | null {
    if (!ts || ts < 0) return null;
    return new Date(ts).toISOString().slice(0, 10);
}

mcpServer.registerTool('get-course-evals',
    {
        title: 'Get Course Grades',
        description: 'Retrieve evaluations, grades and course summary for a specific course.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        const term = args.term_id || await getDefaultTermId();
        const [course_code, course_group] = args.course_id.split('.');

        const [model, webModel, sommaireModel] = await Promise.all([
            GetNotesDetailModel(course_code, course_group, term),
            GetNotesDetailWebModel(course_code, course_group, term).catch(() => null),
            GetNotesSommaireModel(term).catch(() => null),
        ]);

        const courseInfo = sommaireModel?.ListeInfosNotes.find(
            c => c.NoCours === course_code && c.NoGroupe === course_group
        );
        const teachers = webModel?.NoteEvaluationWeb?.Enseignants ?? [];
        const newIds = new Set(model.ListeIdEvaluationNonConsulte.split(',').map(s => s.trim()).filter(Boolean));

        const title = courseInfo?.NomCours
            ? `# ${courseInfo.NomCours} (${course_code}.${course_group}) — term ${term}`
            : `# ${course_code}.${course_group} — term ${term}`;

        const lines: string[] = [title];
        if (teachers.length) lines.push(`Teacher: ${teachers.join(', ')}`);
        if (!model.IsPeutVisualiser) lines.push('Grades are currently not viewable for this course.');
        lines.push('');
        lines.push(...formatSummary(model.Sommaire));
        lines.push('');

        if (!model.Evaluations.length) {
            lines.push('No evaluations published yet.');
        }
        for (const category of model.Categories) {
            lines.push(...formatCategory(category, model, newIds));
        }

        return {
            content: [
                {
                    type: 'text',
                    text: [
                        'Marks are points; percentages in parentheses. "vs class" compares the student to the class average on that evaluation.',
                        'Weight = share of the final grade; "earned x/y pts" = points banked toward the final grade.',
                        'Bonus/penalty evaluations add to / subtract from the final grade directly.',
                        newIds.size ? '* = new evaluation not yet consulted.' : '',
                    ].filter(Boolean).join(' '),
                    annotations: { audience: ['assistant'] },
                },
                {
                    type: 'text',
                    text: lines.join('\n'),
                },
            ],
        }
    }
)

function formatSummary(sommaire: NotesDetailModel.Sommaire): string[] {
    const current = val(sommaire.NotePonderee);
    const projected = val(sommaire.NoteProjetee);
    const accumulated = val(sommaire.PourcentAccumul);
    const avg = val(sommaire.Moyenne) || null;
    const median = val(sommaire.Mediane) || null;
    const stdDev = val(sommaire.EcartType) || null;

    const lines: string[] = [];

    if (!accumulated && !current) {
        lines.push('No evaluations graded yet — 100% of the final grade is still to come.');
        return lines;
    }

    const progress = accumulated != null && accumulated < 100
        ? ` — ${pct(accumulated)} of final grade evaluated, ${pct(100 - accumulated)} remaining`
        : '';
    lines.push(`Current grade: ${fmt(current)}/100${progress}`);

    if (projected != null && current != null && projected !== current) {
        lines.push(`Projected grade (with bonuses/penalties): ${fmt(projected)}/100`);
    }
    if (sommaire.NoteFinale) {
        lines.push(`Final grade transmitted: ${sommaire.NoteFinale}%`);
    }

    // all-zero class stats mean the college doesn't publish them for this course
    const classStats: string[] = [];
    if (avg) classStats.push(`avg ${pct(avg)}`);
    if (median) classStats.push(`median ${pct(median)}`);
    if (stdDev) classStats.push(`std dev ${pct(stdDev)}`);
    if (classStats.length) {
        const vs = avg != null && current != null ? ` (you: ${signed(current - avg)} vs avg)` : '';
        lines.push(`Class so far: ${classStats.join(', ')}${vs}`);
    }
    if (sommaire.MoyenneFinale) {
        const finalAvg = Number(sommaire.MoyenneFinale);
        const mine = sommaire.NoteFinale ? Number(sommaire.NoteFinale) : null;
        const vs = Number.isFinite(finalAvg) && mine != null ? ` (you: ${signed(mine - finalAvg)})` : '';
        lines.push(`Final class average: ${sommaire.MoyenneFinale}%${vs}`);
    }

    return lines;
}

function formatCategory(category: NotesDetailModel.Category, model: NotesDetailModel.ResponseModel, newIds: Set<string>): string[] {
    const evals = model.Evaluations
        .filter(e => e.IDCategorie === category.IDCategorie)
        .sort((a, b) => Number(a.RangEval) - Number(b.RangEval));
    if (!evals.length) return [];

    const weight = val(category.PonderationCategorie);
    const earned = val(category.MoyenneCategorie);

    const lines: string[] = [];
    if (!model.UniquementNonCategorise) {
        const name = category.NomCategorie
            || (evals[0].TypeEvaluation === 40 ? 'Penalties to final grade' : 'Bonuses to final grade');
        const hasGraded = evals.some(e => val(e.Note) != null);
        const header = [`## ${name}`];
        if (weight != null) {
            header.push(`— weight ${pct(weight)}`);
            if (earned != null && hasGraded) header.push(`| your avg ${pct(earned / weight * 100)} (${fmt(earned)}/${fmt(weight, 1)} pts)`);
        }
        lines.push(header.join(' '));
        if (category.MoyenneMinimalCategorie != null) {
            const cap = category.NoteFinaleMaximumCategorie != null
                ? `, otherwise final grade capped at ${fmt(val(category.NoteFinaleMaximumCategorie), 1)}`
                : '';
            lines.push(`Required category minimum: ${fmt(val(category.MoyenneMinimalCategorie), 1)}${cap}`);
        }
    }

    evals.forEach((ev, i) => lines.push(...formatEval(ev, i + 1, newIds)));
    lines.push('');
    return lines;
}

function formatEval(ev: NotesDetailModel.Evaluation, position: number, newIds: Set<string>): string[] {
    const marker = newIds.has(ev.IDEvaluation) ? ' *new*' : '';
    const note = val(ev.Note);
    const noteBase = val(ev.NoteBase);
    const nbPts = val(ev.NbPts);
    const ponderation = val(ev.Ponderation);
    const classAvg = val(ev.Moyenne);
    const sign = ev.TypeEvaluation === 40 ? '-' : '+';
    const date = day(ev.DateEvaluation);

    const parts: string[] = [];
    if (note == null) {
        parts.push('not graded yet');
        if (ev.TypeEvaluation === 1 && ponderation != null) parts.push(`weight ${pct(ponderation)}`);
        if (ev.TypeEvaluation !== 1 && nbPts != null) parts.push(`up to ${sign}${fmt(nbPts)} pts on final grade`);
        if (date) parts.push(`due/held ${date}`);
    } else if (ev.TypeEvaluation === 1) {
        const ratio = nbPts ? note / nbPts : null;
        parts.push(`${fmt(note)}/${fmt(nbPts)}${ratio != null ? ` (${pct(ratio * 100)})` : ''}`);
        if (classAvg != null && nbPts) {
            const avgPct = classAvg / nbPts * 100;
            const vs = ratio != null ? `, you ${signed(ratio * 100 - avgPct)} vs class` : '';
            parts.push(`class avg ${pct(avgPct)}${vs}`);
        }
        if (ponderation != null) {
            const earnedPts = nbPts ? note / nbPts * ponderation : null;
            parts.push(`weight ${pct(ponderation)}${earnedPts != null ? ` (earned ${fmt(earnedPts)}/${fmt(ponderation, 1)} pts)` : ''}`);
        }
    } else {
        parts.push(`${sign}${fmt(note)} pts on final grade${nbPts != null ? ` (out of ${sign}${fmt(nbPts)})` : ''}`);
    }

    const lines = [`${position}. ${ev.NomEvaluation}${marker} — ${parts.join(' | ')}`];

    for (const adj of ev.Ajustements) {
        lines.push(`   Adjustment: ${adj.NomAjustement} ${adj.Type === 2 ? '-' : '+'}${fmt(val(adj.ValeurAjustement))} (base mark: ${fmt(noteBase)})`);
    }

    const median = val(ev.Mediane);
    const stdDev = val(ev.EcartType);
    if (ev.TypeEvaluation === 1 && note != null && (median != null || stdDev != null)) {
        const stats: string[] = [];
        if (median != null) stats.push(`median ${fmt(median)}`);
        if (stdDev != null) stats.push(`std dev ${fmt(stdDev)}`);
        lines.push(`   Class stats: ${stats.join(', ')}`);
    }

    for (const comment of ev.CommentairesEtudiant) {
        const on = day(comment.TimestampCommentaireEtudiant);
        lines.push(`   > ${comment.NomProfCommentaireEtudiant}${on ? ` (${on})` : ''}: ${comment.TexteCommentaireEtudiant}`);
    }
    if (ev.TexteCommentaireGroupe) {
        const on = day(ev.TimestampCommentaireGroupe);
        lines.push(`   > Group comment from ${ev.NomProfCommentaireGroupe}${on ? ` (${on})` : ''}: ${ev.TexteCommentaireGroupe}`);
    }

    return lines;
}

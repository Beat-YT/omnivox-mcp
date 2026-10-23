import { GetFormulaireModel } from "@api/Formulaire";
import { extractHtmlPreview } from "@common/transformHelpers";
import { Formulaire } from "@typings/Formulaire";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({});

mcpServer.registerTool('get-online-forms',
    {
        title: 'Get Online Forms',
        description: 'List the online forms the college publishes in Omnivox (workshop registrations, course withdrawal requests, surveys, sign-ups), with whether each one is currently open. Read-only: filling a form stays in the Omnivox web portal.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async () => {
        const model = await GetFormulaireModel();
        const forms = model.ListeFormulaires ?? [];

        const active = forms.filter(f => f.IsActif);
        const closed = forms.filter(f => !f.IsActif);

        const lines = [
            `# Online forms (${forms.length})`,
            `${active.length} open, ${closed.length} closed`,
            '',
        ];

        if (forms.length === 0) {
            lines.push('No online forms.');
        }

        lines.push(...active.map(formatForm), ...closed.map(formatForm));

        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
);

function formatForm(form: Formulaire) {
    const id = form.UrlService?.match(/[?&]SV=([^&]+)/)?.[1];
    const description = extractHtmlPreview(form.Description, 1000);

    const details = [
        `- Open: ${form.IsActif ? 'yes' : 'no'}`,
        description && `- Description: ${description}`,
        id && `- ID: ${id}`,
        `- Portal path: ${form.UrlService}`,
    ].filter(Boolean);

    return [`## ${form.Nom.trim()}${form.IsActif ? '' : ' [CLOSED]'}`, ...details, ''].join('\n');
}

import { GetDefaultModel } from "@api/Lea";
import { transformTerms } from "@transformers/terms";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({});

mcpServer.registerTool('get-terms',
    {
        title: 'Get Terms',
        description: 'Get the list of available academic terms (sessions) and the current default term, with human-readable names.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async () => {
        const data = await GetDefaultModel();
        const termIds = data.AnSessionDisponible?.AnSessionDisponible ?? [];
        const defaultTerm = data.AnSessionDisponible?.AnSessionDefault || data.AnSession;

        const terms = await transformTerms(termIds);

        const defaultName = terms.find(t => t.id === defaultTerm)?.name || defaultTerm;
        const lines = terms.map(t => `${t.id}: ${t.name}${t.id === defaultTerm ? ' (current)' : ''}`);

        return {
            content: [
                { type: 'text', text: `Current term: ${defaultName} (${defaultTerm})\n\n${lines.join('\n')}` },
            ],
            structuredContent: {
                default_term: defaultTerm,
                terms,
            },
        };
    }
);

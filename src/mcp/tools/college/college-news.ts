import { GetListeActualite } from "@api/College";
import { extractHtmlPreview, htmlToText, toDisplayDate, toDisplayDay } from "@common/transformHelpers";
import { Actualite } from "@typings/college";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const PAGE_SIZE = 20;

const newsIdSchema = z.string().regex(/^\d+$/, {
    message: 'news_id must be the numeric news ID from get-college-news (e.g. "18789").',
});

const input = z.object({
    news_id: newsIdSchema.optional().describe('News ID from the list. Returns that article in full instead of the list.'),
    last_id: newsIdSchema.optional().describe('Last news ID for pagination, omit to get the latest news'),
});

mcpServer.registerTool('get-college-news',
    {
        title: 'Get College News',
        description: 'Retrieve the latest news and announcements from the college.',
        inputSchema: input,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        },
    },
    async (args) => {
        if (args.news_id) {
            // Omnivox has no single-article endpoint; fetch every published item and pick one
            const all = await GetListeActualite(100);
            const news = all.find(n => n.IdActualite === args.news_id);
            if (!news) {
                return {
                    content: [{ type: 'text', text: `News not found: ${args.news_id}. It may have been unpublished; call get-college-news for the current list.` }],
                    isError: true,
                };
            }
            return { content: [{ type: 'text', text: formatArticle(news) }] };
        }

        const data = await GetListeActualite(PAGE_SIZE + 1, args.last_id);
        const news = data.slice(0, PAGE_SIZE);
        const hasMore = data.length > PAGE_SIZE;

        const lines = [`# College news (${news.length})`];
        if (hasMore) {
            lines.push(`Older news: call again with last_id ${news[news.length - 1].IdActualite}.`);
        }
        lines.push('');

        if (news.length === 0) {
            lines.push(args.last_id ? 'No older news.' : 'No college news.');
        }

        lines.push(...news.map(formatListItem));

        return {
            content: [{ type: 'text', text: lines.join('\n') }],
        };
    }
);

function newsHtml(n: Actualite) {
    const html = n.Contenu?.trim() ? n.Contenu : n.Resume ?? '';
    // The app turns newlines into line breaks for college-wide news only
    return n.IsNouvelleCollege ? html.replace(/\n/g, '<br>') : html;
}

function heading(n: Actualite) {
    const tags = [
        n.IsMesureUrgence ? ' [URGENT]' : '',
        n.IndicateurNouvelleALaUne ? ' [FEATURED]' : '',
    ].join('');
    return `${extractHtmlPreview(n.Titre) || '(no title)'}${tags}`;
}

function details(n: Actualite) {
    // The app prints college news dates as a day and community news with the time
    const format = n.IsNouvelleCollege ? toDisplayDay : toDisplayDate;
    const updated = n.TimestampDateModification !== n.TimestampDateCreation
        && n.TimestampDateModification > n.TimestampDateDebutPublication;

    return [
        n.Source?.trim() && `- From: ${n.Source.trim()}`,
        `- Published: ${format(n.TimestampDateDebutPublication) ?? '?'}`,
        updated && `- Updated: ${format(n.TimestampDateModification)}`,
        n.IsMesureUrgence && n.UrlMesureUrgence && `- Link: ${n.UrlMesureUrgence}`,
    ];
}

function formatListItem(n: Actualite) {
    const preview = extractHtmlPreview(newsHtml(n), 200);
    const lines = [
        `## ${heading(n)}`,
        ...details(n),
        preview && `- Preview: ${preview}`,
        `- ID: ${n.IdActualite}`,
    ].filter(Boolean);

    return [...lines, ''].join('\n');
}

function formatArticle(n: Actualite) {
    const format = n.IsNouvelleCollege ? toDisplayDay : toDisplayDate;
    const expires = format(n.TimestampDateFinPublication);
    const lines = [
        `# ${heading(n)}`,
        ...details(n),
        expires && `- Expires: ${expires}`,
        n.UrlVideo && `- Video: ${n.UrlVideo}`,
        `- ID: ${n.IdActualite}`,
    ].filter(Boolean);

    lines.push('', '## Article', htmlToText(newsHtml(n)) || '(no content)');
    return lines.join('\n');
}

import { GetListeActualite } from "@api/College";
import { transformCollegeNews } from "@transformers/college/college-news";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({});

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
    async () => {
        const data = await GetListeActualite();
        const news = transformCollegeNews(data);

        const texts = news.map(n => ({
            type: 'text' as const,
            text: [
                `${n.title}${n.is_urgent ? ' [URGENT]' : ''}${n.is_featured ? ' [FEATURED]' : ''}`,
                n.content_preview && `Preview: ${n.content_preview}`,
                n.published_at && `Published: ${n.published_at}`,
                '',
            ].filter(Boolean).join('\n'),
        }));

        return {
            content: [
                { type: 'text', text: `${news.length} college news item(s).` },
                ...texts,
            ],
            structuredContent: { items: news },
        };
    }
);

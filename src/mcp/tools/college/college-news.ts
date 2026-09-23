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

        const lines = [
            `# College news (${news.length})`,
            '',
            ...news.map(n => [
                `## ${n.title}${n.is_urgent ? ' [URGENT]' : ''}${n.is_featured ? ' [FEATURED]' : ''}`,
                n.published_at && `- Published: ${n.published_at}`,
                n.content_preview && `- Preview: ${n.content_preview}`,
            ].filter(Boolean).join('\n') + '\n'),
        ];

        return {
            content: [{ type: 'text', text: lines.join('\n') }],
            structuredContent: { items: news },
        };
    }
);

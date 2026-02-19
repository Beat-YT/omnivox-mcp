import * as express from 'express';
import { mcpServer } from 'src/mcp/server';
import { normalizeObjectSchema, safeParseAsync } from '@modelcontextprotocol/sdk/server/zod-compat';
import { toJsonSchemaCompat } from '@modelcontextprotocol/sdk/server/zod-json-schema-compat';

const router = express.Router();

const EMPTY_OBJECT_JSON_SCHEMA = { type: 'object' as const, properties: {} };

const getTools = () => (mcpServer as any)._registeredTools as Record<string, any>;

router.get('/tools', (_req, res) => {
    const tools = getTools();
    const list = Object.entries(tools)
        .filter(([, tool]) => tool.enabled)
        .map(([name, tool]) => {
            const normalized = normalizeObjectSchema(tool.inputSchema);
            return {
                name,
                title: tool.title,
                description: tool.description,
                annotations: tool.annotations,
                inputSchema: normalized
                    ? toJsonSchemaCompat(normalized, { strictUnions: true, pipeStrategy: 'input' })
                    : EMPTY_OBJECT_JSON_SCHEMA,
            };
        });

    res.json({ tools: list });
});

router.post('/tools/:toolName', express.json({ type: '*/*' }), async (req, res) => {
    const tools = getTools();
    const tool = tools[req.params.toolName];

    if (!tool) {
        return res.status(404).json({ error: `Tool "${req.params.toolName}" not found` });
    }
    if (!tool.enabled) {
        return res.status(404).json({ error: `Tool "${req.params.toolName}" is disabled` });
    }

    const args = req.body || {};
    if (tool.inputSchema) {
        const parsed = await safeParseAsync(tool.inputSchema, args) as { success: boolean; error?: any };
        if (!parsed.success) {
            const issues = Array.isArray(parsed.error?.issues)
                ? parsed.error.issues.map((i: any) => ({
                    field: i.path?.join('.') || '',
                    message: i.message,
                }))
                : [{ message: String(parsed.error) }];

            return res.status(400).json({ error: 'Invalid input', issues });
        }
    }

    try {
        const result = await tool.handler(args, {});

        if (result.structuredContent) {
            return res.json(result.structuredContent);
        }

        // No structured content — return plain text
        const text = (result.content || [])
            .filter((c: any) => c.type === 'text')
            .map((c: any) => c.text)
            .join('\n\n');

        res.type('text/plain').send(text);
    } catch (err: any) {
        console.error(`Error executing tool "${req.params.toolName}":`, err);
        res.status(500).json({ error: err.message || 'Internal tool error' });
    }
});

export default router;

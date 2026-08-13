import * as express from 'express';
import { mcpServer } from 'src/mcp/server';
import { normalizeObjectSchema } from '@modelcontextprotocol/sdk/server/zod-compat';
import { toJsonSchemaCompat } from '@modelcontextprotocol/sdk/server/zod-json-schema-compat';

const router = express.Router();

const EMPTY_OBJECT_JSON_SCHEMA = { type: 'object' as const, properties: {} };

const getTools = () => (mcpServer as any)._registeredTools as Record<string, any>;

router.get('/openapi.json', (req, res) => {
    const tools = getTools();

    const paths: Record<string, any> = {};

    for (const [name, tool] of Object.entries(tools)) {
        if (!tool.enabled) continue;

        const normalized = normalizeObjectSchema(tool.inputSchema);
        const jsonSchema = normalized
            ? toJsonSchemaCompat(normalized, { strictUnions: true, pipeStrategy: 'input' })
            : EMPTY_OBJECT_JSON_SCHEMA;

        const hasProperties = jsonSchema.properties && Object.keys(jsonSchema.properties).length > 0;

        const operation: any = {
            operationId: name,
            summary: tool.title || name,
            description: tool.description || '',
        };

        if (tool.annotations?.readOnlyHint === true) {
            operation['x-readOnly'] = true;
        }

        if (hasProperties) {
            operation.requestBody = {
                required: true,
                content: {
                    'application/json': {
                        schema: jsonSchema,
                    },
                },
            };
        }

        operation.responses = {
            '200': {
                description: 'Tool result',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                        },
                    },
                },
            },
            '400': {
                description: 'Invalid input',
            },
            '500': {
                description: 'Tool execution error',
            },
        };

        paths[`/tools/${name}`] = { post: operation };
    }

    const spec = {
        openapi: '3.1.0',
        info: {
            title: 'Omnivox MCP Tools',
            version: '1.0.0',
            description: 'Omnivox college portal tools — courses, grades, assignments, MIO messaging, calendar, and more.',
        },
        servers: [
            {
                url: `${req.protocol}://${req.get('host')}`,
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                },
            },
        },
        security: [{ BearerAuth: [] }],
        paths,
    };

    res.json(spec);
});

export default router;

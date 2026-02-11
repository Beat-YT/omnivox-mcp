import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';

const mcpServer = new McpServer({
    name: 'omnivox',
    version: '1.0.0',
    description: 'Access a Quebec CEGEP student portal (Omnivox/Lea). View courses, grades, assignments, schedule, calendar, absences, documents, and send/receive internal messages (MIO).',
    title: 'Omnivox',
});

export { mcpServer };

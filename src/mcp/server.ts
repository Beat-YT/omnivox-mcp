import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';

const mcpServer = new McpServer({
    name: 'Omnivox MCP Server',
    version: '1.0.0',
    description: 'The user is a CEGEP student.',
    title: 'Omnivox MCP Server',
});

export { mcpServer };

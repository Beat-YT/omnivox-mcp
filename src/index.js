import 'dotenv/config';
import * as fs from 'fs';
import InitializeMcpTools from './mcp/tools.js';
import { InitializePuppet } from './omnivox-api/puppet/index.js';
import { dataDir } from './common/dataDir.js';

console.warn(`Data directory: ${dataDir}`);

const useHttp = process.argv.includes('--http');

const { setHttpMode } = await import('./common/transportMode.js');
setHttpMode(useHttp);

InitializeMcpTools();
InitializePuppet();

if (useHttp) {
    const express = (await import('express')).default;
    const { InitializeAccessKey, ValidateAccessKey } = await import('./security/accessKey.js');
    const { mcpRouter } = await import('./mcp/server.js');

    InitializeAccessKey();

    const app = express();
    app.set('etag', false);
    app.use(mcpRouter);
    app.use(ValidateAccessKey);

    fs.readdirSync('./src/mcp/routes').forEach(async (file) => {
        console.warn(`Loading route: ${file}`);
        const route = await import(`./mcp/routes/${file}`);
        app.use(route.default);
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.warn(`Server is running on port ${PORT}`);
    });
} else {
    const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');
    const { mcpServer } = await import('./mcp/server.js');
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    console.warn('MCP server running on stdio transport');
}

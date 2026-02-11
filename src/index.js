import 'dotenv/config';
import InitializeMcpTools from './mcp/tools.js';
import { InitializePuppet } from './omnivox-api/puppet/index.js';
import { dataDir } from './common/dataDir.js';

const useHttp = process.argv.includes('--http');
const useLog = process.argv.includes('--log');

const { setHttpMode, setLogMode } = await import('./common/transportMode.js');
setHttpMode(useHttp);
setLogMode(useLog);

InitializeMcpTools();
InitializePuppet();

if (useHttp) {
    const { StartExpressServer } = await import('./express/server.js');
    StartExpressServer();
} else {
    const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');
    const { mcpServer } = await import('./mcp/server.js');
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
}

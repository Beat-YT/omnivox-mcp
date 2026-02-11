import * as express from 'express';
import * as crypto from 'crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp';
import { getAccessKey } from '../security/accessKey.js';

const mcpServer = new McpServer({
    name: 'Omnivox MCP Server',
    version: '1.0.0',
    description: 'The user is a CEGEP student.',
    title: 'Omnivox MCP Server',

});


const mcpRouter = express.Router();
let statelessTransport: StreamableHTTPServerTransport;

mcpRouter.all('/mcp', async (req, res) => {
    const provided = req.query.key;
    if (typeof provided !== 'string') {
        return res.status(401).json({ error: 'Missing access key' });
    }

    const expected = getAccessKey();
    const providedBuf = Buffer.from(provided);
    const expectedBuf = Buffer.from(expected);
    const match =
        providedBuf.length === expectedBuf.length &&
        crypto.timingSafeEqual(providedBuf, expectedBuf);

    if (!match) {
        return res.status(401).json({ error: 'Invalid access key' });
    }

    if (!statelessTransport) {
        statelessTransport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
        });

        statelessTransport.onerror = (error) => {
            console.error('MCP Transport Error:', error);
        }

        statelessTransport.onmessage = (message) => {
            console.warn('MCP Transport Message:', message);
        }

        await mcpServer.connect(statelessTransport);
    }

    return statelessTransport.handleRequest(req, res);
})

export { mcpServer, mcpRouter };

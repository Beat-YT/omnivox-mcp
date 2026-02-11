import { Router } from "express";
import { getAccessKey } from "../security/accessKey.js";
import * as crypto from 'crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp';
import { mcpServer } from '../mcp/server.js';

const mcpRouter = Router();
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
});

export default mcpRouter;
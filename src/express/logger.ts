import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { dataDir } from '../common/dataDir.js';
import { isHttpMode } from '../common/transportMode.js';

const logFile = path.join(dataDir, 'server.log');

const statusText: Record<number, string> = {
    200: 'OK', 201: 'Created', 204: 'No Content',
    301: 'Moved Permanently', 302: 'Found', 304: 'Not Modified',
    400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
    404: 'Not Found', 405: 'Method Not Allowed', 409: 'Conflict',
    500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable',
};

function formatLine(req: Request, res: Response, duration: number): string {
    const date = new Date().toISOString();
    const status = res.statusCode;
    const reason = statusText[status] || '';
    return `[${date}] ${req.method} ${req.originalUrl} → ${status} ${reason} (${duration}ms)`;
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
        const line = formatLine(req, res, Date.now() - start);

        // Log to stdout only in HTTP mode (stdio mode reserves stdout for MCP)
        if (isHttpMode()) {
            console.log(line);
        }

        // Always append to log file
        fs.appendFile(logFile, line + '\n', () => {});
    });

    next();
}

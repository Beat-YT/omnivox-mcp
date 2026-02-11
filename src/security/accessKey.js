import * as path from 'path';
import * as fs from 'fs';
import crypto from 'crypto';
import { dataDir } from '@common/dataDir.js';

const accessKeyPath = path.join(dataDir, 'accessKey.txt');
let currentAccessKey = null;

export function ValidateAccessKey(req, res, next) {
    if (req.path === '/download/document' || req.path === '/download/assignment-file') {
        return next()
    }

    const provided = req.headers['x-mcp-auth']

    if (typeof provided !== 'string') {
        return res.status(401).json({ error: 'Missing access key' })
    }

    const expected = getAccessKey()

    const providedBuf = Buffer.from(provided)
    const expectedBuf = Buffer.from(expected)

    // Constant-time comparison to prevent timing attacks
    const match =
        providedBuf.length === expectedBuf.length &&
        crypto.timingSafeEqual(providedBuf, expectedBuf)

    if (!match) {
        return res.status(403).json({ error: 'Forbidden' })
    }

    next();
}


export function InitializeAccessKey() {
    getAccessKey();
}

export function getAccessKey() {
    if (currentAccessKey) {
        return currentAccessKey;
    }

    if (fs.existsSync(accessKeyPath)) {
        currentAccessKey = fs.readFileSync(accessKeyPath, 'utf-8').trim();
        return currentAccessKey;
    }

    // create a new access key
    currentAccessKey = crypto.randomBytes(32).toString('hex');
    fs.mkdirSync(path.dirname(accessKeyPath), { recursive: true });
    fs.writeFileSync(accessKeyPath, currentAccessKey);

    return currentAccessKey;
}

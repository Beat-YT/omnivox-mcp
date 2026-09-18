import * as path from 'path';
import * as fs from 'fs';
import crypto from 'crypto';
import { dataDir } from '@common/dataDir.js';

const accessKeyPath = path.join(dataDir, 'accessKey.txt');
let currentAccessKey = null;

/**
 * Extracts the access key from the request.
 * @param {import('express').Request} req 
 * @returns {string|null}
 */
export function extractProvidedKey(req) {
    const authHeader = req.headers['authorization'];

    if (req.headers['x-mcp-auth']) {
        return req.headers['x-mcp-auth'];
    }

    if (typeof authHeader === 'string') {
        const prefix = authHeader.substring(0, 6).toLocaleLowerCase();
        if (prefix === 'bearer' && authHeader.length > 7) {
            return authHeader.slice(7);
        }
    }

    if (typeof req.query.key === 'string') {
        return req.query.key;
    }

    return null;
}

export function ValidateAccessKey(req, res, next) {
    const provided = extractProvidedKey(req);

    if (typeof provided !== 'string') {
        return res.status(401).json({ error: 'Missing access key' })
    }

    const expected = getAccessKey()

    const providedBuf = Buffer.from(provided)
    const expectedBuf = Buffer.from(expected)

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

    console.log(`Generated new access key and saved to ${accessKeyPath}. Please keep it safe!`);

    return currentAccessKey;
}

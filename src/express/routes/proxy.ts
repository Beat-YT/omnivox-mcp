import * as express from 'express';
import { getConfig } from 'src/omnivox-api/config';
import { makeProxyFetch } from 'src/omnivox-api/puppet';

const router = express.Router();

router.all('/Mobl/{*path}', express.raw({ type: '*/*', limit: '10mb' }), async (req, res) => {
    const baseUrl = new URL(getConfig().DefaultPage).origin;
    const target = `${baseUrl}${req.originalUrl}`;

    try {
        const body = Buffer.isBuffer(req.body) && req.body.length > 0
            ? req.body.toString('utf-8')
            : undefined;

        const result = await makeProxyFetch(
            target,
            req.method,
            body,
            body ? (req.headers['content-type'] as string) : undefined,
        );

        res.status(result.status);
        res.set('Content-Type', result.contentType);
        res.send(Buffer.from(result.body, 'base64'));
    } catch (err: any) {
        console.error('[Proxy]', err);
        res.status(502).json({ error: err.message || 'Proxy error' });
    }
});

export default router;

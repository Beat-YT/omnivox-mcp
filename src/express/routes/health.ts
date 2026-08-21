import * as express from 'express';
import { getHealthStatus, getPage } from '../../omnivox-api/puppet/index.js';

const router = express.Router();

router.get('/health', async (req, res) => {
    const health = await getHealthStatus();
    res.status(health.ok ? 200 : 503).json(health);
});

if (process.env.ENABLE_EVAL === 'true') {
    router.post('/eval', express.json(), async (req, res) => {
        try {
            const page = await getPage();
            const result = await page.evaluate(req.body.code);
            res.json({ result });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });
}

export default router;

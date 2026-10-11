import * as express from 'express';
import { omnivox } from 'src/omnivox-api/puppet';

const router = express.Router();

router.get('/health', async (req, res) => {
    const health = await omnivox.health();
    res.status(health.ok ? 200 : 503).json(health);
});

if (process.env.ENABLE_EVAL === 'true') {
    router.post('/eval', express.json(), async (req, res) => {
        try {
            const page = await omnivox.page();
            const result = await page.evaluate(req.body.code);
            res.json({ result });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    });
}

export default router;

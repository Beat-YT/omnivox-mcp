import * as express from 'express';
import { getHealthStatus } from '../../omnivox-api/puppet/index.js';

const router = express.Router();

router.get('/health', async (req, res) => {
    const health = await getHealthStatus();
    res.status(health.ok ? 200 : 503).json(health);
});

export default router;

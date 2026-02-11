import * as express from 'express';
import { GetHoraireModel } from '@api/Horaire';
import { transformHoraireToSchedule } from '../transformers/schedule.js';

const router = express.Router();

router.get('/schedule', async (req, res) => {
    const term = typeof req.query.term === 'string' ? req.query.term : undefined;
    const data = await GetHoraireModel(term);

    const transformed = transformHoraireToSchedule(data);
    res.json(transformed);
});

export default router;

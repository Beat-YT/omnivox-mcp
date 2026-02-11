import { FirstLoadTest, GetCalendrierModel, SetCalendarFilters } from '@api/Calendrier';
import { transformCalendarModel } from '@transformers/calendar/calendar';
import * as express from 'express';

const router = express.Router();

router.get('/calendar', async (req, res) => {
    const page = parseInt(req.query.page as string) || 0;
    console.warn(`Fetching calendar for page: ${page}`);
    const model = await GetCalendrierModel(0);
    res.json(transformCalendarModel(model));
});

export default router;
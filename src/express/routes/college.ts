import { UpdateListeCollegeUser, GetAppUpdates } from '@api/App';
import { GetListeActualite } from '@api/College';
import { transformCollegeNews } from '@transformers/college/college-news';
import { transformCollegeList } from '@transformers/college/collegeList';
import { transformCollegeUpdates } from '@transformers/college/updates';
import * as express from 'express';

const router = express.Router();

router.get('/college/list', async (req, res) => {
    const infos = await UpdateListeCollegeUser();
    res.json(transformCollegeList(infos));
});

router.get('/college/news', async (req, res) => {
    const list = await GetListeActualite();
    res.json(transformCollegeNews(list));
});

router.get('/college/updates', async (req, res) => {
    const term = req.query.term as string | undefined;
    const data = await GetAppUpdates(term);
    res.json(transformCollegeUpdates(data));
});

export default router;
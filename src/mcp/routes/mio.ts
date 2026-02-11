import { AjoutCategorie, CategoriseMessage, DeleteMessage, GetLatestMessages, GetListeFoldersModel, GetMessages, RechercheIndividu, SearchMessages, SendMessage, SetIndicateursMessage } from '@api/Mio';
import { GetCoursePeople } from '@api/MioWeb';
import { transformMioFolders } from '@transformers/mio/folders';
import { transformMioMessages } from '@transformers/mio/messages';
import { transformPeopleSearch } from '@transformers/mio/people';
import * as express from 'express';

const router = express.Router();
router.use(express.json());

router.get('/mio/folders', async (req, res) => {
    const model = await GetListeFoldersModel();
    res.json(transformMioFolders(model));
});

router.get('/mio/list', async (req, res) => {
    const lastId = typeof req.query.last_id === 'string' ? req.query.last_id : undefined;
    const folder = typeof req.query.folder_id === 'string' ? req.query.folder_id : 'SEARCH_FOLDER_MioRecu';

    let data = lastId
        ? await GetMessages(folder, lastId)
        : await GetLatestMessages(folder);

    res.json(transformMioMessages(data, folder));
});

router.post('/mio/search', async (req, res) => {
    const query = req.body.query;
    const folder = typeof req.body.folder_id === 'string' ? req.body.folder_id : 'SEARCH_FOLDER_MioRecu';

    if (typeof query !== 'string') {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    const data = await SearchMessages(folder, query);
    res.json(transformMioMessages(data, folder));
});

router.post('/mio/send', async (req, res) => {
    const { recipient_id, subject, message } = req.body;
    if (typeof recipient_id !== 'string' || typeof subject !== 'string' || typeof message !== 'string') {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    const result = await SendMessage(recipient_id, subject, message);
    res.json({ success: result });
});

router.post('/mio/message/:id/flag', async (req, res) => {
    const messageId = req.params.id;
    const { important, mark_unread } = req.body;
    if (typeof important !== 'boolean' || typeof mark_unread !== 'boolean') {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    const result = await SetIndicateursMessage(messageId, important, mark_unread);
    res.json({ success: result });
});

router.post('/mio/message/:id/categorize', async (req, res) => {
    const messageId = req.params.id;
    const { folderId } = req.body;
    if (typeof folderId !== 'string') {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    const result = await CategoriseMessage(messageId, folderId);
    res.json({ success: result });
});

router.post('/mio/message/:id/delete', async (req, res) => {
    const messageId = req.params.id;
    const result = await DeleteMessage(messageId);
    res.json({ success: result });
});

router.post('/mio/folders/add-category', async (req, res) => {
    const { categoryName } = req.body;
    if (typeof categoryName !== 'string') {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    const result = await AjoutCategorie(categoryName);
    res.json({ success: result });
});

router.post('/mio/search-people', async (req, res) => {
    const query = req.body.query;
    if (typeof query !== 'string') {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    const raw = await RechercheIndividu(query);
    res.json(transformPeopleSearch(raw));
});

router.get('/mio/course-people/:course_id', async (req, res) => {
    const courseId = req.params.course_id;
    const raw = await GetCoursePeople(courseId);
    res.json(transformPeopleSearch(raw));
});

export default router;
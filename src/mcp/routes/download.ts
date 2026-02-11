import * as express from 'express';
import { consumeWebToken } from 'src/security/omniWebToken';
import { GetDocumentFichier, GetEnonceTravailFichier, GetDepotTravailFichier, GetCopieCorrigeTravailFichier } from '@api/LeaDownload';
import { DownloadResult } from 'src/omnivox-api/puppet';

const router = express.Router();

router.get('/download/document', async (req, res) => {
    const token = typeof req.query.token === 'string' ? req.query.token : null;
    if (!token) {
        res.status(400).send('Error: Missing token query parameter');
        return;
    }

    const dataToken = consumeWebToken(token);
    if (!dataToken || dataToken.type !== 'lea-document') {
        res.status(401).send('Error: Invalid or expired token. Please re-use the document download endpoint/tool to get a new link.');
        return;
    }

    const { courseId, termId, documentId } = dataToken;
    const result = await GetDocumentFichier(courseId, documentId, termId);

    const disposition = result.contentDisposition?.replace('attachment;', 'inline;') || 'inline';

    res.set('Content-Disposition', disposition);
    res.set('Content-Type', result.contentType);
    res.set('Cache-Control', 'private, max-age=600');
    res.send(result.data);
});

router.get('/download/assignment-file', async (req, res) => {
    const token = typeof req.query.token === 'string' ? req.query.token : null;
    if (!token) {
        res.status(400).send('Error: Missing token query parameter');
        return;
    }

    const dataToken = consumeWebToken(token);
    if (!dataToken || dataToken.type !== 'lea-assignment-file') {
        res.status(401).send('Error: Invalid or expired token. Please re-use the assignment file download tool to get a new link.');
        return;
    }

    const { courseId, assignmentId, fileId, role, termId } = dataToken;

    let result: DownloadResult;
    switch (role) {
        case 'teacher_document':
            result = await GetEnonceTravailFichier(courseId, assignmentId, fileId, termId);
            break;
        case 'submission':
            result = await GetDepotTravailFichier(courseId, assignmentId, fileId, termId);
            break;
        case 'correction':
            result = await GetCopieCorrigeTravailFichier(courseId, assignmentId, fileId, termId);
            break;
        default:
            res.status(400).send('Error: Invalid role in token.');
            return;
    }

    const disposition = result.contentDisposition?.replace('attachment;', 'inline;') || 'inline';

    res.set('Content-Disposition', disposition);
    res.set('Content-Type', result.contentType);
    res.set('Cache-Control', 'private, max-age=600');
    res.send(result.data);
});

export default router;
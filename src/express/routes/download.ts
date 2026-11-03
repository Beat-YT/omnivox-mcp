import * as express from 'express';
import { pipeline } from 'stream/promises';
import { consumeWebToken } from 'src/security/omniWebToken';
import { GetDocumentFichier, GetEnonceTravailFichier, GetDepotTravailFichier, GetCopieCorrigeTravailFichier } from '@api/LeaDownload';
import { GetMioAttachment } from '@api/Mio';
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
    await serveFile(res, () => GetDocumentFichier(courseId, documentId, termId));
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

    let fetchFile: () => Promise<DownloadResult>;
    switch (role) {
        case 'teacher_document':
            fetchFile = () => GetEnonceTravailFichier(courseId, assignmentId, fileId, termId);
            break;
        case 'submission':
            fetchFile = () => GetDepotTravailFichier(courseId, assignmentId, fileId, termId);
            break;
        case 'correction':
            fetchFile = () => GetCopieCorrigeTravailFichier(courseId, assignmentId, fileId, termId);
            break;
        default:
            res.status(400).send('Error: Invalid role in token.');
            return;
    }

    await serveFile(res, fetchFile);
});

router.get('/download/mio-attachment', async (req, res) => {
    const token = typeof req.query.token === 'string' ? req.query.token : null;
    if (!token) {
        res.status(400).send('Error: Missing token query parameter');
        return;
    }

    const dataToken = consumeWebToken(token);
    if (!dataToken || dataToken.type !== 'mio-attachment') {
        res.status(401).send('Error: Invalid or expired token. Please re-use the MIO attachment download tool to get a new link.');
        return;
    }

    const { messageId, attachmentId } = dataToken;
    await serveFile(res, () => GetMioAttachment(messageId, attachmentId));
});

/** Streams the file to the client. A failure before the first byte gets a status, after that the transfer is cut short. */
async function serveFile(res: express.Response, fetchFile: () => Promise<DownloadResult>) {
    let file: DownloadResult;
    try {
        file = await fetchFile();
    } catch (err: any) {
        console.error('[Download]', err);
        res.status(502).send(`Error: ${err?.message || 'Download failed'}`);
        return;
    }

    res.status(200);
    res.set('Content-Type', file.contentType);
    res.set('Content-Disposition', file.contentDisposition.replace(/^attachment/i, 'inline') || 'inline');
    if (file.contentLength !== undefined) res.set('Content-Length', String(file.contentLength));
    res.set('Cache-Control', 'private, max-age=600');

    try {
        await pipeline(file.body, res);
    } catch (err: any) {
        console.warn('[Download] Transfer aborted:', err?.message);
    }
}

export default router;

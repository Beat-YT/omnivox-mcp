import * as express from 'express';
import { consumeWebToken } from 'src/security/omniWebToken';
import { BuildAssignmentSubmitUrl } from '@api/Login';

const router = express.Router();

// Short link -> 302 to the pre-authenticated Omnivox web page.
// The Omnivox TokenRedirection is minted at click time (single-use on their side),
// so the short link stays valid for the whole web-token TTL.
router.get('/link/assignment-submit', async (req, res) => {
    const token = typeof req.query.token === 'string' ? req.query.token : null;
    if (!token) {
        res.status(400).send('Error: Missing token query parameter');
        return;
    }

    const dataToken = consumeWebToken(token);
    if (!dataToken || dataToken.type !== 'lea-assignment-submit') {
        res.status(401).send('Error: Invalid or expired link. Please re-use the assignment submit link tool to get a new one.');
        return;
    }

    const { courseId, assignmentId, termId } = dataToken;

    try {
        const url = await BuildAssignmentSubmitUrl(courseId, assignmentId, termId);
        res.set('Cache-Control', 'no-store');
        res.redirect(302, url);
    } catch (err: any) {
        console.error('[Link]', err);
        res.status(502).send('Error: Could not obtain an Omnivox redirection token. Is the server session still logged in?');
    }
});

export default router;

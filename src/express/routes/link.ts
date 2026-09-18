import * as express from 'express';
import { consumeWebToken } from 'src/security/omniWebToken';
import { BuildAssignmentSubmitUrl, BuildServiceAutoLoginUrl } from '@api/AutoLoginWeb';
import { assertServiceAllowed, isServiceLinksEnabled } from '@common/externalServices';

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

// Guards are re-checked at click time so a link minted before a config change
// cannot outlive it.
router.get('/link/service', async (req, res) => {
    const token = typeof req.query.token === 'string' ? req.query.token : null;
    if (!token) {
        res.status(400).send('Error: Missing token query parameter');
        return;
    }

    if (!isServiceLinksEnabled()) {
        res.status(403).send('Error: Service links are currently disabled on this server.');
        return;
    }

    const dataToken = consumeWebToken(token);
    if (!dataToken || dataToken.type !== 'external-service') {
        res.status(401).send('Error: Invalid or expired link. Please re-use the service link tool to get a new one.');
        return;
    }

    const code = String(dataToken.code);
    try {
        assertServiceAllowed(code);
    } catch (err: any) {
        res.status(403).send(`Error: ${err.message}`);
        return;
    }

    try {
        const { url } = await BuildServiceAutoLoginUrl(code);
        console.warn(`[ServiceLink] "${code}" opened`);
        res.set('Cache-Control', 'no-store');
        res.redirect(302, url);
    } catch (err: any) {
        console.error('[Link]', err);
        res.status(502).send('Error: Could not build the Omnivox service link. Is the server session still logged in?');
    }
});

export default router;

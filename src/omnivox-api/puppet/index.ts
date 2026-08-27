import puppeteer, { Browser, ElementHandle, Frame, Page } from 'puppeteer';
import { getConfig, getElectronCookies } from '../config';
import { setupPageInterceptors } from './interceptors';
import { setupPageInjection } from './ovxInjection';
import { buildUserAgent } from './userAgent';
import * as fs from 'fs';
import * as path from 'path';
import { dataDir } from '@common/dataDir';
import { device } from '@common/constants';

const browserDataDir = path.join(dataDir, 'browser');
const pidFile = path.join(dataDir, 'chrome.pid');

let browser: Browser | null = null;
let page: Page | null = null;
let readyPromise: Promise<void> | null = null;

const sleepEnabled = process.env.BROWSER_SLEEP === 'true';
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
let idleTimer: ReturnType<typeof setTimeout> | null = null;

const REFRESH_INTERVAL_MS = process.env.BROWSER_REFRESH_INTERVAL
    ? parseInt(process.env.BROWSER_REFRESH_INTERVAL, 10) * 60 * 1000
    : 0;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

function resetIdleTimer() {
    if (!sleepEnabled) return;
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(sleep, IDLE_TIMEOUT_MS);
}

function startRefreshTimer() {
    if (sleepEnabled || !REFRESH_INTERVAL_MS || refreshTimer) return;
    refreshTimer = setInterval(async () => {
        if (!page) return;
        try {
            const config = getConfig();
            await page.goto(config.DefaultPage);
            await page.waitForFunction(() => (window as any).Skytech !== undefined, { timeout: 60000 });
            console.warn('[Puppet] Session refreshed');
        } catch (err: any) {
            console.warn('[Puppet] Session refresh failed:', err.message);
        }
    }, REFRESH_INTERVAL_MS);
}

async function sleep() {
    idleTimer = null;
    if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
    if (browser) {
        console.warn('[Puppet] Sleeping after idle timeout');
        try { await browser.close(); } catch { }
        browser = null;
        page = null;
        readyPromise = null;
        if (fs.existsSync(pidFile)) fs.unlinkSync(pidFile);
    }
}

export interface DownloadResult {
    data: Buffer;
    contentType: string;
    contentDisposition: string;
}

export async function InitializePuppet() {
    readyPromise = (async () => {
        const isFirstRun = !fs.existsSync(browserDataDir);

        // Kill orphaned Chrome process from a previous unclean shutdown
        if (fs.existsSync(pidFile)) {
            try {
                const pid = Number(fs.readFileSync(pidFile, 'utf-8').trim());
                process.kill(pid);
            } catch { }
            fs.unlinkSync(pidFile);
        }

        const singletonLock = path.join(browserDataDir, 'SingletonLock');
        if (fs.existsSync(singletonLock)) fs.unlinkSync(singletonLock);

        browser = await puppeteer.launch({
            headless: true,
            userDataDir: browserDataDir,
            defaultViewport: null,
            args: [
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--disable-extensions',
                '--disable-component-update',
                '--disable-sync',
                '--disable-background-networking',
                '--disable-default-apps',
                '--disable-translate',
                '--metrics-recording-only',
                '--no-first-run',
                '--no-default-browser-check',
                '--mute-audio',
                // Memory limits
                '--js-flags=--max-old-space-size=512',
                '--renderer-process-limit=1',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-backgrounding-occluded-windows',
                '--no-sandbox',
            ],
        });

        // Save Chrome PID for cleanup on next startup
        const chromePid = browser.process()?.pid;
        if (chromePid) fs.writeFileSync(pidFile, String(chromePid));

        // Blank any restored tabs and close extras
        const restoredPages = await browser.pages();
        await Promise.all(restoredPages.map(p => p.goto('about:blank')));
        for (const p of restoredPages.slice(1)) await p.close();

        // Import Electron cookies only on first run to bootstrap the session.
        // After that, Chrome's own storage keeps cookies alive across restarts.
        if (isFirstRun) {
            const electronCookies = getElectronCookies();
            await browser.setCookie(...electronCookies);
        }

        const config = getConfig();
        const userAgent = buildUserAgent(config.IdAppareil!, config.Code!);

        page = await browser.newPage();

        await page.setViewport(device.viewport);
        await page.setUserAgent({
            userAgent: userAgent,
            platform: device.platform,
            userAgentMetadata: device.userAgentMetadata,
        });

        await setupPageInterceptors(page);
        await setupPageInjection(page);

        await page.goto(config.DefaultPage);
        await page.waitForFunction(() => (window as any).Skytech !== undefined, { timeout: 60000 });

        startRefreshTimer();
        resetIdleTimer();
    })();

    return readyPromise;
}

export async function waitForReady(): Promise<void> {
    if (!readyPromise) {
        console.warn('[Puppet] Waking up from sleep');
        await InitializePuppet();
    }
    await readyPromise;
    resetIdleTimer();
}

async function recoverPage(): Promise<void> {
    page = null;
    readyPromise = null;

    return InitializePuppet();
}

function isDetachedFrameError(err: unknown): boolean {
    return err instanceof Error && err.message.includes('detached Frame');
}

function makeProxyRequest(url: string, data: any) {
    if (!page) throw new Error('Puppeteer page not initialized');

    return page.evaluate((url: string, data: any) => {
        return new Promise<any>((resolve, reject) => {
            (window as any).Skytech.Commun.Utils.HttpRequestWorker.PostJSON(url, data,
                (result: any) => resolve(result),
                (error: any) => reject(error)
            );
        });
    }, url, data);
}

export async function makeSkytechRequest<T = any>(url: string, data: any = {}): Promise<T> {
    await waitForReady();
    if (!page) throw new Error('Puppeteer page not initialized');

    try {
        return await makeProxyRequest(url, data);
    } catch (err) {
        if (!isDetachedFrameError(err)) throw err;

        await recoverPage();
        
        return await makeProxyRequest(url, data);
    }
}

export interface FrameHandle {
    frame: Frame;
    dispose: () => Promise<void>;
}

export async function loadPageInFrame(url: string): Promise<FrameHandle> {
    await waitForReady();
    if (!page) throw new Error('Puppeteer page not initialized');

    const elementHandle = await page.evaluateHandle((url: string) => {
        return new Promise<HTMLIFrameElement>((resolve, reject) => {
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.left = '-9999px';
            iframe.style.width = '1024px';
            iframe.style.height = '768px';

            const timeout = setTimeout(() => {
                iframe.remove();
                reject(new Error('iframe load timed out'));
            }, 30000);

            iframe.addEventListener('load', () => {
                clearTimeout(timeout);
                resolve(iframe);
            });

            iframe.src = url;
            document.body.appendChild(iframe);
        });
    }, url) as ElementHandle<HTMLIFrameElement>;

    const frame = await elementHandle.contentFrame();
    if (!frame) throw new Error('Failed to get iframe content frame');

    const dispose = async () => {
        try {
            await elementHandle.evaluate((el) => el.remove());
        } catch (e) {
        }
        elementHandle.dispose();
    };

    return { frame, dispose };
}

export async function getPage(): Promise<Page> {
    await waitForReady();
    if (!page) throw new Error('Puppeteer page not initialized');
    return page;
}

export async function getHealthStatus(): Promise<{ ok: boolean; browser: boolean; page: boolean; omnivox: boolean; sleeping: boolean }> {
    const sleeping = !browser && !readyPromise;

    if (sleeping) {
        return { ok: true, browser: false, page: false, omnivox: false, sleeping: true };
    }

    const browserConnected = !!browser?.connected;
    if (!browserConnected) {
        return { ok: false, browser: false, page: false, omnivox: false, sleeping: false };
    }

    const pageAlive = !!page && !page.isClosed();
    if (!pageAlive) {
        return { ok: false, browser: true, page: false, omnivox: false, sleeping: false };
    }

    let omnivoxReady = false;
    try {
        omnivoxReady = await page!.evaluate(() => typeof (window as any).Skytech !== 'undefined');
    } catch {}

    return { ok: omnivoxReady, browser: true, page: true, omnivox: omnivoxReady, sleeping: false };
}

export interface ProxyFetchResult {
    status: number;
    contentType: string;
    body: string; // base64
}

function fixCharset(ct?: string): string | undefined {
    if (!ct) return ct;
    if (ct.startsWith('application/json')) return 'application/json; charset=iso-8859-1';
    if (ct.startsWith('application/x-www-form-urlencoded')) return 'application/x-www-form-urlencoded; charset=iso-8859-1';
    return ct;
}

export async function makeProxyFetch(
    url: string,
    method: string,
    body?: string,
    contentType?: string,
): Promise<ProxyFetchResult> {
    await waitForReady();
    if (!page) throw new Error('Puppeteer page not initialized');

    const ct = fixCharset(contentType);

    const fetchEval = () =>
        page!.evaluate(
            (url: string, method: string, body: string | undefined, contentType: string | undefined) => {
                return new Promise<any>((resolve, reject) => {
                    const header = contentType ? { 'Content-Type': contentType } : {};
                    (window as any).Skytech.Commun.Utils.HttpRequestWorker.DoXHRSetup(
                        method, url, true, body || null, header,
                        (requete: any) => {
                            if (requete.readyState === 4) {
                                resolve({
                                    status: requete.status,
                                    contentType: requete.getResponseHeader('content-type') || 'application/octet-stream',
                                    body: btoa(unescape(encodeURIComponent(requete.responseText || ''))),
                                });
                            }
                        },
                        (err: any) => reject(err),
                        false,
                    );
                });
            },
            url, method, body, ct,
        );

    try {
        return await fetchEval();
    } catch (err) {
        if (!isDetachedFrameError(err)) throw err;
        await recoverPage();
        return await fetchEval();
    }
}

export async function makePuppeteerDownload(url: string): Promise<DownloadResult> {
    await waitForReady();
    if (!page) throw new Error('Puppeteer page not initialized');

    const downloadEval = async () => {
        return page!.evaluate(async (fetchUrl: string) => {
            const res = await fetch(fetchUrl, {
                credentials: 'include',
                headers: { 'X-Ovx-Download': '1' },
            });
            const ct = res.headers.get('content-type') || 'application/octet-stream';
            const cd = res.headers.get('content-disposition') || '';
            const buf = await res.arrayBuffer();
            const bytes = new Uint8Array(buf);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return { base64: btoa(binary), contentType: ct, contentDisposition: cd };
        }, url);
    };

    let result;
    try {
        result = await downloadEval();
    } catch (err) {
        if (!isDetachedFrameError(err)) throw err;
        await recoverPage();
        result = await downloadEval();
    }

    return {
        data: Buffer.from(result.base64, 'base64'),
        contentType: result.contentType,
        contentDisposition: result.contentDisposition,
    };
}
import puppeteer, { Browser, ElementHandle, Frame, KnownDevices, Page } from 'puppeteer';
import { getConfig, getElectronCookies } from '../config';
import { setupPageInterceptors } from './interceptors';
import { setupPageInjection } from './ovxInjection';
import { buildUserAgent } from './userAgent';
import * as fs from 'fs';
import * as path from 'path';
import { dataDir } from '@common/dataDir';

const browserDataDir = path.join(dataDir, 'browser');
const pidFile = path.join(dataDir, 'chrome.pid');

let browser: Browser | null = null;
let page: Page | null = null;
let readyPromise: Promise<void> | null = null;

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

        browser = await puppeteer.launch({
            headless: true,
            userDataDir: browserDataDir,
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

        await page.emulate(KnownDevices['iPad Pro 11']);
        await page.setUserAgent({
            userAgent: userAgent,
            platform: 'MacIntel',
        });

        await setupPageInterceptors(page);
        await setupPageInjection(page);

        await page.goto(config.DefaultPage);
        await page.waitForFunction(() => (window as any).Skytech !== undefined, { timeout: 60000 });
    })();

    return readyPromise;
}

export async function waitForReady(): Promise<void> {
    if (!readyPromise) throw new Error('Puppeteer not initialized. Call InitializePuppet() first.');
    return readyPromise;
}

async function recoverPage(): Promise<void> {
    if (!page) throw new Error('Puppeteer page not initialized');

    const config = getConfig();
    await page.goto(config.DefaultPage);
    await page.waitForFunction(() => (window as any).Skytech !== undefined, { timeout: 60000 });
}

function isDetachedFrameError(err: unknown): boolean {
    return err instanceof Error && err.message.includes('detached Frame');
}

export async function makeSkytechRequest<T = any>(url: string, data: any = {}): Promise<T> {
    await waitForReady();

    if (!page) throw new Error('Puppeteer page not initialized');

    try {
        return await page.evaluate((url: string, data: any) => {
            return new Promise<any>((resolve, reject) => {
                (window as any).Skytech.Commun.Utils.HttpRequestWorker.PostJSON(url, data,
                    (result: any) => resolve(result),
                    (error: any) => reject(error)
                );
            });
        }, url, data);
    } catch (err) {
        if (!isDetachedFrameError(err)) throw err;

        await recoverPage();

        return page.evaluate((url: string, data: any) => {
            return new Promise<any>((resolve, reject) => {
                (window as any).Skytech.Commun.Utils.HttpRequestWorker.PostJSON(url, data,
                    (result: any) => resolve(result),
                    (error: any) => reject(error)
                );
            });
        }, url, data);
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
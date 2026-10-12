import { ElementHandle, Page } from 'puppeteer';
import BrowserManager from './BrowserManager';
import { getConfig } from '../config';
import { OmnivoxMoblError } from '../OmnivoxMoblError';
import { clientConfig } from '@common/constants';
import { dataDir } from '@common/dataDir';
import { DownloadResult, FrameHandle, HealthStatus, ProxyRequestInit, ProxyResponse } from './types';

export interface OmnivoxClientOptions {
    /** Close the browser after this many ms without activity. Relaunched on the next call. Omit to keep it open. */
    idleTimeoutMs?: number;
    /** Reload the Omnivox home page on this interval to keep the session alive. Ignored when idleTimeoutMs is set. */
    refreshIntervalMs?: number;
}

const FRAME_LOAD_TIMEOUT_MS = 30000;

/**
 * Entry point for everything that talks to Omnivox. Owns a BrowserManager and
 * keeps it ready: lazy launch, idle sleep, session refresh, and a single retry
 * when Chrome drops the page frame.
 */
export default class OmnivoxClient {
    private readonly options: OmnivoxClientOptions;

    private browser: BrowserManager | null = null;
    private starting: Promise<void> | null = null;
    private startError: Error | null = null;

    private idleTimer: ReturnType<typeof setTimeout> | null = null;
    private refreshTimer: ReturnType<typeof setInterval> | null = null;

    constructor(options: OmnivoxClientOptions = {}) {
        this.options = options;
    }

    start(): Promise<void> {
        if (this.starting) return this.starting;

        this.starting = (async () => {
            const browser = new BrowserManager(getConfig(), clientConfig, dataDir);
            try {
                await browser.launch();
            } catch (err) {
                // Do not keep a rejected promise around, the next call must be able to retry
                this.starting = null;
                this.startError = err instanceof Error ? err : new Error(String(err));
                await browser.destroy();
                throw err;
            }
            this.browser = browser;
            this.startError = null;

            this.scheduleRefresh();
            this.touch();
        })();

        return this.starting;
    }

    async stop(): Promise<void> {
        this.clearTimers();

        const browser = this.browser;
        this.browser = null;
        this.starting = null;

        await browser?.destroy();
    }

    async health(): Promise<HealthStatus> {
        if (!this.browser && !this.starting) {
            if (this.startError) {
                return { ok: false, browser: false, page: false, omnivox: false, sleeping: false, error: this.startError.message };
            }
            return { ok: true, browser: false, page: false, omnivox: false, sleeping: true };
        }

        if (!this.browser?.connected) {
            return { ok: false, browser: false, page: false, omnivox: false, sleeping: false };
        }

        if (!this.browser.pageAlive) {
            return { ok: false, browser: true, page: false, omnivox: false, sleeping: false };
        }

        let omnivox = false;
        try {
            omnivox = await this.browser.page.evaluate(
                () => !!(window as any).Skytech?.Commun?.Utils?.HttpRequestWorker?.PostJSON,
            );
        } catch { }

        return { ok: omnivox, browser: true, page: true, omnivox, sleeping: false };
    }

    /** The logged-in main page, for callers that need Puppeteer directly. */
    async page(): Promise<Page> {
        await this.ensureReady();
        return this.requireBrowser().page;
    }

    /** POST a JSON payload to a mobile API endpoint through Omnivox's own request worker. */
    async postJson<T = any>(url: string, payload: unknown = {}): Promise<T> {
        const result = await this.withPage((page) =>
            page.evaluate((url: string, payload: unknown) => {
                return new Promise<any>((resolve, reject) => {
                    (window as any).Skytech.Commun.Utils.HttpRequestWorker.PostJSON(url, payload,
                        (result: any) => resolve(result),
                        (error: any) => reject(error),
                    );
                });
            }, url, payload),
        );

        if (OmnivoxMoblError.isError(result)) throw new OmnivoxMoblError(result);

        return result;
    }

    /** Forward an arbitrary HTTP request with the session cookies. Used by the /Mobl proxy route. */
    request(url: string, init: ProxyRequestInit): Promise<ProxyResponse> {
        const contentType = withLatin1Charset(init.contentType);

        return this.withPage((page) =>
            page.evaluate(
                (url: string, method: string, body: string | undefined, contentType: string | undefined) => {
                    return new Promise<any>((resolve, reject) => {
                        const headers = contentType ? { 'Content-Type': contentType } : {};
                        (window as any).Skytech.Commun.Utils.HttpRequestWorker.DoXHRSetup(
                            method, url, true, body || null, headers,
                            (xhr: any) => {
                                if (xhr.readyState !== 4) return;
                                resolve({
                                    status: xhr.status,
                                    contentType: xhr.getResponseHeader('content-type') || 'application/octet-stream',
                                    body: btoa(unescape(encodeURIComponent(xhr.responseText || ''))),
                                });
                            },
                            (err: any) => reject(err),
                            false,
                        );
                    });
                },
                url, init.method, init.body, contentType,
            ),
        );
    }

    /** Fetch a file as a real browser navigation would. The interceptor rewrites the marker header. */
    async download(url: string): Promise<DownloadResult> {
        const result = await this.withPage((page) =>
            page.evaluate(async (url: string) => {
                const res = await fetch(url, {
                    credentials: 'include',
                    headers: { 'X-Ovx-Download': '1' },
                });
                const bytes = new Uint8Array(await res.arrayBuffer());
                let binary = '';
                for (let i = 0; i < bytes.length; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                return {
                    base64: btoa(binary),
                    contentType: res.headers.get('content-type') || 'application/octet-stream',
                    contentDisposition: res.headers.get('content-disposition') || '',
                };
            }, url),
        );

        return {
            data: Buffer.from(result.base64, 'base64'),
            contentType: result.contentType,
            contentDisposition: result.contentDisposition,
        };
    }

    /** Load a page in a hidden iframe on the main page. Caller must dispose the handle. */
    async openFrame(url: string): Promise<FrameHandle> {
        const page = await this.page();

        const handle = await page.evaluateHandle((url: string, timeoutMs: number) => {
            return new Promise<HTMLIFrameElement>((resolve, reject) => {
                const iframe = document.createElement('iframe');
                iframe.style.position = 'fixed';
                iframe.style.left = '-9999px';
                iframe.style.width = '1024px';
                iframe.style.height = '768px';

                const timeout = setTimeout(() => {
                    iframe.remove();
                    reject(new Error('iframe load timed out'));
                }, timeoutMs);

                iframe.addEventListener('load', () => {
                    clearTimeout(timeout);
                    resolve(iframe);
                });

                iframe.src = url;
                document.body.appendChild(iframe);
            });
        }, url, FRAME_LOAD_TIMEOUT_MS) as ElementHandle<HTMLIFrameElement>;

        const frame = await handle.contentFrame();
        if (!frame) throw new Error('Failed to get iframe content frame');

        const dispose = async () => {
            await handle.evaluate((el) => el.remove()).catch(() => { });
            await handle.dispose();
        };

        return { frame, dispose };
    }

    private requireBrowser(): BrowserManager {
        if (!this.browser) throw new Error('Omnivox browser is not running');
        return this.browser;
    }

    private async ensureReady(): Promise<void> {
        if (!this.starting) {
            console.warn(this.startError
                ? '[Omnivox] Retrying browser launch after previous failure'
                : '[Omnivox] Waking browser from idle sleep');
        }
        await this.start();
        this.touch();
    }

    private async withPage<T>(run: (page: Page) => Promise<T>): Promise<T> {
        await this.ensureReady();

        try {
            return await run(this.requireBrowser().page);
        } catch (err) {
            if (!isDetachedFrameError(err)) throw err;

            console.warn('[Omnivox] Page frame detached, relaunching browser');
            await this.stop();
            await this.start();
            return await run(this.requireBrowser().page);
        }
    }

    /** Marks activity, pushing back the idle sleep. */
    private touch(): void {
        if (!this.options.idleTimeoutMs) return;
        if (this.idleTimer) clearTimeout(this.idleTimer);

        this.idleTimer = setTimeout(async () => {
            this.idleTimer = null;
            if (!this.browser) return;
            console.warn('[Omnivox] Sleeping after idle timeout');
            await this.stop();
        }, this.options.idleTimeoutMs);
    }

    private scheduleRefresh(): void {
        if (this.options.idleTimeoutMs || !this.options.refreshIntervalMs || this.refreshTimer) return;

        this.refreshTimer = setInterval(async () => {
            if (!this.browser) return;
            try {
                await this.browser.navigateHome();
                console.warn('[Omnivox] Session refreshed');
            } catch (err: any) {
                console.warn('[Omnivox] Session refresh failed:', err.message);
            }
        }, this.options.refreshIntervalMs);
    }

    private clearTimers(): void {
        if (this.refreshTimer) clearInterval(this.refreshTimer);
        if (this.idleTimer) clearTimeout(this.idleTimer);
        this.refreshTimer = null;
        this.idleTimer = null;
    }
}

function isDetachedFrameError(err: unknown): boolean {
    return err instanceof Error && err.message.includes('detached Frame');
}

// Omnivox expects Latin-1 request bodies for these types
function withLatin1Charset(contentType?: string): string | undefined {
    if (!contentType) return contentType;
    if (contentType.startsWith('application/json')) return 'application/json; charset=iso-8859-1';
    if (contentType.startsWith('application/x-www-form-urlencoded')) return 'application/x-www-form-urlencoded; charset=iso-8859-1';
    return contentType;
}

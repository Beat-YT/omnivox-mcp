import puppeteer, { Browser, Cookie, Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { OmnivoxConfig } from '../config';
import { setupPageInterceptors } from './interceptors';
import { setupPageInjection } from './ovxInjection';
import { cleanupPreviousChrome } from './cleanup';

const SKYTECH_READY_TIMEOUT_MS = 60000;

// Extra Chrome flags, space-separated (e.g. "--no-sandbox" when running as root in Docker)
const extraLaunchArgs = (process.env.BROWSER_LAUNCH_ARGS ?? '').split(/\s+/).filter(Boolean);

/**
 * Owns a single Puppeteer browser logged into Omnivox and its main page.
 * Lifecycle only: launching, page setup, teardown. Readiness, sleep and
 * recovery are handled by the owner (see Puppet.ts).
 */
export default class BrowserManager {
    private readonly config: OmnivoxConfig;
    private readonly browserDataDir: string;
    private readonly pidFile: string;

    private browser: Browser | null = null;
    private mainPage: Page | null = null;

    constructor(config: OmnivoxConfig, dataDir: string) {
        this.config = config;
        this.browserDataDir = path.join(dataDir, 'browser');
        this.pidFile = path.join(dataDir, 'chrome.pid');
    }

    /** The user agent the main page runs with, for requests made outside the browser. Read from the config every time. */
    get userAgent(): string {
        return this.config.userAgent;
    }

    get page(): Page {
        if (!this.mainPage) throw new Error('Puppeteer page not initialized');
        return this.mainPage;
    }

    /** Every cookie in the profile. The live Omnivox session is here. */
    cookies(): Promise<Cookie[]> {
        return this.requireBrowser().cookies();
    }

    get connected(): boolean {
        return !!this.browser?.connected;
    }

    get pageAlive(): boolean {
        return !!this.mainPage && !this.mainPage.isClosed();
    }

    async launch(): Promise<void> {
        cleanupPreviousChrome(this.browserDataDir, this.pidFile);

        // A new session starts from an empty profile: nothing of the previous session is kept
        const sessionCookies = this.config.sessionCookies;
        if (sessionCookies) {
            console.warn('[Puppet] Starting from an empty browser profile for the new session');
            fs.rmSync(this.browserDataDir, { recursive: true, force: true });
        } else if (!fs.existsSync(this.browserDataDir)) {
            console.warn('[Puppet] No browser profile and no session, the session is logged out');
        }

        this.browser = await puppeteer.launch({
            headless: true,
            userDataDir: this.browserDataDir,
            defaultViewport: null,
            handleSIGHUP: false,
            handleSIGINT: false,
            handleSIGTERM: false,
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
                '--disable-session-crashed-bubble',
                '--hide-crash-restore-bubble',
                // Memory limits
                '--js-flags=--max-old-space-size=512',
                '--renderer-process-limit=1',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-backgrounding-occluded-windows',
                ...extraLaunchArgs,
            ],
        });

        // Save Chrome PID so the next startup can kill this process if we die without closing it
        const chromePid = this.browser.process()?.pid;
        if (chromePid) fs.writeFileSync(this.pidFile, String(chromePid));

        await this.closeRestoredPages();

        // After this, Chrome's own storage keeps the cookies alive across restarts
        if (sessionCookies) {
            await this.requireBrowser().setCookie(...sessionCookies);
        }

        await this.setupMainPage();

        // Deleted only once the launch went through, so a failed one retries with the same session
        if (sessionCookies) this.config.sessionInstalled();
    }

    async destroy(): Promise<void> {
        const browser = this.browser;
        this.browser = null;
        this.mainPage = null;

        if (browser) {
            // close() throws when the connection is already gone, kill the process so it does not linger
            await browser.close().catch(() => browser.process()?.kill('SIGKILL'));
        }

        if (fs.existsSync(this.pidFile)) fs.unlinkSync(this.pidFile);
    }

    /** Reloads the Omnivox default page and waits for the Skytech runtime. */
    async navigateHome(): Promise<void> {
        if (!this.config.DefaultPage) {
            console.warn('[Puppet] No Omnivox page configured, the session is logged out');
            return;
        }

        await this.page.goto(this.config.DefaultPage);
        await this.page.waitForFunction(
            () => (window as any).Skytech !== undefined,
            { timeout: SKYTECH_READY_TIMEOUT_MS },
        );
    }

    private requireBrowser(): Browser {
        if (!this.browser) throw new Error('Browser is not initialized');
        return this.browser;
    }

    private async closeRestoredPages(): Promise<void> {
        const pages = await this.requireBrowser().pages();

        await Promise.all(pages.map(p => p.goto('about:blank')));

        // Keep the first page: closing it makes Chrome exit
        for (const p of pages.slice(1)) {
            await p.close();
        }
    }

    private async setupMainPage(): Promise<void> {
        const browser = this.requireBrowser();
        const device = this.config.Device.data.device;

        this.mainPage = await browser.newPage();

        await this.mainPage.setViewport(device.viewport);
        await this.mainPage.setUserAgent({
            userAgent: this.userAgent,
            platform: device.platform,
            userAgentMetadata: device.userAgentMetadata,
        });

        await setupPageInterceptors(this.mainPage);
        await setupPageInjection(this.mainPage, this.config);

        await this.navigateHome();
    }
}

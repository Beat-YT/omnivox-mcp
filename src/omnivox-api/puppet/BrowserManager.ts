import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { getElectronCookies, OmnivoxConfig } from '../config';
import { OmnivoxClientConfig } from '@common/constants';
import { buildUserAgent } from './userAgent';
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
    private readonly clientConfig: OmnivoxClientConfig;
    private readonly browserDataDir: string;
    private readonly pidFile: string;

    private browser: Browser | null = null;
    private mainPage: Page | null = null;

    constructor(config: OmnivoxConfig, clientConfig: OmnivoxClientConfig, dataDir: string) {
        this.config = config;
        this.clientConfig = clientConfig;
        this.browserDataDir = path.join(dataDir, 'browser');
        this.pidFile = path.join(dataDir, 'chrome.pid');
    }

    get page(): Page {
        if (!this.mainPage) throw new Error('Puppeteer page not initialized');
        return this.mainPage;
    }

    get connected(): boolean {
        return !!this.browser?.connected;
    }

    get pageAlive(): boolean {
        return !!this.mainPage && !this.mainPage.isClosed();
    }

    async launch(): Promise<void> {
        const isFirstRun = !fs.existsSync(this.browserDataDir);

        cleanupPreviousChrome(this.browserDataDir, this.pidFile);

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

        // Import Electron cookies only on first run to bootstrap the session.
        // After that, Chrome's own storage keeps cookies alive across restarts.
        if (isFirstRun) {
            await this.importCookies();
        }

        await this.setupMainPage();
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

    private async importCookies(): Promise<void> {
        const cookies = getElectronCookies();
        await this.requireBrowser().setCookie(...cookies);
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
        const device = this.clientConfig.device;
        const userAgent = buildUserAgent(this.config.IdAppareil!, this.config.Code!);

        this.mainPage = await browser.newPage();

        await this.mainPage.setViewport(device.viewport);
        await this.mainPage.setUserAgent({
            userAgent,
            platform: device.platform,
            userAgentMetadata: device.userAgentMetadata,
        });

        await setupPageInterceptors(this.mainPage);
        await setupPageInjection(this.mainPage);

        await this.navigateHome();
    }
}

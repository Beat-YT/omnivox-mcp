import OmnivoxClient from './OmnivoxClient';

export type { DownloadResult, FrameHandle, HealthStatus, ProxyRequestInit, ProxyResponse } from './types';
export { default as OmnivoxClient } from './OmnivoxClient';
export { default as BrowserManager } from './BrowserManager';

const minutes = (value: string | undefined): number | undefined => {
    const parsed = parseInt(value ?? '', 10);
    return parsed > 0 ? parsed * 60 * 1000 : undefined;
};

export const omnivox = new OmnivoxClient({
    idleTimeoutMs: process.env.BROWSER_SLEEP === 'true' ? 5 * 60 * 1000 : undefined,
    refreshIntervalMs: minutes(process.env.BROWSER_REFRESH_INTERVAL),
});

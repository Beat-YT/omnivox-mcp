import { Frame } from 'puppeteer';

export interface DownloadResult {
    data: Buffer;
    contentType: string;
    contentDisposition: string;
}

export interface FrameHandle {
    frame: Frame;
    dispose: () => Promise<void>;
}

export interface ProxyRequestInit {
    method: string;
    body?: string;
    contentType?: string;
}

export interface ProxyResponse {
    status: number;
    contentType: string;
    /** base64 */
    body: string;
}

export interface HealthStatus {
    ok: boolean;
    browser: boolean;
    page: boolean;
    omnivox: boolean;
    sleeping: boolean;
    /** Why the last launch failed, when the browser is down for that reason */
    error?: string;
}

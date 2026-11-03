import { Readable } from 'stream';
import { Frame } from 'puppeteer';

export interface DownloadResult {
    /** The file bytes, streamed from Omnivox. Pipe it, it is not buffered. */
    body: Readable;
    contentType: string;
    contentDisposition: string;
    /** From Content-Length, when Omnivox sent one */
    contentLength?: number;
    /** From Content-Disposition, when Omnivox sent one */
    filename?: string;
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

import { Frame } from "puppeteer";

export interface DownloadResult {
    data: Buffer;
    contentType: string;
    contentDisposition: string;
}

export interface FrameHandle {
    frame: Frame;
    dispose: () => Promise<void>;
}

export interface ProxyFetchResult {
    status: number;
    contentType: string;
    body: string; // base64
}
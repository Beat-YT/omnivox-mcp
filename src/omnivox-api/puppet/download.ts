import { Agent, interceptors, request } from 'undici';
import type { IncomingHttpHeaders } from 'http';
import { Cookie } from 'puppeteer';
import { DownloadResult } from './types';

export interface DownloadSession {
    /** The browser's cookie jar, matched against each request URL */
    cookies: Cookie[];
    userAgent: string;
    referer: string;
}

const MAX_REDIRECTS = 5;

// The decompress interceptor drops Content-Encoding and Content-Length once it decodes a body
const dispatcher = new Agent().compose(interceptors.decompress());

/**
 * Fetches a file from Omnivox straight from Node, with the browser's cookies and
 * user agent, shaped like a top-level navigation. The file endpoints need the
 * session only, not the x-ke challenge, so the page is not involved and the body
 * is returned as a stream instead of being buffered.
 *
 * Redirects are followed here rather than by undici, so each hop gets the cookies for its own host.
 */
export async function fetchDownload(url: string, session: DownloadSession): Promise<DownloadResult> {
    let target = new URL(url);
    let redirected = false;

    for (let hop = 0; ; hop++) {
        // Chrome's headers for a document navigation on the Omnivox page, in Chrome's order
        const res = await request(target, {
            method: 'GET',
            dispatcher,
            headers: [
                'Accept-Language', 'en-US,en;q=0.9',
                'Upgrade-Insecure-Requests', '1',
                'User-Agent', session.userAgent,
                'Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Sec-Fetch-Site', 'same-origin',
                'Sec-Fetch-Mode', 'navigate',
                'Sec-Fetch-User', '?1',
                'Sec-Fetch-Dest', 'document',
                'Referer', session.referer,
                'Accept-Encoding', 'gzip, deflate, br',
                'Cookie', cookieHeader(session.cookies, target),
            ],
        });

        const status = res.statusCode;
        const location = header(res.headers, 'location');
        if (location && status >= 300 && status < 400) {
            await res.body.dump();
            if (hop >= MAX_REDIRECTS) throw new Error(`Download redirected too many times (last target: ${location})`);
            target = new URL(location, target);
            redirected = true;
            continue;
        }

        if (status < 200 || status >= 300) {
            await res.body.dump();
            throw new Error(`Omnivox answered ${status} instead of sending the file`);
        }

        // Omnivox sends a literal "false" on its error documents
        const rawType = header(res.headers, 'content-type') || '';
        const contentType = /^[\w.+-]+\/[\w.+-]+/.test(rawType) ? rawType : 'application/octet-stream';
        if (redirected && contentType.startsWith('text/html')) {
            await res.body.dump();
            throw new Error('Omnivox redirected the download to a web page instead of a file. The session has probably expired, log in again with the auth app.');
        }

        const contentDisposition = header(res.headers, 'content-disposition') || '';
        const contentLength = Number(header(res.headers, 'content-length') ?? NaN);

        return {
            body: res.body,
            contentType,
            contentDisposition,
            contentLength: Number.isInteger(contentLength) ? contentLength : undefined,
            filename: parseFilename(contentDisposition),
        };
    }
}

function header(headers: IncomingHttpHeaders, name: string): string | undefined {
    const value = headers[name];
    return Array.isArray(value) ? value[0] : value;
}

/** The Cookie header a browser would send to this URL from this jar. */
export function cookieHeader(cookies: Cookie[], url: URL): string {
    const host = url.hostname;
    const path = url.pathname || '/';
    const https = url.protocol === 'https:';
    const now = Date.now() / 1000;

    return cookies
        .filter((cookie) =>
            (!cookie.secure || https)
            && (cookie.expires < 0 || cookie.expires > now)
            && domainMatches(host, cookie.domain)
            && pathMatches(path, cookie.path),
        )
        // Browsers send longer paths first
        .sort((a, b) => b.path.length - a.path.length)
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join('; ');
}

// Chrome stores host-only cookies without a leading dot and domain cookies with one
function domainMatches(host: string, domain: string): boolean {
    if (!domain.startsWith('.')) return host === domain;
    return host === domain.slice(1) || host.endsWith(domain);
}

function pathMatches(path: string, cookiePath: string): boolean {
    if (!path.startsWith(cookiePath)) return false;
    return cookiePath.endsWith('/') || path.length === cookiePath.length || path[cookiePath.length] === '/';
}

/** File name from a Content-Disposition header, preferring the RFC 5987 filename* form. */
export function parseFilename(disposition: string): string | undefined {
    const extended = disposition.match(/filename\*\s*=\s*[^']*'[^']*'([^;]+)/i);
    if (extended) {
        try {
            return decodeURIComponent(extended[1].trim()) || undefined;
        } catch { }
    }

    const plain = disposition.match(/filename\s*=\s*(?:"([^"]*)"|([^;]+))/i);
    const name = (plain?.[1] ?? plain?.[2])?.trim();
    return name || undefined;
}

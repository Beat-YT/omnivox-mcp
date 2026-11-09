export function toLocalIso(input: Date | number | string = new Date()) {
    const date = new Date(input)
    const offset = -date.getTimezoneOffset()
    const sign = offset >= 0 ? '+' : '-'
    const pad = (n: number, len = 2) => String(Math.abs(n)).padStart(len, '0')

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
        `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}` +
        `${sign}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`
}

export function toIso(ms?: number) {
    if (!ms || ms < 0) return undefined
    return toLocalIso(ms)
}

/** Readable local date for text output, e.g. "Thu, Sep 24 11:43". Adds the year outside the current one. */
const INT_SENTINELS = new Set([2147483647, -2147483648]);

export function isRealInt(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && !INT_SENTINELS.has(value);
}

// .NET DateTime.MaxValue (9999-12-31), sent when there is no end date
const DOTNET_MAX_DATE = 253402300799999;

function isRealDate(ms?: number): ms is number {
    return !!ms && ms > 0 && ms < DOTNET_MAX_DATE
}

export function toDisplayDate(ms?: number) {
    if (!isRealDate(ms)) return undefined
    const time = new Date(ms).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false })
    return `${toDisplayDay(ms)} ${time}`
}

/** Readable local day without a time, e.g. "Thu, Oct 29", for dates Omnivox sends as midnight. */
export function toDisplayDay(ms?: number) {
    if (!isRealDate(ms)) return undefined
    const d = new Date(ms)
    return d.toLocaleDateString('en-CA', {
        weekday: 'short', month: 'short', day: 'numeric',
        year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric'
    })
}

export function formatBytes(bytes?: number) {
    if (!bytes || bytes < 0) return undefined
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Full HTML body as plain text, keeping line breaks, list items and link targets. */
export function htmlToText(html?: string) {
    if (!html) return undefined

    return html
        .replace(/\s+/g, ' ')
        .replace(/<a\b[^>]*?\bhref=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, (_, href: string, label: string) => {
            const text = label.replace(/<[^>]*>/g, '').trim()
            const target = href.replace(/^mailto:/i, '')
            return !text || text === target ? target : `[${text}](${href})`
        })
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<li\b[^>]*>/gi, '- ')
        .replace(/<\/?(ul|ol)\b[^>]*>/gi, '\n')
        .replace(/<\/(p|div|li|h[1-6]|tr|blockquote)>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
        .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
        .replace(/&amp;/gi, '&')
        .replace(/[ \t ]+/g, ' ')
        .replace(/ *\n */g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

export function extractHtmlPreview(html?: string, maxLength = 350) {
    if (!html) return undefined

    const text = html
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .replace(/_{4,}/g, '//')
        .trim()

    return text.length > maxLength
        ? text.slice(0, maxLength) + "…"
        : text
}
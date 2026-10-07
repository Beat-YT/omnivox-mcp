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
export function toDisplayDate(ms?: number) {
    if (!ms || ms < 0) return undefined
    const d = new Date(ms)
    const date = d.toLocaleDateString('en-CA', {
        weekday: 'short', month: 'short', day: 'numeric',
        year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric'
    })
    const time = d.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false })
    return `${date} ${time}`
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
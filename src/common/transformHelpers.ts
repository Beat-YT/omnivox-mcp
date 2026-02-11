export function toIso(ms?: number) {
    if (!ms || ms < 0) return undefined
    return new Date(ms).toISOString()
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
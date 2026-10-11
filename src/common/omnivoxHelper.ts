import { GetDefaultModel } from "@api/Lea";

// 5 days memory cache for default term id
const CACHE_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

let cachedTermId: string | null = null;
let cacheTimestamp = 0;
let inflight: Promise<string> | null = null;

export async function getDefaultTermId(): Promise<string> {
    if (cachedTermId && Date.now() - cacheTimestamp < CACHE_DURATION_MS) {
        return cachedTermId;
    }

    // Share one request between concurrent callers
    inflight ??= fetchDefaultTermId().finally(() => { inflight = null; });
    return inflight;
}

async function fetchDefaultTermId(): Promise<string> {
    try {
        const defaultModel = await GetDefaultModel();
        const termId = defaultModel.AnSessionDisponible?.AnSessionDefault || defaultModel.AnSession;
        if (!termId) {
            throw new Error('Default term ID not found in the Lea DefaultModel');
        }

        cachedTermId = termId;
        cacheTimestamp = Date.now();
        return termId;
    } catch (error) {
        if (cachedTermId) {
            console.warn('Failed to fetch default term ID, using stale cached value:', error);
            return cachedTermId;
        }

        console.error('Failed to fetch default term ID and no cached value available:', error);
        throw error;
    }
}

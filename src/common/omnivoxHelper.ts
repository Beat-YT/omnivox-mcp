import { GetDefaultModel } from "@api/Lea";

const CACHE_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

let cachedTermId: Promise<string> | null = null;
let cacheTimestamp: number | null = null;


export async function getDefaultTermId() {
    if (isCacheValid()) {
        return cachedTermId!;
    }

    cachedTermId = _getDefaultTermId();
    cacheTimestamp = Date.now();
    return cachedTermId;
}

function isCacheValid() {
    const now = Date.now();
    return cachedTermId && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION_MS);
}

async function _getDefaultTermId() {
    try {
        const defaultModel = await GetDefaultModel();
        const termId = defaultModel.AnSessionDisponible?.AnSessionDefault || defaultModel.AnSession;
        if (!termId) {
            throw new Error('Default term ID not found in the Lea DefaultModel');
        }

        return termId;
    } catch (error) {
        if (cachedTermId) {
            console.warn('Failed to fetch default term ID, using cached value:', error);
            cacheTimestamp = 0;
            return cachedTermId;
        }

        console.error('Failed to fetch default term ID and no cached value available:', error);
        throw error;
    }
}
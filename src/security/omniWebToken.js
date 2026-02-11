import crypto from 'crypto';

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const store = new Map();

/**
 * Create a short opaque token
 */
export function createWebToken(payload) {
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 24);

    store.set(id, {
        payload,
        expiresAt: Date.now() + TOKEN_TTL_MS,
    });

    return id;
}

/**
 * Resolve & validate token
 */
export function consumeWebToken(id) {
    const entry = store.get(id);
    if (!entry) return null;

    // Expired
    if (Date.now() > entry.expiresAt) {
        store.delete(id);
        return null;
    }

    return entry.payload;
}

/**
 * Cleanup expired tokens periodically
 */
setInterval(() => {
    const now = Date.now();
    for (const [id, entry] of store.entries()) {
        if (now > entry.expiresAt) {
            store.delete(id);
        }
    }
}, 60_000);

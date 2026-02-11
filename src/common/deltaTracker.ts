import * as fs from 'fs';
import * as path from 'path';
import { dataDir } from './dataDir';

type Snapshot = Record<string, number>;
type Delta = { key: string; prev: number; curr: number; diff: number };

const STORE_PATH = path.join(dataDir, 'deltaSnapshots.json');

let store: Record<string, Snapshot> = {};

try {
    store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
} catch {
    // First run or corrupt file — start fresh
}

function persist() {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(store));
}

/**
 * Stores a snapshot and returns an array of diffs vs. the previous snapshot.
 * Returns `null` on first call (no previous data to compare).
 */
export function computeDelta(key: string, snapshot: Snapshot): Delta[] | null {
    const prev = store[key];
    store[key] = snapshot;
    persist();

    if (!prev) return null;

    const allKeys = new Set([...Object.keys(prev), ...Object.keys(snapshot)]);
    const deltas: Delta[] = [];

    for (const k of allKeys) {
        const p = prev[k] ?? 0;
        const c = snapshot[k] ?? 0;
        if (p !== c) {
            deltas.push({ key: k, prev: p, curr: c, diff: c - p });
        }
    }

    return deltas;
}

/**
 * Groups deltas by item ID and returns per-item formatted strings.
 * Returns `null` on first call. `header` is set when there are no changes globally.
 * `items` maps each changed item ID to a bracketed diff string like `[+3 documents, -1 unread]`.
 */
export function itemDeltaText(
    deltas: Delta[] | null,
    metricLabelFn: (metric: string) => string,
): { header: string; items: Record<string, string> } | null {
    if (deltas === null) return null;
    if (deltas.length === 0) return { header: '[No changes since last call]', items: {} };

    const grouped: Record<string, Delta[]> = {};
    for (const d of deltas) {
        const sepIdx = d.key.indexOf(':');
        const itemId = d.key.substring(0, sepIdx);
        if (!grouped[itemId]) grouped[itemId] = [];
        grouped[itemId].push(d);
    }

    const items: Record<string, string> = {};
    for (const [id, itemDeltas] of Object.entries(grouped)) {
        const parts = itemDeltas.map(d => {
            const metric = d.key.substring(d.key.indexOf(':') + 1);
            const sign = d.diff > 0 ? '+' : '';
            return `${sign}${d.diff} ${metricLabelFn(metric)}`;
        });
        items[id] = `[${parts.join(', ')}]`;
    }

    return { header: '', items };
}

/**
 * Helper to flatten an array of items into a flat key-value snapshot.
 * Keys are encoded as `{id}:{metric}`.
 */
export function flattenSnapshot<T>(
    items: T[],
    idFn: (item: T) => string,
    metrics: Record<string, (item: T) => number>,
): Snapshot {
    const snapshot: Snapshot = {};
    for (const item of items) {
        const id = idFn(item);
        for (const [metric, accessor] of Object.entries(metrics)) {
            snapshot[`${id}:${metric}`] = accessor(item);
        }
    }
    return snapshot;
}

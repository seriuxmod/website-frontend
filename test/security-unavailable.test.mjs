import test from 'node:test';
import assert from 'node:assert/strict';
import { securityApi } from '../src/lib/securityApi.js';

test('unreachable security API reports unavailable instead of inventing account state', async () => {
    const descriptors = Object.fromEntries(['sessionStorage', 'fetch'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    try {
        Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: () => null } });
        Object.defineProperty(globalThis, 'fetch', { configurable: true, value: async () => { throw new TypeError('Failed to fetch'); } });
        await assert.rejects(() => securityApi.status(), /Identitätsdienst ist derzeit nicht erreichbar/);
    } finally {
        for (const [key, descriptor] of Object.entries(descriptors)) {
            if (descriptor) Object.defineProperty(globalThis, key, descriptor);
            else delete globalThis[key];
        }
    }
});

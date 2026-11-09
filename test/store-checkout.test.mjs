import test from 'node:test';
import assert from 'node:assert/strict';
import { submitStoreCheckout } from '../src/lib/storeCheckout.js';
import { beginLogin } from '../src/lib/auth.js';

test('checkout command never continues billing/order/payment writes across a changed account and never retries an uncertain payment', async () => {
    const old = Object.getOwnPropertyDescriptor(globalThis, 'window'), storage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
    const values = new Map();
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { origin: 'https://seriuxmod.net', assign() {} } } });
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: key => values.get(key), setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) } });
    const input = { profile: {}, order: { idempotencyKey: 'fixture' }, paymentMethod: { id: 'test', provider: 'synthetic', enabled: true, providerConfigured: true } };
    try {
        for (const boundary of ['billing', 'order']) {
            const calls = [];
            await assert.rejects(submitStoreCheckout(input, {
                async updateBillingProfile() { calls.push('billing'); if (boundary === 'billing') await beginLogin(); },
                async createOrder() { calls.push('order'); if (boundary === 'order') await beginLogin(); return { id: 'o' }; },
                async createPayment() { calls.push('payment'); }
            }), error => error.name === 'AbortError');
            assert.deepEqual(calls, boundary === 'billing' ? ['billing'] : ['billing', 'order']);
        }
        let payments = 0;
        await assert.rejects(submitStoreCheckout(input, {
            async updateBillingProfile() {}, async createOrder(order) { assert.equal(order.idempotencyKey, 'fixture'); return { id: 'o' }; },
            async createPayment() { payments++; throw new Error('unknown outcome'); }
        }), /unknown outcome/);
        assert.equal(payments, 1);
        await assert.rejects(submitStoreCheckout({ ...input, paymentMethod: { ...input.paymentMethod, enabled: false } }, {}), /Keine verfügbare/);
    } finally {
        if (old) Object.defineProperty(globalThis, 'window', old); else delete globalThis.window;
        if (storage) Object.defineProperty(globalThis, 'sessionStorage', storage); else delete globalThis.sessionStorage;
    }
});

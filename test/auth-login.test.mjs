import test from 'node:test';
import assert from 'node:assert/strict';
import { beginLogin, completeLogin } from '../src/lib/auth.js';

test('PKCE login defaults to the named public profile without depending on old REST endpoints', async () => {
    const values = new Map();
    const descriptors = Object.fromEntries(['sessionStorage', 'window', 'fetch'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    let authorization;
    let calls = 0;
    try {
        Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
            getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key)
        } });
        Object.defineProperty(globalThis, 'window', { configurable: true, value: {
            location: { origin: 'https://seriuxmod.net', assign: url => { authorization = new URL(url); } }, dispatchEvent() {}
        } });
        const claims = { username: 'RealHosti', uid: '11111111-1111-4111-8111-00000000a001', exp: Math.floor(Date.now() / 1000) + 900 };
        values.set('seriux_user_profile', JSON.stringify({ username: 'PreviousName', playerId: claims.uid }));
        values.set('seriux_identity_token', `old.${Buffer.from(JSON.stringify({ username: 'PreviousName' })).toString('base64url')}.fixture`);
        Object.defineProperty(globalThis, 'fetch', { configurable: true, value: async (url, options) => {
            calls++;
            assert.equal(url, 'https://auth.seriuxmod.net/oauth2/token');
            assert.equal(options.body.get('code_verifier'), values.get('seriux_pkce_verifier'));
            return { ok: true, json: async () => ({ access_token: `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature` }) };
        } });
        await beginLogin();
        assert.equal(authorization.searchParams.get('code_challenge_method'), 'S256');
        assert.equal(authorization.searchParams.get('redirect_uri'), 'https://seriuxmod.net/auth/callback');
        await assert.rejects(() => completeLogin('fixture-code', 'wrong-state'));
        assert.equal(calls, 0);
        const target = await completeLogin('fixture-code', authorization.searchParams.get('state'));
        assert.equal(target, '/@RealHosti');
        assert.equal(calls, 1);
        assert.equal(values.has('seriux_pkce_verifier'), false);
        assert.equal(values.has('seriux_oauth_state'), false);
    } finally {
        for (const [key, descriptor] of Object.entries(descriptors)) {
            if (descriptor) Object.defineProperty(globalThis, key, descriptor);
            else delete globalThis[key];
        }
    }
});

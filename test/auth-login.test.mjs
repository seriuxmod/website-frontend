import test from 'node:test';
import assert from 'node:assert/strict';
import { beginLogin, completeLogin, logout, refreshAuthenticatedSession } from '../src/lib/auth.js';

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
            assert.equal(options.credentials, 'include');
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
        await beginLogin('/me/settings/security', { reauthenticate: true });
        assert.equal(authorization.searchParams.get('prompt'), 'login');
        assert.equal(await completeLogin('fixture-second-code', authorization.searchParams.get('state')), '/me/settings/security');
    } finally {
        for (const [key, descriptor] of Object.entries(descriptors)) {
            if (descriptor) Object.defineProperty(globalThis, key, descriptor);
            else delete globalThis[key];
        }
    }
});

test('an in-flight refresh cannot restore a session after logout', async () => {
    const values = new Map();
    const prior = Object.fromEntries(['sessionStorage', 'window', 'fetch'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    const token = exp => `fixture.${Buffer.from(JSON.stringify({ uid: 'fixture-user', exp })).toString('base64url')}.fixture`;
    let finishRefresh;
    try {
        Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
            getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key)
        } });
        Object.defineProperty(globalThis, 'window', { configurable: true, value: { dispatchEvent() {} } });
        const old = token(Math.floor(Date.now()/1000) - 1);
        values.set('seriux_access_token', old); values.set('seriux_refresh_token', 'old-refresh');
        Object.defineProperty(globalThis, 'fetch', { configurable: true, value: async (url, options) => {
            if (url.endsWith('/oauth2/token')) {
                assert.equal(options.credentials, 'include');
                return new Promise(resolve => { finishRefresh = resolve; });
            }
            if (url.endsWith('/oauth2/revoke')) return { ok: true };
            if (url.endsWith('/csrf')) return { ok: true, json: async () => ({ parameterName: '_csrf', token: 'fixture' }) };
            assert.equal(new Headers(options.headers).get('Authorization'), `Bearer ${old}`);
            assert.equal(options.credentials, 'include');
            return { status: 204 };
        } });
        const refresh = refreshAuthenticatedSession();
        await logout();
        finishRefresh({ ok: true, json: async () => ({ access_token: token(Math.floor(Date.now()/1000) + 900), refresh_token: 'rotated-refresh' }) });
        assert.equal(await refresh, null);
        assert.equal(values.has('seriux_access_token'), false);
        assert.equal(values.has('seriux_refresh_token'), false);
    } finally {
        for (const [key, descriptor] of Object.entries(prior)) {
            if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
        }
    }
});

test('a superseded OAuth callback cannot replace the newly selected login', async () => {
    const values = new Map([['seriux_oauth_state', 'first-state'], ['seriux_pkce_verifier', 'first-verifier']]);
    const prior = Object.fromEntries(['sessionStorage', 'window', 'fetch'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    let finish;
    try {
        Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
            getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key)
        } });
        Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { origin: 'https://seriuxmod.net', assign() {} }, dispatchEvent() {} } });
        Object.defineProperty(globalThis, 'fetch', { configurable: true, value: async () => new Promise(resolve => { finish = resolve; }) });
        const first = completeLogin('first-code', 'first-state');
        await beginLogin();
        finish({ ok: true, json: async () => ({ access_token: 'not-the-selected-account' }) });
        await assert.rejects(() => first, /zwischenzeitlich ersetzt/);
        assert.equal(values.has('seriux_access_token'), false);
        assert.notEqual(values.get('seriux_oauth_state'), 'first-state');
    } finally {
        for (const [key, descriptor] of Object.entries(prior)) {
            if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
        }
    }
});

test('a terminal response from an older refresh cannot erase a newly started login', async () => {
    const values = new Map([['seriux_refresh_token', 'old-refresh']]);
    const prior = Object.fromEntries(['sessionStorage', 'window', 'fetch'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    let finish;
    try {
        Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
            getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key)
        } });
        Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { origin: 'https://seriuxmod.net', assign() {} }, dispatchEvent() {} } });
        Object.defineProperty(globalThis, 'fetch', { configurable: true, value: async () => new Promise(resolve => { finish = resolve; }) });
        const refresh = refreshAuthenticatedSession();
        await beginLogin('/me/settings/security'); const selected = values.get('seriux_oauth_state');
        finish({ ok: false, json: async () => ({ error: 'invalid_grant' }) });
        await refresh;
        assert.equal(values.get('seriux_oauth_state'), selected);
        assert.ok(values.get('seriux_pkce_verifier'));
    } finally {
        for (const [key, descriptor] of Object.entries(prior)) {
            if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
        }
    }
});

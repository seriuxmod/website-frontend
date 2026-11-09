import test from 'node:test';
import assert from 'node:assert/strict';
import { SocialSession } from '../src/lib/socialSession.js';
const tick = () => new Promise(resolve => setImmediate(resolve));
const missing = async () => { throw Object.assign(new Error('not found'), { code: 5 }); };
function fixture(t) {
    const streams = [], states = [], writes = [];
    const api = {
        presence: { mine: async () => ({ preferredStatus: 'INVISIBLE', effectiveStatus: 'INVISIBLE', connectedSurfaces: ['WEBSITE', 'LAUNCHER'] }), heartbeat: async () => {}, public: async () => ({ status: 'OFFLINE', surfaces: [] }), setStatus: async status => { writes.push(status); } },
        friends: { list: async () => [], requests: async () => [] }, parties: { overview: missing }, clans: { mine: missing, invites: async () => [] },
        notifications: { list: async () => ({ items: [], unreadCount: 0, totalPages: 0 }) }
    };
    const session = new SocialSession({ api, users: { batch: async ids => ids.map(playerId => ({ playerId, username: 'Fixture' })) },
        ensureSession: async () => ({ playerId: session.state.userId }), tokenExpiresAt: () => NaN, onState: value => states.push(value),
        watch: signal => {
            const queue = []; let waiter;
            const stream = {
                push(value) { if (waiter) { const { resolve } = waiter; waiter = null; resolve({ value, done: false }); } else queue.push(value); },
                fail(error) { if (waiter) { waiter.reject(error); waiter = null; } },
                [Symbol.asyncIterator]() { return this; },
                next() { return queue.length ? Promise.resolve({ value: queue.shift(), done: false }) : new Promise((resolve, reject) => { waiter = { resolve, reject }; }); }
            };
            signal.addEventListener('abort', () => stream.fail(Object.assign(new Error('canceled'), { name: 'AbortError' })), { once: true });
            streams.push(stream); return stream;
        } });
    t.after(() => session.stop()); return { session, streams, states, writes, api };
}
async function ready(session, streams, user = 'alice', sid) {
    session.select(user, sid); await tick(); streams.at(-1).push({ payload: { case: 'ready', value: { userId: user } } }); await tick();
    assert.equal(session.state.connection, 'connected');
}

test('browser uses one central Watch, reloads on events and keeps global status separate from surfaces', async t => {
    const { session, streams, writes } = fixture(t); await ready(session, streams);
    assert.equal(session.state.ownPresence.preferredStatus, 'INVISIBLE');
    assert.deepEqual(session.state.ownPresence.connectedSurfaces, ['WEBSITE', 'LAUNCHER']);
    session.select('alice'); assert.equal(streams.length, 1);
    await session.mutate(api => api.presence.setStatus('IDLE')); assert.deepEqual(writes, ['IDLE']);
    streams[0].push({ payload: { case: 'socialEvent', value: { topic: 'presence.updated' } } }); await tick();
    assert.equal(session.state.connection, 'connected');
});

test('account changes synchronously clear all private state and discard late RPC responses', async t => {
    const { session, streams, api } = fixture(t); await ready(session, streams);
    let finish;
    api.friends.list = () => new Promise(resolve => { finish = resolve; });
    const old = session.refresh(); await tick();
    session.select('bob'); assert.equal(session.state.ownPresence, null); assert.deepEqual(session.state.friends, []);
    finish([{ id: 'private-alice-data', friendUserId: 'eve' }]); await old;
    assert.equal(session.state.userId, 'bob'); assert.deepEqual(session.state.friends, []);
});

test('revoked Watch clears private projections, halts reconnect and refuses mutations', async t => {
    const { session, streams } = fixture(t); await ready(session, streams);
    streams[0].fail(Object.assign(new Error('revoked'), { code: 16 })); await tick();
    assert.equal(session.state.connection, 'unauthenticated'); assert.equal(session.state.ownPresence, null);
    assert.deepEqual(session.state.notifications, []); assert.equal(session.halted, true);
    await assert.rejects(() => session.mutate(() => {}));
});

test('ordinary domain permission errors do not log out the account or retry a write', async t => {
    const { session, streams } = fixture(t); await ready(session, streams); let writes = 0;
    await assert.rejects(() => session.mutate(async () => { writes++; throw Object.assign(new Error('not allowed'), { code: 7 }); }));
    assert.equal(writes, 1); assert.equal(session.state.connection, 'connected'); assert.equal(session.halted, false);
});

test('same-account reauthentication replaces the old SID-bound Watch, ordinary refresh does not', async t => {
    const { session, streams } = fixture(t); await ready(session, streams, 'alice', 'first-sid');
    session.select('alice', 'first-sid'); assert.equal(streams.length, 1);
    session.select('alice', 'new-sid'); assert.equal(session.state.ownPresence, null); await tick();
    assert.equal(streams.length, 2);
    streams[1].push({ payload: { case: 'ready', value: { userId: 'alice' } } }); await tick();
    assert.equal(session.state.connection, 'connected');
    assert.equal(session.sessionId, 'new-sid');
});

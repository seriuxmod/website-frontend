import test from 'node:test';
import assert from 'node:assert/strict';
import { create, toBinary, fromBinary } from '@bufbuild/protobuf';
import { StatusService } from '../src/gen/seriuxmod/status/v1/status_service_pb.js';
import { AdminPlayerService } from '../src/gen/seriuxmod/user/v1/admin_player_service_pb.js';
import { AdminPermissionService } from '../src/gen/seriuxmod/user/v1/admin_permission_service_pb.js';
import { TeamAdminService } from '../src/gen/seriuxmod/user/v1/team_admin_service_pb.js';
import { BlogAdminService } from '../src/gen/seriuxmod/forum/v1/blog_service_pb.js';
import { websiteJson, createWebsiteRpc } from '../src/lib/grpc/websiteRpc.js';
import { userAdminApi } from '../src/lib/userAdminApi.js';
import { teamApi } from '../src/lib/teamApi.js';
import { statusApi } from '../src/lib/statusAdminApi.js';
import { beginLogin, getSessionGeneration, authenticatedFetch } from '../src/lib/auth.js';

function frame(payload, flags = 0) {
    const bytes = new Uint8Array(payload.length + 5); bytes[0] = flags;
    new DataView(bytes.buffer).setUint32(1, payload.length); bytes.set(payload, 5); return bytes;
}
function reply(schema, data = {}, code = 0) {
    return new Response(new Blob([...(code ? [] : [frame(toBinary(schema, create(schema, data)))]),
        frame(new TextEncoder().encode(`grpc-status: ${code}\r\n`), 128)]), { headers: { 'content-type': 'application/grpc-web+proto' } });
}
const uuid = '10000000-0000-0000-0000-000000000001';
function globals(values) {
    const prior = Object.fromEntries(Object.keys(values).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    for (const [key, value] of Object.entries(values)) Object.defineProperty(globalThis, key, { value, configurable: true });
    return () => { for (const [key, descriptor] of Object.entries(prior)) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } };
}
function storage() { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) }; }

test('schema-aware website mapping preserves literal strings, timestamps, optional fields and exact int64 values', () => {
    const input = websiteJson(BlogAdminService.method.createPost.input, { title: 'BLOG_STATUS_PUBLISHED', content: 'hello', slug: 'test', status: 'DRAFT' }, { input: true });
    assert.equal(input.title, 'BLOG_STATUS_PUBLISHED'); assert.equal(input.status, 'BLOG_STATUS_DRAFT');
    const schema = AdminPermissionService.method.updateGroup.input;
    assert.equal(websiteJson(schema, { key: 'test', group: { key: 'test', version: '9007199254740993' } }, { input: true }).group.version, '9007199254740993');
    assert.throws(() => websiteJson(schema, { key: 'test', group: { version: 9007199254740993 } }, { input: true }), /Zahlenbereich/);
    assert.throws(() => websiteJson(schema, { ignoredWrite: true }, { input: true }), /Nicht unterstütztes Feld/);
    assert.throws(() => websiteJson(BlogAdminService.method.createPost.input, { status: 'MADE_UP' }, { input: true }), /Unbekannter Wert/);
    const output = AdminPermissionService.method.getGroup.output;
    assert.equal(websiteJson(output, { version: '9007199254740993' }, { exactLongs: true }).version, '9007199254740993');
    assert.throws(() => websiteJson(output, { version: '9007199254740993' }), /darstellbaren/);
    const date = '2026-11-09T10:00:00.000Z';
    assert.equal(websiteJson(TeamAdminService.method.createCalendarEvent.input, { event: { startsAt: date, description: 'TEAM_TONE_ORANGE' } }, { input: true }).event.startsAt, date);
});

test('website player, permission and team adapters send canonical bounded RPC requests, not legacy REST', async () => {
    const requests = [];
    const token = `fixture.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now()/1000) + 900 })).toString('base64url')}.fixture`;
    const restore = globals({ sessionStorage: { getItem: key => key === 'seriux_access_token' ? token : null }, fetch: async (url, init) => {
        const path = new URL(url).pathname; requests.push(path);
        assert.equal(init.credentials, 'omit'); assert.equal(new Headers(init.headers).get('authorization'), `Bearer ${token}`);
        assert.match(new Headers(init.headers).get('content-type'), /^application\/grpc-web/);
        const bytes = new Uint8Array(init.body).subarray(5);
        if (path.endsWith('AdminPlayerService/ListPlayers')) {
            const r = fromBinary(AdminPlayerService.method.listPlayers.input, bytes);
            assert.equal(r.query, 'Synthetic'); assert.equal(r.locked, false); assert.equal(r.websiteAccessEnabled, undefined);
            return reply(AdminPlayerService.method.listPlayers.output, { players: [{ id: uuid, username: 'Synthetic' }], totalElements: 1n });
        }
        if (path.endsWith('AdminPermissionService/UpdateGroup')) {
            const r = fromBinary(AdminPermissionService.method.updateGroup.input, bytes);
            assert.equal(r.group.version, 7n); assert.deepEqual(r.group.permissions, []);
            return reply(AdminPermissionService.method.updateGroup.output, { key: 'test', version: 8n });
        }
        if (path.endsWith('TeamAdminService/CreateCalendarEvent')) {
            const r = fromBinary(TeamAdminService.method.createCalendarEvent.input, bytes); assert.equal(r.event.tone, 1);
            return reply(TeamAdminService.method.createCalendarEvent.output, { id: 'event', tone: 1 });
        }
        if (path.endsWith('TeamAdminService/ListNotes')) {
            const r = fromBinary(TeamAdminService.method.listNotes.input, bytes); assert.equal(r.pinned, false); assert.equal(r.query, 'note');
            return reply(TeamAdminService.method.listNotes.output, { notes: [], totalElements: 0n });
        }
        if (path.endsWith('TeamAdminService/ListCalendar')) return reply(TeamAdminService.method.listCalendar.output, { events: [] });
        throw new Error(`Unexpected transport ${path}`);
    } });
    try {
        assert.equal((await userAdminApi.players({ q: 'Synthetic', locked: 'false' })).totalElements, 1);
        assert.equal((await userAdminApi.updatePermissionGroup('test', { key: 'test', permissions: [], version: 7 })).version, 8);
        assert.equal((await teamApi.saveCalendarEvent('', { title: 'Testdatensatz', tone: 'ORANGE', startsAt: '2026-11-10T10:00:00Z', endsAt: '2026-11-10T11:00:00Z' })).tone, 'ORANGE');
        assert.equal((await teamApi.notes({ q: 'note', pinned: 'false' })).totalElements, 0);
        assert.deepEqual(await teamApi.calendar({ from: '2026-11-01T00:00:00Z', to: '2026-12-01T00:00:00Z' }), []);
        assert.equal(requests.length, 5);
        await assert.rejects(userAdminApi.createBan({}), error => error.status === 501 && /Noch nicht implementiert/.test(error.message));
        assert.equal(requests.length, 5, 'missing ban backend must not be emulated by account locking or REST');
    } finally { restore(); }
});

test('public regional status omits bearer metadata and reflects the backend state without invented regions', async () => {
    const restore = globals({ sessionStorage: { getItem: () => 'private-fixture' }, fetch: async (url, init) => {
        assert.equal(new Headers(init.headers).get('authorization'), null); assert.equal(init.credentials, 'omit');
        assert.equal(new URL(url).pathname, '/seriuxmod.status.v1.StatusService/GetSummary');
        return reply(StatusService.method.getSummary.output, { overallStatus: 'UNKNOWN', regions: [{ region: { regionId: 'global', displayName: 'Global' }, overallStatus: 'UNKNOWN' }] });
    } });
    try { const result = await statusApi.summary(); assert.equal(result.overallStatus, 'UNKNOWN'); assert.deepEqual(result.regions.map(v => v.region.regionId), ['global']); }
    finally { restore(); }
});

test('private website writes are not automatically retried after an uncertain or denied response', async () => {
    let calls = 0;
    const rpc = createWebsiteRpc({ privateFetch: async () => { calls++; return reply(null, {}, 10); } });
    await assert.rejects(rpc(AdminPermissionService, 'deleteGroup', { key: 'synthetic', version: 2 }), error => error.code === 10 && error.status === 409);
    assert.equal(calls, 1);
    let networkCalls = 0;
    const disconnected = createWebsiteRpc({ privateFetch: async () => { networkCalls++; throw new TypeError('fetch failed'); } });
    await assert.rejects(disconnected(AdminPermissionService, 'deleteGroup', { key: 'synthetic', version: 2 }), error => error.code === 14 && /Ergebniszustand prüfen/.test(error.message));
    assert.equal(networkCalls, 1, 'a transport failure must not blindly retry an uncertain write');
});

test('private website replies and not-yet-sent commands are fenced across account/login changes', async () => {
    let release, started;
    const entered = new Promise(resolve => { started = resolve; });
    const restore = globals({ sessionStorage: storage(), localStorage: storage(), window: { location: { origin: 'https://seriuxmod.net', assign() {} }, dispatchEvent() {} } });
    try {
        const before = getSessionGeneration();
        const rpc = createWebsiteRpc({ privateFetch: async () => { started(); return new Promise(resolve => { release = resolve; }); } });
        const pending = rpc(AdminPlayerService, 'getPlayer', { userId: uuid });
        await entered; await beginLogin('/me');
        release(reply(AdminPlayerService.method.getPlayer.output, { player: { id: uuid, username: 'Old-account-private' } }));
        await assert.rejects(pending, error => error.name === 'AbortError');
        await assert.rejects(authenticatedFetch('https://rpc.seriuxmod.net/not-sent', { expectedSessionGeneration: before }), error => error.name === 'AbortError');
    } finally { restore(); }
});

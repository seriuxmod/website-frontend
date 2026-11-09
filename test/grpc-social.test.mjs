import test from 'node:test';
import assert from 'node:assert/strict';
import { create, toBinary, fromBinary } from '@bufbuild/protobuf';
import { OwnPresenceSchema, PublicPresenceSchema, SetPresenceStatusRequestSchema, UserPresenceStatus, PresenceSurface } from '../src/gen/seriuxmod/social/v1/presence_model_pb.js';
import { DirectMessageSchema, SendDirectMessageRequestSchema } from '../src/gen/seriuxmod/social/v1/chat_model_pb.js';
import { grpcSocial } from '../src/lib/grpc/socialClients.js';

function frame(payload, flags = 0) {
    const bytes = new Uint8Array(payload.length + 5); bytes[0] = flags;
    new DataView(bytes.buffer).setUint32(1, payload.length); bytes.set(payload, 5); return bytes;
}
function response(schema, data, code = 0) {
    return new Response(new Blob([schema ? frame(toBinary(schema, create(schema, data))) : new Uint8Array(),
        frame(new TextEncoder().encode(`grpc-status: ${code}\r\n`), 128)]), { headers: { 'content-type': 'application/grpc-web+proto' } });
}

test('global status and independent owner connections use canonical binary gRPC-Web, public reads never send bearer metadata', async () => {
    const original = Object.fromEntries(['fetch', 'sessionStorage'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    const token = `fixture.${Buffer.from(JSON.stringify({ exp: Date.now() / 1000 + 900 })).toString('base64url')}.fixture`;
    const paths = [];
    try {
        Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: key => key === 'seriux_access_token' ? token : null } });
        Object.defineProperty(globalThis, 'fetch', { configurable: true, value: async (url, init) => {
            const path = new URL(url).pathname; paths.push(path);
            const headers = new Headers(init.headers);
            assert.equal(init.credentials, 'omit'); assert.match(headers.get('content-type'), /^application\/grpc-web/);
            if (path.endsWith('/GetPublicPresence')) {
                assert.equal(headers.has('authorization'), false);
                return response(PublicPresenceSchema, { online: false, status: UserPresenceStatus.OFFLINE });
            }
            assert.equal(headers.get('authorization'), `Bearer ${token}`);
            if (path.endsWith('/SetStatus')) {
                const request = fromBinary(SetPresenceStatusRequestSchema, new Uint8Array(init.body).subarray(5));
                assert.equal(request.status, UserPresenceStatus.INVISIBLE);
            }
            return response(OwnPresenceSchema, { preferredStatus: UserPresenceStatus.INVISIBLE, effectiveStatus: UserPresenceStatus.INVISIBLE,
                connectedSurfaces: [PresenceSurface.WEBSITE, PresenceSurface.LAUNCHER] });
        } });
        const own = await grpcSocial.presence.mine();
        assert.deepEqual(own, { preferredStatus: 'INVISIBLE', effectiveStatus: 'INVISIBLE', connectedSurfaces: ['WEBSITE', 'LAUNCHER'] });
        await grpcSocial.presence.setStatus('INVISIBLE');
        const view = await grpcSocial.presence.public('11111111-1111-4111-8111-00000000a001');
        assert.equal(view.status, 'OFFLINE'); assert.deepEqual(view.surfaces, []); assert.deepEqual(view.activity, []);
        assert.equal(view.lastSeenAt, undefined);
        assert.ok(paths.every(path => path.startsWith('/seriuxmod.social.v1.PresenceService/')));
        assert.throws(() => grpcSocial.presence.setStatus('UNKNOWN'));
        assert.deepEqual(Object.keys(grpcSocial.parties), ['overview']);
    } finally {
        for (const [key, descriptor] of Object.entries(original)) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
    }
});

test('chat uses a caller-retained UUID and preserves literal text without transport retries', async () => {
    const original = Object.fromEntries(['fetch', 'sessionStorage'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    const requests = [];
    const text = 'USER_PRESENCE_STATUS_ONLINE <script>literal only</script>';
    const key = '11111111-1111-4111-8111-00000000a003';
    try {
        Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: () => null } });
        Object.defineProperty(globalThis, 'fetch', { configurable: true, value: async (url, init) => {
            assert.equal(new URL(url).pathname, '/seriuxmod.social.v1.SocialChatService/SendMessage');
            const request = fromBinary(SendDirectMessageRequestSchema, new Uint8Array(init.body).subarray(5)); requests.push(request);
            return requests.length === 1 ? response(null, null, 14) : response(DirectMessageSchema, { id: key, text,
                senderUserId: 'alice', recipientUserId: 'bob', clientMessageId: key, sequence: 7n });
        } });
        await assert.rejects(() => grpcSocial.chat.send('bob', text, key), error => error.code === 14);
        assert.equal(requests.length, 1);
        const result = await grpcSocial.chat.send('bob', text, key);
        assert.equal(result.text, text); assert.equal(result.sequence, 7);
        assert.equal(requests[0].clientMessageId, requests[1].clientMessageId);
    } finally {
        for (const [key, descriptor] of Object.entries(original)) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
    }
});

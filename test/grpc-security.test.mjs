import test from 'node:test';
import assert from 'node:assert/strict';
import { create, toBinary, fromBinary } from '@bufbuild/protobuf';
import { AccountSecurityStatusSchema, ChangePasswordRequestSchema, WebAuthnChallengeResponseSchema, WebAuthnFinishRequestSchema,
    SetInitialPasswordRequestSchema, RecoveryCodesSchema, RemovePasskeyRequestSchema } from '../src/gen/seriuxmod/user/v1/account_security_model_pb.js';
import { ListDeviceSessionsResponseSchema, RevokeOtherDeviceSessionsRequestSchema } from '../src/gen/seriuxmod/auth/v1/device_session_model_pb.js';
import { securityApi } from '../src/lib/securityApi.js';

function frame(payload, flags = 0) {
    const result = new Uint8Array(payload.length + 5);
    result[0] = flags; new DataView(result.buffer).setUint32(1, payload.length);
    result.set(payload, 5); return result;
}
function response(schema, data, code = 0) {
    const message = schema ? frame(toBinary(schema, create(schema, data))) : new Uint8Array();
    const trailer = frame(new TextEncoder().encode(`grpc-status: ${code}\r\n`), 128);
    return new Response(new Blob([message, trailer]), { headers: { 'content-type': 'application/grpc-web+proto' } });
}

test('security uses canonical binary gRPC-Web, preserves headers and forwards only bearer auth', async () => {
    const prior = Object.fromEntries(['sessionStorage', 'fetch'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    const token = `fixture.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now()/1000) + 900 })).toString('base64url')}.fixture`;
    let mode = 'status';
    try {
        Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: key => key === 'seriux_access_token' ? token : null } });
        Object.defineProperty(globalThis, 'fetch', { configurable: true, value: async (url, init) => {
            assert.equal(init.credentials, 'omit');
            assert.equal(new Headers(init.headers).get('authorization'), `Bearer ${token}`);
            assert.match(new Headers(init.headers).get('content-type'), /^application\/grpc-web/);
            assert.ok(!new Headers(init.headers).has('cookie'));
            if (mode === 'status') {
                assert.equal(new URL(url).pathname, '/seriuxmod.user.v1.AccountSecurityService/GetStatus');
                return response(AccountSecurityStatusSchema, { passwordConfigured: true, twoFactorEnabled: false });
            }
            if (mode === 'password') {
                assert.equal(new URL(url).pathname, '/seriuxmod.user.v1.AccountSecurityService/ChangePassword');
                const bytes = new Uint8Array(init.body);
                const value = fromBinary(ChangePasswordRequestSchema, bytes.subarray(5));
                assert.equal(value.currentPassword, 'fixture-old');
                assert.equal(value.newPassword, 'fixture-new');
                return response(null, null, 7);
            }
            if (mode === 'passkey-start') return response(WebAuthnChallengeResponseSchema, {
                challengeId: 'fixture-challenge', publicKey: { challenge: 'AQID', rp: { id: 'seriuxmod.net' } }
            });
            const bytes = new Uint8Array(init.body);
            const value = fromBinary(WebAuthnFinishRequestSchema, bytes.subarray(5));
            assert.deepEqual(value.credential, { id: 'fixture', response: { attestationObject: 'AQID' } });
            return response(null, null, 7);
        } });
        const status = await securityApi.status();
        assert.equal(status.passwordConfigured, true);
        assert.equal(status.twoFactorEnabled, false);
        mode = 'password';
        await assert.rejects(() => securityApi.changePassword('fixture-old', 'fixture-new'), error => error.code === 7);
        mode = 'passkey-start';
        const challenge = await securityApi.startPasskeyRegistration('Testdatensatz');
        assert.deepEqual(challenge.publicKey, { challenge: 'AQID', rp: { id: 'seriuxmod.net' } });
        mode = 'passkey-finish';
        await assert.rejects(() => securityApi.finishPasskeyRegistration(challenge.challengeId,
            { id: 'fixture', response: { attestationObject: 'AQID' } }), error => error.code === 7);
    } finally {
        for (const [key, descriptor] of Object.entries(prior)) {
            if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
        }
    }
});

test('passwordless management, once-returned recovery codes and server-derived current devices use explicit gRPC commands', async () => {
    const prior = Object.fromEntries(['sessionStorage', 'fetch'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    try {
        Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: () => null } });
        Object.defineProperty(globalThis, 'fetch', { configurable: true, value: async (url, init) => {
            const method = new URL(url).pathname.split('/').pop();
            const bytes = new Uint8Array(init.body).subarray(5);
            if (method === 'SetInitialPassword') {
                assert.equal(fromBinary(SetInitialPasswordRequestSchema, bytes).newPassword, 'fixture-password');
                return response(null, null, 7);
            }
            if (method === 'GenerateRecoveryCodes') return response(RecoveryCodesSchema, { codes: ['fixture-once-only-code'] });
            if (method === 'RemovePasskey') {
                const request = fromBinary(RemovePasskeyRequestSchema, bytes);
                assert.equal(request.useRecentAuthentication, true); assert.equal(request.verification, undefined);
                return response(null, null, 7);
            }
            if (method === 'ListDeviceSessions') return response(ListDeviceSessionsResponseSchema, {
                currentDeviceId: 'server-device', sessions: [{ deviceId: 'server-device', active: true }, { deviceId: 'other', active: false }]
            });
            assert.equal(method, 'RevokeOtherDeviceSessions');
            assert.equal(fromBinary(RevokeOtherDeviceSessionsRequestSchema, bytes).currentDeviceId, '');
            return response(null, null, 7);
        } });
        await assert.rejects(() => securityApi.setInitialPassword('fixture-password'), reason => reason.code === 7);
        assert.deepEqual(await securityApi.generateRecoveryCodes(), ['fixture-once-only-code']);
        await assert.rejects(() => securityApi.removePasskey('fixture-key', '', '', true), reason => reason.code === 7);
        const devices = await securityApi.devices();
        assert.equal(devices[0].current, true); assert.equal(devices[0].active, true); assert.equal(devices[1].current, false);
        await assert.rejects(() => securityApi.revokeOthers(), reason => reason.code === 7);
    } finally {
        for (const [key, descriptor] of Object.entries(prior)) {
            if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
        }
    }
});

import assert from 'node:assert/strict';
import { create, fromBinary, toBinary } from '@bufbuild/protobuf';

export function frame(payload, flags = 0) {
    const bytes = new Uint8Array(payload.length + 5); bytes[0] = flags;
    new DataView(bytes.buffer).setUint32(1, payload.length); bytes.set(payload, 5); return bytes;
}
export function reply(method, data = {}, code = 0) {
    return new Response(new Blob([...(code ? [] : [frame(toBinary(method.output, create(method.output, data)))]),
        frame(new TextEncoder().encode(`grpc-status: ${code}\r\n`), 128)]), { headers: { 'content-type': 'application/grpc-web+proto' } });
}
export function installPeer() {
    const prior = Object.fromEntries(['fetch', 'sessionStorage'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    const token = `fixture.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now()/1000) + 900 })).toString('base64url')}.fixture`;
    const storage = new Map([['seriux_access_token', token]]);
    let expected = null;
    const paths = [];
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
        getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key)
    } });
    Object.defineProperty(globalThis, 'fetch', { configurable: true, value: async (url, init) => {
        assert.ok(expected, `unexpected request ${url}`);
        const call = expected; expected = null;
        const path = `/${call.service.typeName}/${call.method.name}`;
        assert.equal(new URL(url).pathname, path);
        paths.push(path);
        assert.equal(init.credentials, 'omit');
        const headers = new Headers(init.headers);
        assert.match(headers.get('content-type'), /^application\/grpc-web/);
        assert.equal(headers.get('authorization'), call.public || !storage.has('seriux_access_token') ? null : `Bearer ${token}`);
        const bytes = new Uint8Array(init.body);
        assert.equal(bytes[0], 0); assert.equal(new DataView(bytes.buffer, bytes.byteOffset).getUint32(1), bytes.length - 5);
        assert.deepEqual(fromBinary(call.method.input, bytes.subarray(5)), create(call.method.input, call.request), path);
        return reply(call.method, call.response, call.code);
    } });
    return {
        paths, storage,
        async call(service, method, request, action, response = {}, options = {}) {
            assert.equal(expected, null);
            expected = { service, method: service.method[method], request, response, ...options };
            assert.ok(expected.method, `${service.name}.${method} does not exist`);
            const result = await action();
            assert.equal(expected, null, 'adapter did not send expected RPC');
            return result;
        },
        restore() { for (const [key, descriptor] of Object.entries(prior)) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } }
    };
}

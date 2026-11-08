// Explicit ClaudeTest token via stdin; never prints bearer credentials or modifies accounts.
import assert from 'node:assert/strict';
import { securityApi } from '../src/lib/securityApi.js';
import { userApi } from '../src/lib/userApi.js';
let input = '';
for await (const chunk of process.stdin) input += chunk;
const token = JSON.parse(input).access_token;
const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url'));
assert.equal(claims.sub, '11111111-1111-4111-8111-00000000a001');
assert.equal(typeof claims.sid, 'string');
globalThis.sessionStorage = { getItem: key => key === 'seriux_access_token' ? token : null };
const [status, keys, devices, profile] = await Promise.all([
    securityApi.status(), securityApi.passkeys(), securityApi.devices(), userApi.byUsername('ClaudeTest')
]);
assert.equal(typeof status.passwordConfigured, 'boolean');
assert.equal(profile.username, 'ClaudeTest');
assert.ok(Array.isArray(keys) && Array.isArray(devices));
assert.equal(devices.filter(device => device.current).length, 1);
assert.equal(devices.find(device => device.current).active, true);
assert.equal(status.recoveryCodesRemaining, 0);
await assert.rejects(() => securityApi.setInitialPassword('not-applied-fixture-password'), error => error.code === 7);
console.log('Live gRPC-Web: authenticated security status, passkeys, devices and public profile passed. No mutations.');
sessionStorage.getItem = () => null;
await assert.rejects(() => securityApi.status(), error => error.code === 16);
await assert.rejects(() => securityApi.generateRecoveryCodes(), error => error.code === 16);
await assert.rejects(() => securityApi.setInitialPassword('not-applied-fixture-password'), error => error.code === 16);
console.log('Anonymous security access rejected correctly.');
const route = 'https://rpc.seriuxmod.net/seriuxmod.user.v1.AccountSecurityService/GenerateRecoveryCodes';
const preflight = origin => fetch(route, { method: 'OPTIONS', headers: { Origin: origin,
    'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type,x-grpc-web' } });
const allowed = await preflight('https://seriuxmod.net');
assert.equal(allowed.status, 200); assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://seriuxmod.net');
assert.equal((await preflight('https://untrusted.invalid')).headers.get('access-control-allow-origin'), null);
console.log('Exact new browser RPC routes and trusted/untrusted CORS origins verified.');

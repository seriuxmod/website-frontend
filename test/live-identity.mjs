// Explicit ClaudeTest token via stdin; never prints bearer credentials or modifies accounts.
import assert from 'node:assert/strict';
import { securityApi } from '../src/lib/securityApi.js';
import { userApi } from '../src/lib/userApi.js';
let input = '';
for await (const chunk of process.stdin) input += chunk;
const token = JSON.parse(input).access_token;
const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url'));
assert.equal(claims.sub, '11111111-1111-4111-8111-00000000a001');
globalThis.sessionStorage = { getItem: key => key === 'seriux_access_token' ? token : null };
const [status, keys, devices, profile] = await Promise.all([
    securityApi.status(), securityApi.passkeys(), securityApi.devices(), userApi.byUsername('ClaudeTest')
]);
assert.equal(typeof status.passwordConfigured, 'boolean');
assert.equal(profile.username, 'ClaudeTest');
assert.ok(Array.isArray(keys) && Array.isArray(devices));
console.log('Live gRPC-Web: authenticated security status, passkeys, devices and public profile passed. No mutations.');
sessionStorage.getItem = () => null;
await assert.rejects(() => securityApi.status(), error => error.code === 16);
console.log('Anonymous security access rejected correctly.');

import test from 'node:test';
import assert from 'node:assert/strict';
import { publicProfilePath, safeLoginReturnPath, PERSONAL_PROFILE_PATH, SECURITY_SETTINGS_PATH } from '../src/lib/profileRoutes.js';

test('public profile uses the Minecraft name, never the UUID or a placeholder', () => {
    assert.equal(publicProfilePath({ username: 'RealHosti', playerId: 'fixture-uuid' }), '/@RealHosti');
    assert.equal(publicProfilePath('Second_Player'), '/@Second_Player');
    for (const username of [undefined, '', 'Minecraft Spieler', '../me', 'abc/def', '11111111-1111-4111-8111-00000000a001']) {
        assert.equal(publicProfilePath({ username }), '/me');
    }
});
test('default login lands on public profile while explicit private links stay private', () => {
    const user = { username: 'RealHosti' };
    assert.equal(safeLoginReturnPath(null, user), '/@RealHosti');
    assert.equal(safeLoginReturnPath('/profile', user), '/@RealHosti');
    assert.equal(safeLoginReturnPath('/me', user), PERSONAL_PROFILE_PATH);
    assert.equal(safeLoginReturnPath('/me/settings/security', user), SECURITY_SETTINGS_PATH);
    assert.equal(safeLoginReturnPath('/account/security', user), SECURITY_SETTINGS_PATH);
    assert.equal(safeLoginReturnPath('/store/checkout', user), '/store/checkout');
});
test('login redirect cannot leave this site or loop through OAuth callback', () => {
    for (const value of ['https://evil.test', '//evil.test', '/\\evil.test', '/me\r\nLocation: evil', '/auth/callback?code=secret']) {
        assert.equal(safeLoginReturnPath(value, { username: 'RealHosti' }), '/@RealHosti');
    }
});

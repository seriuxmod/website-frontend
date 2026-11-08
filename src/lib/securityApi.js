import { accountSecurity, deviceSessions, dateValue, identityCall } from './grpc/identityClients.js';

const passkey = value => ({ ...value, registeredAt: dateValue(value.registeredAt), lastUsedAt: dateValue(value.lastUsedAt) });

export const securityApi = {
    status: () => identityCall(() => accountSecurity.getStatus({})),
    changePassword: (currentPassword, newPassword) => identityCall(() => accountSecurity.changePassword({ currentPassword, newPassword })),
    setInitialPassword: newPassword => identityCall(() => accountSecurity.setInitialPassword({ newPassword })),
    generateRecoveryCodes: () => identityCall(async () => (await accountSecurity.generateRecoveryCodes({})).codes),
    setupTotp: () => identityCall(() => accountSecurity.setupTotp({})),
    enableTotp: code => identityCall(() => accountSecurity.enableTotp({ code })),
    disableTotp: (password, code) => identityCall(() => accountSecurity.disableTotp({ password, code })),
    passkeys: () => identityCall(async () => (await accountSecurity.listPasskeys({})).passkeys.map(passkey)),
    startPasskeyRegistration: name => identityCall(async () => {
        const result = await accountSecurity.startPasskeyRegistration({ name });
        return { challengeId: result.challengeId, publicKey: result.publicKey };
    }),
    finishPasskeyRegistration: (challengeId, credential) => identityCall(() => accountSecurity.finishPasskeyRegistration({
        challengeId, credential
    })),
    removePasskey: (credentialId, password, code, useRecentAuthentication = false) => identityCall(() => accountSecurity.removePasskey({
        credentialId, ...(useRecentAuthentication ? { useRecentAuthentication: true } : { verification: { password, ...(code ? { code } : {}) } })
    })),
    devices: () => identityCall(async () => {
        const response = await deviceSessions.listDeviceSessions({});
        return response.sessions.map(value => ({ ...value, current: value.deviceId === response.currentDeviceId,
            firstSeenAt: dateValue(value.firstSeenAt), lastSeenAt: dateValue(value.lastSeenAt), revokedAt: dateValue(value.revokedAt) }));
    }),
    revokeDevice: deviceId => identityCall(() => deviceSessions.revokeDeviceSession({ deviceId })),
    revokeOthers: () => identityCall(() => deviceSessions.revokeOtherDeviceSessions({}))
};

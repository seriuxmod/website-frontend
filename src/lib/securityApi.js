import { accountSecurity, deviceSessions, dateValue, identityCall } from './grpc/identityClients.js';

const passkey = value => ({ ...value, registeredAt: dateValue(value.registeredAt), lastUsedAt: dateValue(value.lastUsedAt) });
const unsupportedRecovery = () => Promise.reject(new Error('Eine E-Mail-Wiederherstellung ist nicht eingerichtet. Bestehende Konten können nicht über den Launcher zurückgesetzt werden.'));

export const securityApi = {
    status: () => identityCall(() => accountSecurity.getStatus({})),
    changePassword: (currentPassword, newPassword) => identityCall(() => accountSecurity.changePassword({ currentPassword, newPassword })),
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
    removePasskey: (credentialId, password, code) => identityCall(() => accountSecurity.removePasskey({
        credentialId, verification: { password, ...(code ? { code } : {}) }
    })),
    devices: () => identityCall(async () => (await deviceSessions.listDeviceSessions({})).sessions.map(value => ({
        ...value, firstSeenAt: dateValue(value.firstSeenAt), lastSeenAt: dateValue(value.lastSeenAt), revokedAt: dateValue(value.revokedAt)
    }))),
    revokeDevice: deviceId => identityCall(() => deviceSessions.revokeDeviceSession({ deviceId })),
    requestPasswordReset: unsupportedRecovery,
    confirmPasswordReset: unsupportedRecovery,
    verifyEmail: unsupportedRecovery
};

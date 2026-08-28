import { authenticatedFetch } from './auth';

const USER_SECURITY_API = 'https://api.seriuxmod.net/api/v1/user/account/security';
const AUTH_SECURITY_API = 'https://auth.seriuxmod.net/api/security';

async function request(url, options = {}) {
    const response = await authenticatedFetch(url, {
        ...options,
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...(options.headers || {})
        }
    });
    if (response.status === 204) return null;
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(payload.message || payload.detail || 'Die Sicherheitsanfrage ist fehlgeschlagen.');
        error.status = response.status;
        throw error;
    }
    return payload;
}

export const securityApi = {
    status: () => request(USER_SECURITY_API),
    changePassword: (currentPassword, newPassword) =>
        request(`${USER_SECURITY_API}/password`, {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        }),
    requestPasswordReset: (email) =>
        request('https://api.seriuxmod.net/api/v1/user/account/website/password-reset/request', {
            method: 'POST',
            body: JSON.stringify({ email })
        }),
    setupTotp: () => request(`${USER_SECURITY_API}/totp/setup`, { method: 'POST' }),
    enableTotp: (code) =>
        request(`${USER_SECURITY_API}/totp/enable`, { method: 'POST', body: JSON.stringify({ code }) }),
    disableTotp: (password, code) =>
        request(`${USER_SECURITY_API}/totp`, { method: 'DELETE', body: JSON.stringify({ password, code }) }),
    devices: () => request(`${AUTH_SECURITY_API}/devices`),
    revokeDevice: (deviceId) =>
        request(`${AUTH_SECURITY_API}/devices/${encodeURIComponent(deviceId)}`, { method: 'DELETE' })
};

import { authenticatedFetch } from './auth';

const API = 'https://api.seriuxmod.net/api/v1/user';

async function request(path, options = {}) {
    const response = await authenticatedFetch(`${API}${path}`, {
        ...options,
        headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }
    });
    if (response.status === 204) return null;
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(payload.message || payload.detail || `Anfrage fehlgeschlagen (${response.status})`);
        error.status = response.status;
        throw error;
    }
    return payload;
}

const json = (method, body) => ({ method, body: JSON.stringify(body) });

export const userAdminApi = {
    users: (query = '', page = 0, size = 30) => request(`/users?q=${encodeURIComponent(query)}&page=${page}&size=${size}`),
    user: (id) => request(`/users/${encodeURIComponent(id)}`),
    lock: (id, locked, reason) => request(`/users/${encodeURIComponent(id)}/lock`, json('PATCH', { locked, reason })),
    permissions: (id) => request(`/permissions/users/${encodeURIComponent(id)}`),
    setDirectPermissions: (id, permissions) =>
        request(`/permissions/users/${encodeURIComponent(id)}/direct`, json('PUT', { permissions })),
    assignGroup: (id, assignment) =>
        request(`/permissions/users/${encodeURIComponent(id)}/groups`, json('POST', assignment)),
    removeGroup: (id, key) =>
        request(`/permissions/users/${encodeURIComponent(id)}/groups/${encodeURIComponent(key)}`, { method: 'DELETE' }),
    groups: () => request('/permissions/groups'),
    createGroup: (group) => request('/permissions/groups', json('POST', group)),
    updateGroup: (key, group) => request(`/permissions/groups/${encodeURIComponent(key)}`, json('PUT', group)),
    deleteGroup: (key) => request(`/permissions/groups/${encodeURIComponent(key)}`, { method: 'DELETE' }),
    audits: (id, page = 0) => request(`/users/${encodeURIComponent(id)}/audits?page=${page}&size=30`),
    banReasons: () => request('/bans/reasons?page=0&size=100'),
    saveBanReason: (reason, existing = false) =>
        request(`/bans/reasons${existing ? `/${encodeURIComponent(reason.key)}` : ''}`, json(existing ? 'PUT' : 'POST', reason)),
    deleteBanReason: (key) => request(`/bans/reasons/${encodeURIComponent(key)}`, { method: 'DELETE' }),
    ban: (value) => request('/bans', json('POST', value)),
    activeBan: (id) => request(`/bans/users/${encodeURIComponent(id)}`),
    revokeBan: (id, note = '') => request(`/bans/${encodeURIComponent(id)}?note=${encodeURIComponent(note)}`, { method: 'DELETE' }),
    banHistory: (id) => request(`/bans/users/${encodeURIComponent(id)}/history?page=0&size=30`),
    muteReasons: () => request('/mutes/reasons?page=0&size=100'),
    saveMuteReason: (reason, existing = false) =>
        request(`/mutes/reasons${existing ? `/${encodeURIComponent(reason.key)}` : ''}`, json(existing ? 'PUT' : 'POST', reason)),
    deleteMuteReason: (key) => request(`/mutes/reasons/${encodeURIComponent(key)}`, { method: 'DELETE' }),
    mute: (value) => request('/mutes', json('POST', value)),
    activeMute: (id) => request(`/mutes/users/${encodeURIComponent(id)}`),
    revokeMute: (id, note = '') => request(`/mutes/${encodeURIComponent(id)}?note=${encodeURIComponent(note)}`, { method: 'DELETE' }),
    muteHistory: (id) => request(`/mutes/users/${encodeURIComponent(id)}/history?page=0&size=30`)
};

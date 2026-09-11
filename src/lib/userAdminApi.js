import { authenticatedFetch } from './auth';

const USER_API = 'https://api.seriuxmod.net/api/v1/user';

async function request(path, options = {}) {
    const response = await authenticatedFetch(`${USER_API}${path}`, {
        ...options,
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...(options.headers || {})
        }
    });
    if (response.status === 204) return null;

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('json')
        ? await response.json().catch(() => ({}))
        : await response.text().catch(() => '');
    if (!response.ok) {
        const error = new Error(
            (typeof payload === 'object' && (payload.message || payload.detail || payload.error)) ||
                (typeof payload === 'string' && payload.trim()) ||
                `Die User-Anfrage ist fehlgeschlagen (${response.status}).`
        );
        error.status = response.status;
        error.code = typeof payload === 'object' ? payload.code || payload.error : undefined;
        error.payload = payload;
        throw error;
    }
    return payload;
}

function query(values) {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) params.set(key, String(value));
    });
    return params.toString();
}

const json = (method, body, headers) => ({ method, headers, body: JSON.stringify(body) });
const encoded = (value) => encodeURIComponent(value);

function caseList(type, filters = {}) {
    return request(
        `/admin/moderation/${type}?${query({
            q: filters.q || '',
            status: filters.status || '',
            reasonKey: filters.reasonKey || '',
            page: filters.page ?? 0,
            size: filters.size ?? 30,
            sort: filters.sort || 'createdAt',
            direction: filters.direction || 'desc'
        })}`
    );
}

function createCase(type, body, idempotencyKey) {
    return request(
        `/admin/moderation/${type}`,
        json('POST', body, idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined)
    );
}

function saveReason(type, reason, existing = false) {
    const collection = type === 'ban' ? 'ban-reasons' : 'mute-reasons';
    const path = existing
        ? `/admin/moderation/settings/${collection}/${encoded(reason.key)}`
        : `/admin/moderation/settings/${collection}`;
    return request(path, json(existing ? 'PUT' : 'POST', reason));
}

export const userAdminApi = {
    // Compatibility for AdminDashboard, whose response also contains onlineUsers/onlineStaff.
    overview: () => request('/users/admin/overview'),
    dashboardOverview: () => request('/users/admin/overview'),

    playersOverview: (days = 30) => request(`/admin/players/overview?days=${encoded(days)}`),
    players: ({
        q = '',
        locked = '',
        websiteAccessEnabled = '',
        twoFactorEnabled = '',
        groupKey = '',
        page = 0,
        size = 30,
        sort = 'createdDate',
        direction = 'desc'
    } = {}) =>
        request(
            `/admin/players?${query({
                q,
                locked,
                websiteAccessEnabled,
                twoFactorEnabled,
                groupKey,
                page,
                size,
                sort,
                direction
            })}`
        ),
    player: (userId) => request(`/admin/players/${encoded(userId)}`),
    playerAudits: (userId, page = 0, size = 30) =>
        request(`/admin/players/${encoded(userId)}/audits?${query({ page, size })}`),
    setPlayerLocked: (userId, locked, reason = '') =>
        request(`/admin/players/${encoded(userId)}/lock`, json('PATCH', { locked, reason: reason || null })),
    setDirectPermissions: (userId, permissions) =>
        request(`/admin/players/${encoded(userId)}/permissions/direct`, json('PUT', { permissions })),
    assignGroup: (userId, assignment) =>
        request(`/admin/players/${encoded(userId)}/permissions/groups`, json('POST', assignment)),
    removeGroup: (userId, groupKey) =>
        request(`/admin/players/${encoded(userId)}/permissions/groups/${encoded(groupKey)}`, { method: 'DELETE' }),

    permissionsOverview: () => request('/admin/permissions/overview'),
    permissionGroups: () => request('/admin/permissions/groups'),
    permissionGroup: (key) => request(`/admin/permissions/groups/${encoded(key)}`),
    permissionCatalog: () => request('/admin/permissions/catalog'),
    createPermissionGroup: (group) => request('/admin/permissions/groups', json('POST', group)),
    updatePermissionGroup: (key, group) => request(`/admin/permissions/groups/${encoded(key)}`, json('PUT', group)),
    deletePermissionGroup: (key, version) =>
        request(`/admin/permissions/groups/${encoded(key)}?version=${encoded(version)}`, { method: 'DELETE' }),

    moderationOverview: (days = 30) => request(`/admin/moderation/overview?days=${encoded(days)}`),
    bans: (filters) => caseList('bans', filters),
    banCase: (id) => request(`/admin/moderation/bans/${encoded(id)}`),
    banCaseHistory: (id, page = 0, size = 30) =>
        request(`/admin/moderation/bans/${encoded(id)}/history?${query({ page, size })}`),
    createBan: (body, idempotencyKey) => createCase('bans', body, idempotencyKey),
    revokeBan: (id, note = '') =>
        request(`/admin/moderation/bans/${encoded(id)}?${query({ note })}`, { method: 'DELETE' }),
    mutes: (filters) => caseList('mutes', filters),
    muteCase: (id) => request(`/admin/moderation/mutes/${encoded(id)}`),
    muteCaseHistory: (id, page = 0, size = 30) =>
        request(`/admin/moderation/mutes/${encoded(id)}/history?${query({ page, size })}`),
    createMute: (body, idempotencyKey) => createCase('mutes', body, idempotencyKey),
    revokeMute: (id, note = '') =>
        request(`/admin/moderation/mutes/${encoded(id)}?${query({ note })}`, { method: 'DELETE' }),
    moderationAudit: ({ type = '', action = '', actorId = '', page = 0, size = 30 } = {}) =>
        request(`/admin/moderation/audit?${query({ type, action, actorId, page, size })}`),
    moderationSettings: () => request('/admin/moderation/settings'),
    saveBanReason: (reason, existing = false) => saveReason('ban', reason, existing),
    saveMuteReason: (reason, existing = false) => saveReason('mute', reason, existing),
    deleteBanReason: async (key, version) => {
        const resolvedVersion =
            version ??
            (await userAdminApi.moderationSettings())?.banReasons?.find((reason) => reason.key === key)?.version;
        if (resolvedVersion == null) throw new Error('Die Version des Ban-Grunds konnte nicht ermittelt werden.');
        return request(`/admin/moderation/settings/ban-reasons/${encoded(key)}?version=${encoded(resolvedVersion)}`, {
            method: 'DELETE'
        });
    },
    deleteMuteReason: async (key, version) => {
        const resolvedVersion =
            version ??
            (await userAdminApi.moderationSettings())?.muteReasons?.find((reason) => reason.key === key)?.version;
        if (resolvedVersion == null) throw new Error('Die Version des Mute-Grunds konnte nicht ermittelt werden.');
        return request(`/admin/moderation/settings/mute-reasons/${encoded(key)}?version=${encoded(resolvedVersion)}`, {
            method: 'DELETE'
        });
    }
};

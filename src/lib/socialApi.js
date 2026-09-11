import { authenticatedFetch } from './auth';

const SOCIAL_API = 'https://api.seriuxmod.net/api/v1/social';

async function request(path, options = {}, authenticated = true) {
    const execute = authenticated ? authenticatedFetch : fetch;
    const response = await execute(`${SOCIAL_API}${path}`, {
        ...options,
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...(options.headers || {})
        }
    });
    if (response.status === 204) return null;
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(
            payload.message || payload.detail || 'Die Social-Anfrage konnte nicht verarbeitet werden.'
        );
        error.status = response.status;
        error.code = payload.error || payload.code;
        throw error;
    }
    return payload;
}

export const socialApi = {
    presence: {
        heartbeat: () => request('/presence/heartbeat', { method: 'POST' }),
        public: (userId, days = 112, signal) =>
            request(`/public/profiles/${encodeURIComponent(userId)}/presence?days=${days}`, { signal }, false)
    },
    profiles: {
        friends: (userId, limit = 100, signal) =>
            request(`/public/profiles/${encodeURIComponent(userId)}/friends?limit=${limit}`, { signal }, false)
    },
    clans: {
        public: (query = '', page = 0, size = 20, signal) =>
            request(`/public/clans?query=${encodeURIComponent(query)}&page=${page}&size=${size}`, { signal }, false),
        publicById: (clanId) => request(`/public/clans/${encodeURIComponent(clanId)}`, {}, false),
        publicMembers: (clanId) => request(`/public/clans/${encodeURIComponent(clanId)}/members`, {}, false),
        mine: () => request('/clans/me'),
        create: (body) => request('/clans', { method: 'POST', body: JSON.stringify(body) }),
        update: (clanId, body) =>
            request(`/clans/${encodeURIComponent(clanId)}`, { method: 'PUT', body: JSON.stringify(body) }),
        remove: (clanId) => request(`/clans/${encodeURIComponent(clanId)}`, { method: 'DELETE' }),
        leave: (clanId) => request(`/clans/${encodeURIComponent(clanId)}/leave`, { method: 'POST' }),
        members: (clanId) => request(`/clans/${encodeURIComponent(clanId)}/members`),
        kick: (clanId, userId) =>
            request(`/clans/${encodeURIComponent(clanId)}/members/${encodeURIComponent(userId)}/kick`, {
                method: 'POST'
            }),
        changeRank: (clanId, userId, rankKey) =>
            request(
                `/clans/${encodeURIComponent(clanId)}/members/${encodeURIComponent(userId)}/rank?rankKey=${encodeURIComponent(rankKey)}`,
                { method: 'POST' }
            ),
        ranks: (clanId) => request(`/clans/${encodeURIComponent(clanId)}/ranks`),
        createRank: (clanId, body) =>
            request(`/clans/${encodeURIComponent(clanId)}/ranks`, {
                method: 'POST',
                body: JSON.stringify(body)
            }),
        updateRank: (clanId, rankKey, body) =>
            request(`/clans/${encodeURIComponent(clanId)}/ranks/${encodeURIComponent(rankKey)}`, {
                method: 'PUT',
                body: JSON.stringify(body)
            }),
        invite: (clanId, userId) =>
            request(`/clans/${encodeURIComponent(clanId)}/invites/${encodeURIComponent(userId)}`, {
                method: 'POST'
            }),
        requestJoin: (clanId) => request(`/clans/${encodeURIComponent(clanId)}/requests`, { method: 'POST' }),
        invites: () => request('/clans/invites'),
        requests: (clanId) => request(`/clans/${encodeURIComponent(clanId)}/requests`),
        acceptInvite: (inviteId) =>
            request(`/clans/invites/${encodeURIComponent(inviteId)}/accept`, { method: 'POST' }),
        declineInvite: (inviteId) =>
            request(`/clans/invites/${encodeURIComponent(inviteId)}/decline`, { method: 'POST' })
    },
    friends: {
        list: () => request('/friends'),
        requests: () => request('/friends/requests'),
        send: (receiverUserId) =>
            request('/friends/requests', {
                method: 'POST',
                body: JSON.stringify({ receiverUserId })
            }),
        accept: (requestId) => request(`/friends/requests/${encodeURIComponent(requestId)}/accept`, { method: 'POST' }),
        decline: (requestId) =>
            request(`/friends/requests/${encodeURIComponent(requestId)}/decline`, { method: 'POST' }),
        remove: (friendUserId) => request(`/friends/${encodeURIComponent(friendUserId)}`, { method: 'DELETE' })
    },
    parties: {
        mine: () => request('/parties/me'),
        get: (partyId) => request(`/parties/${encodeURIComponent(partyId)}`),
        create: (body) => request('/parties', { method: 'POST', body: JSON.stringify(body) }),
        update: (partyId, body) =>
            request(`/parties/${encodeURIComponent(partyId)}`, { method: 'PUT', body: JSON.stringify(body) }),
        disband: (partyId) => request(`/parties/${encodeURIComponent(partyId)}`, { method: 'DELETE' }),
        join: (partyId) => request(`/parties/${encodeURIComponent(partyId)}/join`, { method: 'POST' }),
        leave: (partyId) => request(`/parties/${encodeURIComponent(partyId)}/leave`, { method: 'POST' }),
        members: (partyId) => request(`/parties/${encodeURIComponent(partyId)}/members`),
        kick: (partyId, userId) =>
            request(`/parties/${encodeURIComponent(partyId)}/kick/${encodeURIComponent(userId)}`, {
                method: 'POST'
            }),
        changeRank: (partyId, userId, rankKey) =>
            request(
                `/parties/${encodeURIComponent(partyId)}/promote/${encodeURIComponent(userId)}?rankKey=${encodeURIComponent(rankKey)}`,
                { method: 'POST' }
            ),
        invite: (partyId, userId) =>
            request(`/parties/${encodeURIComponent(partyId)}/invite/${encodeURIComponent(userId)}`, {
                method: 'POST'
            }),
        invites: () => request('/parties/invites'),
        acceptInvite: (inviteId) =>
            request(`/parties/invites/${encodeURIComponent(inviteId)}/accept`, { method: 'POST' }),
        declineInvite: (inviteId) =>
            request(`/parties/invites/${encodeURIComponent(inviteId)}/decline`, { method: 'POST' }),
        history: (partyId, page = 0, size = 20) =>
            request(`/parties/${encodeURIComponent(partyId)}/history?page=${page}&size=${size}`),
        ranks: () => request('/parties/ranks')
    },
    admin: {
        friendsOverview: () => request('/admin/friends/overview'),
        friendships: ({ q = '', page = 0, size = 25 } = {}) =>
            request(`/admin/friends?${adminParams({ q, page, size })}`),
        friendship: (id) => request(`/admin/friends/${encodeURIComponent(id)}`),
        removeFriendship: (id, reason) =>
            request(`/admin/friends/${encodeURIComponent(id)}?reason=${encodeURIComponent(reason)}`, {
                method: 'DELETE'
            }),
        friendRequests: ({ q = '', status = '', page = 0, size = 25 } = {}) =>
            request(`/admin/friends/requests?${adminParams({ q, status, page, size })}`),
        updateFriendRequest: (id, status, reason) =>
            request(`/admin/friends/requests/${encodeURIComponent(id)}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status, reason })
            }),
        clansOverview: () => request('/admin/clans/overview'),
        clans: ({ q = '', status = '', page = 0, size = 25 } = {}) =>
            request(`/admin/clans?${adminParams({ q, status, page, size })}`),
        clan: (id) => request(`/admin/clans/${encodeURIComponent(id)}`),
        updateClanStatus: (id, status, reason = '') =>
            request(`/admin/clans/${encodeURIComponent(id)}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status, reason: reason || null })
            }),
        partiesOverview: () => request('/admin/parties/overview'),
        parties: ({ q = '', status = '', page = 0, size = 25 } = {}) =>
            request(`/admin/parties?${adminParams({ q, status, page, size })}`),
        party: (id) => request(`/admin/parties/${encodeURIComponent(id)}`),
        disbandParty: (id, reason) =>
            request(`/admin/parties/${encodeURIComponent(id)}:disband`, {
                method: 'POST',
                body: JSON.stringify({ reason })
            }),
        auditLogs: ({ q = '', action = '', entityType = '', page = 0, size = 25 } = {}) =>
            request(`/admin/audit-logs?${adminParams({ q, action, entityType, page, size })}`),
        serversOverview: () => request('/admin/servers/overview'),
        servers: ({ q = '', category = '', status = '', page = 0, size = 25 } = {}) =>
            request(`/admin/servers?${adminParams({ q, category, status, page, size })}`),
        server: (id) => request(`/admin/servers/${encodeURIComponent(id)}`),
        saveServer: (id, body) =>
            request(id ? `/admin/servers/${encodeURIComponent(id)}` : '/admin/servers', {
                method: id ? 'PUT' : 'POST',
                body: JSON.stringify(body)
            }),
        updateServerStatus: (id, status, reviewNote = '') =>
            request(`/admin/servers/${encodeURIComponent(id)}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status, reviewNote: reviewNote || null })
            }),
        deleteServer: (id, reason) =>
            request(`/admin/servers/${encodeURIComponent(id)}?reason=${encodeURIComponent(reason)}`, {
                method: 'DELETE'
            })
    }
};

function adminParams(values) {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) params.set(key, String(value));
    });
    return params.toString();
}

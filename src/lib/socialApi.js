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
    }
};

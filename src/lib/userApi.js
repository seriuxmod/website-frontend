const USER_API = 'https://api.seriuxmod.net/api/v1/user/public/users';

async function request(path, options = {}) {
    const response = await fetch(`${USER_API}${path}`, options);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(payload.message || 'Das Spielerprofil konnte nicht geladen werden.');
        error.status = response.status;
        throw error;
    }
    return payload;
}

export const userApi = {
    byId: (playerId, signal) => request(`/${encodeURIComponent(playerId)}`, { signal }),
    batch: (playerIds, signal) =>
        playerIds?.length
            ? request(`/batch?ids=${playerIds.map(encodeURIComponent).join(',')}`, { signal })
            : Promise.resolve([]),
    byUsername: (username, signal) => request(`/by-name/${encodeURIComponent(username)}`, { signal }),
    search: (query, limit = 8, signal) => request(`/search?q=${encodeURIComponent(query)}&limit=${limit}`, { signal })
};

export function playerAvatar(playerId, size = 96) {
    return `https://mc-heads.net/avatar/${encodeURIComponent(playerId || 'Steve')}/${size}`;
}

export function playerBody(username) {
    return `https://nmsr.nickac.dev/fullbody/${encodeURIComponent(username || 'Steve')}`;
}

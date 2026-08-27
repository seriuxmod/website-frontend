import { authenticatedFetch } from './auth';

const API = 'https://api.seriuxmod.net/api/v1';
const FORUM_API = `${API}/forum`;
const profileCache = new Map();

async function request(path, options = {}) {
    const response = await authenticatedFetch(`${FORUM_API}${path}`, {
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
            payload.message || payload.error_description || 'Die Forum-Anfrage ist fehlgeschlagen.'
        );
        error.status = response.status;
        throw error;
    }
    return payload;
}

export const forumApi = {
    tree: () => request('/tree'),
    latest: (page = 0, size = 10) => request(`/latest?page=${page}&size=${size}`),
    forum: (forumId) => request(`/forums/${encodeURIComponent(forumId)}`),
    topics: (forumId, page = 0, size = 20) =>
        request(`/forums/${encodeURIComponent(forumId)}/topics?page=${page}&size=${size}`),
    topic: (topicId, incrementViews = true) =>
        request(`/topics/${encodeURIComponent(topicId)}?incrementViews=${incrementViews}`),
    posts: (topicId, page = 0, size = 20) =>
        request(`/topics/${encodeURIComponent(topicId)}/posts?page=${page}&size=${size}`),
    labels: (forumId) => request(`/public/labels${forumId ? `?forumId=${encodeURIComponent(forumId)}` : ''}`),
    search: (query) => request(`/search?q=${encodeURIComponent(query)}&topicsLimit=30&postsLimit=30`),
    createTopic: (forumId, body) =>
        request(`/forums/${encodeURIComponent(forumId)}/topics`, { method: 'POST', body: JSON.stringify(body) }),
    reply: (topicId, content) =>
        request(`/topics/${encodeURIComponent(topicId)}/posts`, {
            method: 'POST',
            body: JSON.stringify({ content })
        }),
    updateTopic: (topicId, body) =>
        request(`/topics/${encodeURIComponent(topicId)}`, { method: 'PATCH', body: JSON.stringify(body) }),
    updatePost: (postId, content) =>
        request(`/posts/${encodeURIComponent(postId)}`, {
            method: 'PATCH',
            body: JSON.stringify({ content })
        }),
    deleteTopic: (topicId) => request(`/topics/${encodeURIComponent(topicId)}`, { method: 'DELETE' }),
    deletePost: (postId) => request(`/posts/${encodeURIComponent(postId)}`, { method: 'DELETE' }),
    lockTopic: (topicId, locked) =>
        request(`/topics/${encodeURIComponent(topicId)}:${locked ? 'lock' : 'unlock'}`, { method: 'POST' }),
    stickTopic: (topicId, sticky) =>
        request(`/topics/${encodeURIComponent(topicId)}:${sticky ? 'stick' : 'unstick'}`, { method: 'POST' }),
    react: (postId, reactionId) =>
        request(`/posts/${encodeURIComponent(postId)}/reactions`, {
            method: 'POST',
            body: JSON.stringify({ reactionId })
        }),
    unreact: (postId, reactionId) =>
        request(`/posts/${encodeURIComponent(postId)}/reactions/${encodeURIComponent(reactionId)}`, {
            method: 'DELETE'
        }),
    toggleFollow: (topicId) => request(`/topics/${encodeURIComponent(topicId)}/follow`, { method: 'POST' }),
    following: () => request('/me/following'),
    report: (body) => request('/reports', { method: 'POST', body: JSON.stringify(body) }),
    admin: {
        nodes: () => request('/admin/nodes'),
        createNode: (body) => request('/admin/nodes', { method: 'POST', body: JSON.stringify(body) }),
        updateNode: (nodeId, body) =>
            request(`/admin/nodes/${encodeURIComponent(nodeId)}`, { method: 'PUT', body: JSON.stringify(body) }),
        permissions: (forumId) => request(`/admin/nodes/${encodeURIComponent(forumId)}/permissions`),
        savePermission: (forumId, body) =>
            request(`/admin/nodes/${encodeURIComponent(forumId)}/permissions`, {
                method: 'PUT',
                body: JSON.stringify(body)
            }),
        deletePermission: (forumId, groupId) =>
            request(`/admin/nodes/${encodeURIComponent(forumId)}/permissions/${encodeURIComponent(groupId)}`, {
                method: 'DELETE'
            }),
        settings: () => request('/admin/settings'),
        saveSettings: (body) => request('/admin/settings', { method: 'PATCH', body: JSON.stringify(body) }),
        labels: () => request('/admin/labels'),
        labelTypes: () => request('/admin/labels/types'),
        saveLabel: (labelId, body) =>
            request(`/admin/labels/${encodeURIComponent(labelId)}`, { method: 'PUT', body: JSON.stringify(body) })
    }
};

export async function getPublicUser(playerId) {
    if (!playerId)
        return { playerId: '', username: 'Unbekannter Spieler', avatarUrl: 'https://mc-heads.net/avatar/Steve/64' };
    if (profileCache.has(playerId)) return profileCache.get(playerId);
    const pending = fetch(`${API}/user/public/users/${encodeURIComponent(playerId)}`)
        .then((response) => (response.ok ? response.json() : Promise.reject()))
        .then((profile) => ({
            ...profile,
            avatarUrl: `https://mc-heads.net/avatar/${encodeURIComponent(profile.playerId || playerId)}/64`
        }))
        .catch(() => ({
            playerId,
            username: `${playerId.slice(0, 8)}…`,
            avatarUrl: `https://mc-heads.net/avatar/${encodeURIComponent(playerId)}/64`
        }));
    profileCache.set(playerId, pending);
    return pending;
}

export async function getPermissionGroups() {
    const response = await authenticatedFetch(`${API}/user/permissions/groups`);
    if (!response.ok) throw new Error('Benutzergruppen konnten nicht geladen werden.');
    return response.json();
}

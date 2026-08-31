import { authenticatedFetch } from './auth';

const BASE = 'https://api.seriuxmod.net/api/v1/forum';

async function request(path, options = {}) {
    const response = await authenticatedFetch(`${BASE}${path}`, {
        ...options,
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...(options.headers || {})
        }
    });
    if (response.status === 204) return null;
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(payload.message || payload.error || 'Die Community-Anfrage ist fehlgeschlagen.');
        error.status = response.status;
        throw error;
    }
    return payload;
}

export const blogApi = {
    list: ({ page = 0, size = 20, status = '', category = '', query = '' } = {}) => {
        const params = new URLSearchParams({ page: String(page), size: String(size) });
        if (status) params.set('status', status);
        if (category) params.set('category', category);
        if (query) params.set('q', query);
        return request(`/blog/posts?${params}`);
    },
    bySlug: (slug) => request(`/blog/posts/slug/${encodeURIComponent(slug)}`),
    create: (body) => request('/blog/posts', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/blog/posts/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
    publish: (id) => request(`/blog/posts/${encodeURIComponent(id)}:publish`, { method: 'POST' }),
    unpublish: (id) => request(`/blog/posts/${encodeURIComponent(id)}:unpublish`, { method: 'POST' }),
    remove: (id) => request(`/blog/posts/${encodeURIComponent(id)}`, { method: 'DELETE' })
};

export const suggestionsApi = {
    list: ({ open = true, category = '', status = '', limit = 100 } = {}) => {
        const params = new URLSearchParams({ open: String(open), limit: String(limit) });
        if (category) params.set('category', category);
        if (status) params.set('status', status);
        return request(`/suggestions?${params}`);
    },
    get: (id) => request(`/suggestions/${encodeURIComponent(id)}`),
    create: (body) => request('/suggestions', { method: 'POST', body: JSON.stringify(body) }),
    vote: (id, type, enabled = true) =>
        request(`/suggestions/${encodeURIComponent(id)}/${type}`, {
            method: 'POST',
            body: JSON.stringify({ [type]: enabled })
        }),
    comments: (id) => request(`/suggestions/${encodeURIComponent(id)}/comments`),
    comment: (id, content) =>
        request(`/suggestions/${encodeURIComponent(id)}/comment`, {
            method: 'POST',
            body: JSON.stringify({ content })
        }),
    categories: () => request('/suggestions/categories'),
    statuses: () => request('/suggestions/statuses'),
    admin: {
        list: () => request('/admin/suggestions'),
        patch: (id, body) =>
            request(`/admin/suggestions/${encodeURIComponent(id)}`, {
                method: 'PATCH',
                body: JSON.stringify(body)
            }),
        categories: () => request('/admin/suggestions/categories'),
        saveCategory: (id, body) =>
            request(`/admin/suggestions/categories/${encodeURIComponent(id)}`, {
                method: 'PUT',
                body: JSON.stringify(body)
            }),
        statuses: () => request('/admin/suggestions/statuses'),
        saveStatus: (id, body) =>
            request(`/admin/suggestions/statuses/${encodeURIComponent(id)}`, {
                method: 'PUT',
                body: JSON.stringify(body)
            })
    }
};

import { authenticatedFetch } from './auth';

const API = 'https://api.seriuxmod.net/api/v1/status';

async function request(path, options = {}) {
    const response = await authenticatedFetch(`${API}${path}`, {
        cache: 'no-store',
        ...options,
        headers: { Accept: 'application/json', ...(options.headers || {}) }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(
            payload.message || payload.detail || `Status-Anfrage fehlgeschlagen (${response.status})`
        );
        error.status = response.status;
        throw error;
    }
    return payload;
}

export const statusAdminApi = {
    summary: (signal) => request('/admin/summary', { signal }),
    scaleService: (serviceName, replicas) =>
        request(`/admin/services/${encodeURIComponent(serviceName)}/replicas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ replicas })
        })
};

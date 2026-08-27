import { authenticatedFetch } from './auth';

const STORE_API = 'https://api.seriuxmod.net/api/v1/store';

async function request(path, options = {}, authenticated = false) {
    const execute = authenticated ? authenticatedFetch : fetch;
    const response = await execute(`${STORE_API}${path}`, {
        ...options,
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...(options.headers || {})
        }
    });
    if (response.status === 204) return null;
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(payload.message || payload.detail || 'Die Store-Anfrage ist fehlgeschlagen.');
        error.status = response.status;
        throw error;
    }
    return payload;
}

export const storeApi = {
    config: () => request('/config'),
    categories: () => request('/categories'),
    products: (categoryId = '') =>
        request(
            `/products?description=true&fields=true${categoryId ? `&categoryId=${encodeURIComponent(categoryId)}` : ''}`
        ),
    billingProfile: () => request('/me/billing-profile', {}, true),
    updateBillingProfile: (profile) =>
        request('/me/billing-profile', { method: 'PUT', body: JSON.stringify(profile) }, true),
    createOrder: (order) => request('/orders', { method: 'POST', body: JSON.stringify(order) }, true),
    orders: (page = 0, size = 20) => request(`/orders?page=${page}&size=${size}`, {}, true),
    order: (orderId) => request(`/orders/${encodeURIComponent(orderId)}`, {}, true),
    createPayment: (orderId, gatewayId) =>
        request('/payments', { method: 'POST', body: JSON.stringify({ orderId, gatewayId }) }, true),
    payments: (page = 0, size = 20) => request(`/payments?page=${page}&size=${size}`, {}, true),
    entitlements: () => request('/entitlements', {}, true),
    credits: () => request('/me/credits', {}, true)
};

export const formatStorePrice = (cents, currency = 'EUR') =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format((cents || 0) / 100);

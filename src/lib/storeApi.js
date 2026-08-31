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
    createPayment: (orderId, gatewayId, paymentMethodId) =>
        request(
            '/payments',
            { method: 'POST', body: JSON.stringify({ orderId, gatewayId, paymentMethodId }) },
            true
        ),
    payments: (page = 0, size = 20) => request(`/payments?page=${page}&size=${size}`, {}, true),
    entitlements: () => request('/entitlements', {}, true),
    credits: () => request('/me/credits', {}, true),
    admin: {
        overview: () => request('/admin/overview', {}, true),
        settings: () => request('/admin/settings', {}, true),
        saveSettings: (body) =>
            request('/admin/settings', { method: 'PUT', body: JSON.stringify(body) }, true),
        categories: () => request('/admin/categories', {}, true),
        saveCategory: (id, body) =>
            request(
                id ? `/admin/categories/${encodeURIComponent(id)}` : '/admin/categories',
                {
                    method: id ? 'PUT' : 'POST',
                    body: JSON.stringify(body)
                },
                true
            ),
        deleteCategory: (id) => request(`/admin/categories/${encodeURIComponent(id)}`, { method: 'DELETE' }, true),
        fields: () => request('/admin/fields', {}, true),
        saveField: (id, body) =>
            request(
                id ? `/admin/fields/${encodeURIComponent(id)}` : '/admin/fields',
                {
                    method: id ? 'PUT' : 'POST',
                    body: JSON.stringify(body)
                },
                true
            ),
        deleteField: (id) => request(`/admin/fields/${encodeURIComponent(id)}`, { method: 'DELETE' }, true),
        products: () => request('/admin/products', {}, true),
        saveProduct: (id, body) =>
            request(
                id ? `/admin/products/${encodeURIComponent(id)}` : '/admin/products',
                {
                    method: id ? 'PUT' : 'POST',
                    body: JSON.stringify(body)
                },
                true
            ),
        deleteProduct: (id) => request(`/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE' }, true),
        coupons: () => request('/admin/coupons', {}, true),
        saveCoupon: (id, body) =>
            request(
                id ? `/admin/coupons/${encodeURIComponent(id)}` : '/admin/coupons',
                {
                    method: id ? 'PUT' : 'POST',
                    body: JSON.stringify(body)
                },
                true
            ),
        deleteCoupon: (id) => request(`/admin/coupons/${encodeURIComponent(id)}`, { method: 'DELETE' }, true),
        orders: (page = 0, status = '') =>
            request(
                `/admin/orders?page=${page}&size=25${status ? `&status=${encodeURIComponent(status)}` : ''}`,
                {},
                true
            ),
        payments: (page = 0, status = '') =>
            request(
                `/admin/payments?page=${page}&size=25${status ? `&status=${encodeURIComponent(status)}` : ''}`,
                {},
                true
            ),
        customers: (page = 0) => request(`/admin/customers?page=${page}&size=25`, {}, true),
        adjustCredits: (id, deltaCents) =>
            request(
                `/admin/customers/${encodeURIComponent(id)}/credits`,
                {
                    method: 'POST',
                    body: JSON.stringify({ deltaCents })
                },
                true
            ),
        entitlements: (page = 0) => request(`/admin/entitlements?page=${page}&size=25`, {}, true)
    }
};

export const formatStorePrice = (cents, currency = 'EUR') =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format((cents || 0) / 100);

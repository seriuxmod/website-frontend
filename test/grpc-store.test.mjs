import test from 'node:test';
import assert from 'node:assert/strict';
import { installPeer } from './grpc-peer.mjs';
import { storeApi as api, formatStorePrice } from '../src/lib/storeApi.js';
import { StoreCatalogService as Catalog } from '../src/gen/seriuxmod/store/v1/catalog_service_pb.js';
import { StoreCustomerService as Customer } from '../src/gen/seriuxmod/store/v1/checkout_service_pb.js';
import { StoreAdminService as Admin } from '../src/gen/seriuxmod/store/v1/admin_service_pb.js';
import { AdminCosmeticService as Cosmetic } from '../src/gen/seriuxmod/store/v1/cosmetic_service_pb.js';

test('public Store catalog uses anonymous binary requests and retains config, lists, prices and field definitions', async () => {
    const p = installPeer();
    try {
        const config = await p.call(Catalog, 'getConfig', {}, api.config, { currency: 'EUR', checkoutEnabled: false, paymentMethods: [{ id: 'disabled', providerConfigured: false }] }, { public: true });
        assert.equal(config.checkoutEnabled, false); assert.equal(config.paymentMethods[0].providerConfigured, false);
        assert.equal((await p.call(Catalog, 'listCategories', {}, api.categories, { categories: [{ id: 'c', name: 'Testdatensatz' }] }, { public: true })).categories[0].id, 'c');
        const products = await p.call(Catalog, 'listProducts', { categoryId: 'c', includeDescription: true, includeFields: true, includeActions: false }, () => api.products('c'),
            { products: [{ id: 'p', priceCents: 199n, currency: 'EUR', fields: [{ identifier: 'name', required: true }] }] }, { public: true });
        assert.equal(products.products[0].priceCents, 199); assert.equal(products.products[0].fields[0].required, true);
        await p.call(Catalog, 'listProducts', { includeDescription: true, includeFields: true, includeActions: false }, api.products, {}, { public: true });
        assert.equal(formatStorePrice(null), 'Nicht verfügbar'); assert.equal(formatStorePrice(''), 'Nicht verfügbar');
        assert.equal(formatStorePrice(0), '0,00 €'); assert.equal(formatStorePrice(199), '1,99 €');
    } finally { p.restore(); }
});

test('Store customer adapters preserve billing, idempotency, item fields, order/payment enums and totals without REST or retries', async () => {
    const p = installPeer();
    try {
        assert.equal((await p.call(Customer, 'getBillingProfile', {}, api.billingProfile, { email: 'test@example.invalid', complete: true })).complete, true);
        const profile = { email: 'test@example.invalid', address: { fullName: 'Synthetic', company: '', countryCode: 'DE' } };
        await p.call(Customer, 'updateBillingProfile', profile, () => api.updateBillingProfile({ ...profile, complete: true }));
        const key = '10000000-0000-4000-8000-000000000001';
        const order = await p.call(Customer, 'createOrder', { products: [{ productId: 'p', quantity: 2, fields: [{ identifier: 'name', value: 'STORE_ORDER_STATUS_PAID' }] }], termsAccepted: true, digitalContentConsent: true, idempotencyKey: key },
            () => api.createOrder({ recipientUserId: null, products: [{ productId: 'p', quantity: 2, fields: [{ identifier: 'name', value: 'STORE_ORDER_STATUS_PAID' }], localDisplay: 'ignored UI metadata' }], termsAccepted: true, digitalContentConsent: true, idempotencyKey: key }),
            { id: 'o', status: 1, totalCents: 398n, currency: 'EUR' });
        assert.equal(order.status, 'CREATED'); assert.equal(order.totalCents, 398);
        const page = await p.call(Customer, 'listOrders', { page: 2, size: 20 }, () => api.orders(2, 20), { total: 41n, page: 2, size: 20, items: [{ id: 'o', status: 3 }] });
        assert.equal(page.total, 41); assert.equal(page.items[0].status, 'FULFILLED');
        await p.call(Customer, 'getOrder', { orderId: 'o' }, () => api.order('o'));
        const payment = await p.call(Customer, 'createPayment', { orderId: 'o', gatewayId: 'synthetic', paymentMethodId: 'm' }, () => api.createPayment('o', 'synthetic', 'm'), { id: 'pay', status: 2 });
        assert.equal(payment.status, 'COMPLETED');
        await p.call(Customer, 'getPayment', { paymentId: 'pay' }, () => api.payment('pay'));
        assert.equal((await p.call(Customer, 'listPayments', { page: 1, size: 10 }, () => api.payments(1, 10), { total: 12n, payments: [{ id: 'pay' }] })).payments[0].id, 'pay');
        assert.equal((await p.call(Customer, 'listEntitlements', {}, api.entitlements, { entitlements: [{ id: 'e', quantity: 2 }] })).entitlements[0].quantity, 2);
        assert.equal((await p.call(Customer, 'getCredits', {}, api.credits, { cents: -25n })).cents, -25);
        assert.equal(p.paths.length, 10);
    } finally { p.restore(); }
});

test('Store administration maps every catalog/settings/operations command explicitly with nullable clears and no server-only settings', async () => {
    const p = installPeer(), a = api.admin;
    try {
        assert.deepEqual((await p.call(Admin, 'getOverview', {}, a.overview, { revenueByCurrency: { EUR: 199n } })).revenueByCurrency, { EUR: 199 });
        await p.call(Admin, 'getAnalytics', { days: 7 }, () => a.analytics(7));
        await p.call(Admin, 'getSettings', {}, a.settings);
        const settings = { checkoutEnabled: false, currency: 'EUR', merchant: { legalName: 'Synthetic', addressLine2: '' }, invoicePrefix: 'TEST', pricesIncludeVat: true, defaultVatRateBasisPoints: 1900, paymentMethods: [{ id: 'm', enabled: false, order: 2 }] };
        await p.call(Admin, 'updateSettings', settings, () => a.saveSettings({ ...settings, checkoutOperational: true, missingRequirements: [], paymentMethods: [{ ...settings.paymentMethods[0], provider: 'server-only', providerConfigured: true }] }));
        for (const [name, singular, wrapper, body] of [
            ['categories', 'Category', 'category', { name: 'Testdatensatz', parentCategoryId: '', hidden: false, disabled: false, order: 3 }],
            ['fields', 'Field', 'field', { identifier: 'field', required: false, options: [], regex: '', defaultValue: '', typeId: 1 }],
            ['products', 'Product', 'product', { categoryId: 'c', name: 'Testdatensatz', priceCents: 199n, currency: 'EUR', requiredProductIds: [], requiredGroupIds: [], fieldIds: [], globalLimit: null }],
            ['coupons', 'Coupon', 'coupon', { code: 'SYNTHETIC', type: 2, value: 10n, minimumOrderCents: 0n, productIds: [], enabled: false, startsAt: null, expiresAt: null }]
        ]) {
            const input = { ...body, ...(singular === 'Product' ? { priceCents: 199 } : {}), ...(singular === 'Coupon' ? { type: 'PERCENT', value: 10, minimumOrderCents: 0 } : {}) };
            assert.deepEqual(await p.call(Admin, `list${name[0].toUpperCase()}${name.slice(1)}`, {}, a[name], { [name]: [] }), []);
            const method = `save${singular}`;
            await p.call(Admin, `create${singular}`, body, () => a[method](null, input));
            await p.call(Admin, `update${singular}`, { id: 'id', [wrapper]: body }, () => a[method]('id', input));
            await p.call(Admin, `delete${singular}`, { id: 'id' }, () => a[`delete${singular}`]('id'));
        }
        const orders = await p.call(Admin, 'listOrders', { page: 1, size: 25, status: 3 }, () => a.orders(1, 25, 'FULFILLED'), { total: 29n });
        assert.equal(orders.total, 29);
        await p.call(Admin, 'getOrder', { id: 'o' }, () => a.order('o'));
        await p.call(Admin, 'cancelOrder', { id: 'o' }, () => a.cancelOrder('o'));
        await p.call(Admin, 'fulfillOrder', { id: 'o' }, () => a.fulfillOrder('o'));
        await p.call(Admin, 'listPayments', { page: 1, size: 25, status: 3 }, () => a.payments(1, 25, 'FAILED'));
        await p.call(Admin, 'listCustomers', { page: 0, size: 25, query: 'Synthetic' }, () => a.customers(0, 25, 'Synthetic'));
        await p.call(Admin, 'getCustomer', { id: 'u', limit: 50 }, () => a.customer('u'));
        assert.equal((await p.call(Admin, 'adjustCredits', { customerId: 'u', deltaCents: -9n }, () => a.adjustCredits('u', -9), { cents: 1n })).cents, 1);
        await p.call(Admin, 'listEntitlements', { page: 2, size: 25 }, () => a.entitlements(2));
        await p.call(Admin, 'listAuditLogs', { page: 0, size: 25, query: 'literal', action: 'STORE_ORDER_STATUS_PAID', entityType: 'order', actorUserId: 'u' }, () => a.auditLogs({ q: 'literal', action: 'STORE_ORDER_STATUS_PAID', entityType: 'order', actorUserId: 'u' }));
        assert.equal(p.paths.length, 30);
    } finally { p.restore(); }
});

test('Cosmetic administration preserves render metadata, schedule, ownership and enum compatibility while editing unrelated text', async () => {
    const p = installPeer(), a = api.admin;
    try {
        await p.call(Cosmetic, 'listCosmetics', { page: 0, size: 25, query: 'Test', type: 1, visibility: 1, status: 3 }, () => a.cosmetics({ q: 'Test', type: 'CAPE', visibility: 'PUBLIC', status: 'ACTIVE' }));
        await p.call(Cosmetic, 'getCosmetic', { cosmeticId: 'c' }, () => a.cosmetic('c'));
        const body = { slug: 'test', name: 'Synthetic', type: 'CAPE', visibility: 'PUBLIC', status: 'DRAFT', tags: [], supportedMinecraftVersions: [], availableFrom: '2026-11-09T10:00:00Z', availableUntil: null,
            renderMetadata: { slot: 'BACK', assetSha256: 'a'.repeat(64), exportedRoots: ['back'], animation: 'literal' } };
        const raw = { ...body, type: 1, visibility: 1, status: 1, availableFrom: { seconds: 1794218400n }, renderMetadata: { ...body.renderMetadata, slot: 8 } };
        await p.call(Cosmetic, 'createCosmetic', { cosmetic: raw }, () => a.saveCosmetic(null, body));
        await p.call(Cosmetic, 'updateCosmetic', { cosmeticId: 'c', cosmetic: raw }, () => a.saveCosmetic('c', body));
        await p.call(Cosmetic, 'deleteCosmetic', { cosmeticId: 'c' }, () => a.deleteCosmetic('c'));
        await p.call(Cosmetic, 'listOwners', { cosmeticId: 'c', page: 0, size: 25 }, () => a.cosmeticOwners('c'));
        await p.call(Cosmetic, 'grantCosmetic', { cosmeticId: 'c', userId: 'u', source: 2, sourceReference: 'TEST' }, () => a.grantCosmetic('c', 'u', { source: 'ADMIN', sourceReference: 'TEST' }));
        await p.call(Cosmetic, 'revokeCosmetic', { cosmeticId: 'c', userId: 'u' }, () => a.revokeCosmetic('c', 'u'));
    } finally { p.restore(); }
});

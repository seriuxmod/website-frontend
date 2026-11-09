import { StoreCatalogService } from '../gen/seriuxmod/store/v1/catalog_service_pb.js';
import { StoreCustomerService } from '../gen/seriuxmod/store/v1/checkout_service_pb.js';
import { StoreAdminService } from '../gen/seriuxmod/store/v1/admin_service_pb.js';
import { AdminCosmeticService } from '../gen/seriuxmod/store/v1/cosmetic_service_pb.js';
import { websiteRpc as rpc, optional, fields } from './grpc/websiteRpc.js';

const catalog = (method, request = {}) => rpc(StoreCatalogService, method, request, { public: true });
const customer = (method, request = {}) => rpc(StoreCustomerService, method, request);
const admin = (method, request = {}) => rpc(StoreAdminService, method, request);
const cosmetics = (method, request = {}) => rpc(AdminCosmeticService, method, request);
const categoryWrite = body => fields(body, ['name', 'description', 'imageUrl', 'parentCategoryId', 'onlySubcategories', 'hidden', 'disabled', 'order']);
const fieldWrite = body => fields(body, ['identifier', 'description', 'typeId', 'required', 'min', 'max', 'options', 'regex', 'defaultValue', 'order']);
const productWrite = body => fields(body, ['categoryId', 'name', 'priceCents', 'currency', 'description', 'imageUrl', 'globalLimit', 'userLimit',
    'requiredProductIds', 'requiredGroupIds', 'paymentType', 'hidden', 'disabled', 'order', 'fieldIds']);
const couponWrite = body => fields(body, ['code', 'type', 'value', 'minimumOrderCents', 'productIds', 'enabled', 'startsAt', 'expiresAt', 'maxRedemptions']);
const cosmeticWrite = body => fields(body, ['slug', 'name', 'description', 'type', 'visibility', 'status', 'assetUrl', 'previewImageUrl', 'storeProductId',
    'tags', 'supportedMinecraftVersions', 'availableFrom', 'availableUntil', 'sortOrder', 'renderMetadata']);
const address = value => value == null ? value : fields(value, ['fullName', 'company', 'addressLine1', 'addressLine2', 'postalCode', 'city', 'region', 'countryCode', 'vatId']);

export const storeApi = {
    config: () => catalog('getConfig'),
    categories: () => catalog('listCategories'),
    products: (categoryId = '') => catalog('listProducts', { categoryId: optional(categoryId), includeDescription: true, includeFields: true, includeActions: false }),
    billingProfile: () => customer('getBillingProfile'),
    updateBillingProfile: profile => customer('updateBillingProfile', { email: profile.email, address: address(profile.address) }),
    createOrder: order => customer('createOrder', {
        ...fields(order, ['recipientUserId', 'termsAccepted', 'digitalContentConsent', 'idempotencyKey']),
        products: order.products?.map(product => ({ productId: product.productId, quantity: product.quantity,
            fields: product.fields?.map(field => fields(field, ['identifier', 'value'])) }))
    }),
    orders: (page = 0, size = 20) => customer('listOrders', { page, size }),
    order: orderId => customer('getOrder', { orderId }),
    createPayment: (orderId, gatewayId, paymentMethodId) => customer('createPayment', { orderId, gatewayId, paymentMethodId: optional(paymentMethodId) }),
    payment: paymentId => customer('getPayment', { paymentId }),
    payments: (page = 0, size = 20) => customer('listPayments', { page, size }),
    entitlements: () => customer('listEntitlements'),
    credits: () => customer('getCredits'),
    admin: {
        overview: () => admin('getOverview'),
        analytics: (days = 30) => admin('getAnalytics', { days }),
        settings: () => admin('getSettings'),
        saveSettings: body => admin('updateSettings', {
            ...fields(body, ['checkoutEnabled', 'currency', 'merchant', 'invoicePrefix', 'pricesIncludeVat', 'defaultVatRateBasisPoints']),
            paymentMethods: body.paymentMethods?.map(value => fields(value, ['id', 'enabled', 'order']))
        }),
        categories: () => admin('listCategories').then(value => value.categories),
        saveCategory: (id, body) => id ? admin('updateCategory', { id, category: categoryWrite(body) }) : admin('createCategory', categoryWrite(body)),
        deleteCategory: id => admin('deleteCategory', { id }),
        fields: () => admin('listFields').then(value => value.fields),
        saveField: (id, body) => id ? admin('updateField', { id, field: fieldWrite(body) }) : admin('createField', fieldWrite(body)),
        deleteField: id => admin('deleteField', { id }),
        products: () => admin('listProducts').then(value => value.products),
        saveProduct: (id, body) => id ? admin('updateProduct', { id, product: productWrite(body) }) : admin('createProduct', productWrite(body)),
        deleteProduct: id => admin('deleteProduct', { id }),
        coupons: () => admin('listCoupons').then(value => value.coupons),
        saveCoupon: (id, body) => id ? admin('updateCoupon', { id, coupon: couponWrite(body) }) : admin('createCoupon', couponWrite(body)),
        deleteCoupon: id => admin('deleteCoupon', { id }),
        orders: (page = 0, size = 25, status = '') => admin('listOrders', { page, size, status: optional(status) }),
        order: id => admin('getOrder', { id }),
        cancelOrder: id => admin('cancelOrder', { id }),
        fulfillOrder: id => admin('fulfillOrder', { id }),
        payments: (page = 0, size = 25, status = '') => admin('listPayments', { page, size, status: optional(status) }),
        customers: (page = 0, size = 25, query = '') => admin('listCustomers', { page, size, query: optional(query) }),
        customer: (id, limit = 50) => admin('getCustomer', { id, limit }),
        adjustCredits: (customerId, deltaCents) => admin('adjustCredits', { customerId, deltaCents }),
        entitlements: (page = 0, size = 25) => admin('listEntitlements', { page, size }),
        auditLogs: ({ page = 0, size = 25, q = '', action = '', entityType = '', actorUserId = '' } = {}) => admin('listAuditLogs', {
            page, size, query: optional(q), action: optional(action), entityType: optional(entityType), actorUserId: optional(actorUserId)
        }),
        cosmetics: ({ page = 0, size = 25, q = '', type = '', visibility = '', status = '' } = {}) => cosmetics('listCosmetics', {
            page, size, query: optional(q), type: optional(type), visibility: optional(visibility), status: optional(status)
        }),
        cosmetic: cosmeticId => cosmetics('getCosmetic', { cosmeticId }),
        saveCosmetic: (cosmeticId, body) => cosmetics(cosmeticId ? 'updateCosmetic' : 'createCosmetic', { cosmeticId: optional(cosmeticId), cosmetic: cosmeticWrite(body) }),
        deleteCosmetic: cosmeticId => cosmetics('deleteCosmetic', { cosmeticId }),
        cosmeticOwners: (cosmeticId, page = 0, size = 25) => cosmetics('listOwners', { cosmeticId, page, size }),
        grantCosmetic: (cosmeticId, userId, body = {}) => cosmetics('grantCosmetic', {
            cosmeticId, userId, ...fields(body, ['source', 'sourceReference', 'expiresAt'])
        }),
        revokeCosmetic: (cosmeticId, userId) => cosmetics('revokeCosmetic', { cosmeticId, userId })
    }
};

export function formatStorePrice(cents, currency = 'EUR') {
    if (cents == null || cents === '') return 'Nicht verfügbar';
    const amount = Number(cents);
    if (!Number.isSafeInteger(amount) || !currency) return 'Nicht verfügbar';
    try { return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount / 100); }
    catch { return `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(amount / 100)} ${currency}`; }
}

import { Navigate } from 'react-router-dom';
import { getAuthenticatedUser, hasAnyPermission, isStoreAdministrator } from '../../../lib/auth';
import CommerceOverviewView from './CommerceOverviewView';
import { CommerceCatalogView, CommerceCouponsView, CommerceFieldsView } from './CommerceCatalogViews';
import { CommerceCustomersView, CommerceOrdersView } from './CommerceOperationsViews';
import { CommercePaymentMethodsView, CommerceSettingsView } from './CommerceSettingsViews';

const VIEWS = {
    commerce: CommerceOverviewView,
    customers: CommerceCustomersView,
    catalog: CommerceCatalogView,
    fields: CommerceFieldsView,
    coupons: CommerceCouponsView,
    orders: CommerceOrdersView,
    'payment-methods': CommercePaymentMethodsView,
    'commerce-settings': CommerceSettingsView
};

const REQUIRED_PERMISSIONS = {
    commerce: ['store.dashboard.read'],
    customers: ['store.customers.read'],
    catalog: ['store.catalog.read'],
    fields: ['store.catalog.read'],
    coupons: ['store.catalog.read'],
    orders: ['store.orders.read'],
    'payment-methods': ['store.settings.read'],
    'commerce-settings': ['store.settings.read']
};

const MODULE_ROUTES = {
    commerce: '/admin/commerce',
    customers: '/admin/commerce/customers',
    catalog: '/admin/commerce/catalog',
    fields: '/admin/commerce/fields',
    coupons: '/admin/commerce/coupons',
    orders: '/admin/commerce/orders',
    'payment-methods': '/admin/commerce/payment-methods',
    'commerce-settings': '/admin/commerce/settings'
};

export default function AdminCommerceView({ module }) {
    const user = getAuthenticatedUser();
    const View = VIEWS[module];
    if (!isStoreAdministrator(user)) return <Navigate replace to="/admin" />;
    const fallbackRoute = Object.keys(VIEWS)
        .filter((candidate) => candidate !== module)
        .find((candidate) => hasAnyPermission(user, ...REQUIRED_PERMISSIONS[candidate]));
    if (!View || !hasAnyPermission(user, ...REQUIRED_PERMISSIONS[module])) {
        return <Navigate replace to={fallbackRoute ? MODULE_ROUTES[fallbackRoute] : '/admin'} />;
    }
    return <View user={user} />;
}

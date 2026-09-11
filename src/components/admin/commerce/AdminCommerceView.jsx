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

export default function AdminCommerceView({ module }) {
    const user = getAuthenticatedUser();
    if (!isStoreAdministrator(user)) return <Navigate replace to="/" />;
    if (!hasAnyPermission(user, ...(REQUIRED_PERMISSIONS[module] || []))) return <Navigate replace to="/admin" />;
    const View = VIEWS[module];
    return View ? <View user={user} /> : <Navigate replace to="/admin/commerce" />;
}

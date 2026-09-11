import { Navigate } from 'react-router-dom';
import { getAuthenticatedUser, hasAnyPermission } from '../../../lib/auth';
import CosmeticsAdminView from './CosmeticsAdminView';
import TranslationsAdminView from './TranslationsAdminView';

const VIEWS = {
    cosmetics: CosmeticsAdminView,
    translations: TranslationsAdminView
};

const REQUIRED_PERMISSIONS = {
    cosmetics: ['store.cosmetics.read'],
    translations: ['forum.translations.read']
};

export default function AdminManagementView({ module }) {
    const user = getAuthenticatedUser();
    const View = VIEWS[module];
    if (!View || !hasAnyPermission(user, ...(REQUIRED_PERMISSIONS[module] || []))) {
        return <Navigate replace to="/admin" />;
    }
    return <View user={user} />;
}

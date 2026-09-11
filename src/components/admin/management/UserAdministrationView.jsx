import { Navigate } from 'react-router-dom';
import { getAuthenticatedUser, hasAnyPermission, hasPermission } from '../../../lib/auth';
import PlayersAdminView from './PlayersAdminView';
import PermissionsAdminView from './PermissionsAdminView';
import { BansAdminView, ModerationOverviewView, ModerationSettingsView, MutesAdminView } from './ModerationAdminViews';

const VIEWS = {
    players: PlayersAdminView,
    permissions: PermissionsAdminView,
    moderation: ModerationOverviewView,
    bans: BansAdminView,
    mutes: MutesAdminView,
    'moderation-settings': ModerationSettingsView
};

function canOpen(user, module) {
    switch (module) {
        case 'players':
            return hasAnyPermission(
                user,
                'users.read.any',
                'users.lock',
                'permissions.user.write',
                'permissions.assignment.write'
            );
        case 'permissions':
            return hasAnyPermission(user, 'permissions.group.read', 'permissions.group.write');
        case 'bans':
            return hasAnyPermission(user, 'moderation.ban.read', 'moderation.ban.write');
        case 'mutes':
            return hasAnyPermission(user, 'moderation.mute.read', 'moderation.mute.write');
        case 'moderation':
            return (
                hasPermission(user, 'moderation.admin') ||
                (hasPermission(user, 'moderation.ban.read') && hasPermission(user, 'moderation.mute.read'))
            );
        case 'moderation-settings':
            return (
                hasPermission(user, 'moderation.admin') ||
                (hasPermission(user, 'moderation.ban.read') && hasPermission(user, 'moderation.mute.read')) ||
                hasAnyPermission(user, 'moderation.ban.reason.write', 'moderation.mute.reason.write')
            );
        default:
            return false;
    }
}

export default function UserAdministrationView({ module }) {
    const user = getAuthenticatedUser();
    const View = VIEWS[module];
    if (!View || !canOpen(user, module)) return <Navigate replace to="/admin" />;
    return <View user={user} />;
}

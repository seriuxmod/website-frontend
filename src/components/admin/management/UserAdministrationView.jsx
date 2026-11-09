import { Navigate } from 'react-router-dom';
import { getAuthenticatedUser, hasAnyPermission, hasPermission } from '../../../lib/auth';
import PlayersAdminView from './PlayersAdminView';
import PermissionsAdminView from './PermissionsAdminView';
import { AdminEmptyState } from '../AdminUi';

const VIEWS = {
    players: PlayersAdminView,
    permissions: PermissionsAdminView,
    moderation: ModerationUnavailable,
    bans: ModerationUnavailable,
    mutes: ModerationUnavailable,
    'moderation-settings': ModerationUnavailable
};

function ModerationUnavailable() {
    return <section aria-label="Moderation noch nicht implementiert">
        <p className="eyebrow">MODERATION · NOCH NICHT IMPLEMENTIERT</p>
        <h2 className="mt-3 font-display text-3xl font-bold">Ban- und Mute-Verwaltung</h2>
        <div className="mt-6"><AdminEmptyState title="Noch nicht mit dem Backend verbunden"
            text="Der aktuelle User-Service bietet keine Ban-/Mute-Fälle, Fallhistorien oder Sanktionsgründe an. Hier werden deshalb keine erfundenen Zähler oder wirksamen Verwaltungsaktionen angezeigt. Kontozugriffssperren sind davon getrennt in der Spielerverwaltung verfügbar." /></div>
    </section>;
}

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

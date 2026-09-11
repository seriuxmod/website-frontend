import { Navigate } from 'react-router-dom';
import { getAuthenticatedUser, hasAnyPermission, isSocialAdministrator } from '../../../lib/auth';
import FriendsAdminView from './FriendsAdminView';
import SocialGroupsAdminView from './SocialGroupsAdminView';
import PublicServersAdminView from './PublicServersAdminView';

const VIEWS = {
    friends: FriendsAdminView,
    clans: (props) => <SocialGroupsAdminView {...props} kind="clans" />,
    parties: (props) => <SocialGroupsAdminView {...props} kind="parties" />,
    'public-servers': PublicServersAdminView
};
const REQUIRED = {
    friends: 'social.friends.read',
    clans: 'social.clans.read',
    parties: 'social.parties.read',
    'public-servers': 'social.servers.read'
};

export default function AdminSocialView({ module }) {
    const user = getAuthenticatedUser();
    const View = VIEWS[module];
    if (!View || !isSocialAdministrator(user) || !hasAnyPermission(user, REQUIRED[module])) {
        return <Navigate replace to="/admin" />;
    }
    return <View user={user} />;
}

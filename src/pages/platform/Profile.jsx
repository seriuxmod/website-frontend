import { Navigate } from 'react-router-dom';
import { getAuthenticatedUser } from '../../lib/auth';
import { publicProfilePath } from '../../lib/profileRoutes';

export default function Profile() {
    const user = getAuthenticatedUser();
    if (!user) return <Navigate to="/" replace />;
    return <Navigate to={publicProfilePath(user)} replace />;
}

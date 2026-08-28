import { Navigate } from 'react-router-dom';
import { getAuthenticatedUser } from '../../lib/auth';

export default function Profile() {
    const user = getAuthenticatedUser();
    if (!user) return <Navigate to="/" replace />;
    return <Navigate to={`/@${encodeURIComponent(user.username)}`} replace />;
}

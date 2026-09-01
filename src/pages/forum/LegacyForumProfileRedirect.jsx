import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { userApi } from '../../lib/userApi';

export default function LegacyForumProfileRedirect() {
    const { userId } = useParams();
    const [username, setUsername] = useState('');
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let active = true;
        userApi
            .byId(userId)
            .then((profile) => active && setUsername(profile.username))
            .catch(() => active && setFailed(true));
        return () => {
            active = false;
        };
    }, [userId]);

    if (failed) return <Navigate to="/forum" replace />;
    if (username) return <Navigate to={`/@${encodeURIComponent(username)}`} replace />;

    return <main className="min-h-screen bg-[#07080b]" aria-busy="true" />;
}

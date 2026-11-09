import { Navigate } from 'react-router-dom';

// Compatibility for the old generic hub. The dedicated pages own transport and state.
export default function PlatformHub({ type }) {
    return <Navigate replace to={({ clans: '/clans', friends: '/friends', party: '/party', forum: '/forum', store: '/store' })[type] || '/'} />;
}

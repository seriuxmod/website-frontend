import { Link } from 'react-router-dom';
import { FaComments } from 'react-icons/fa6';
import { useSocial } from '../lib/SocialContext.jsx';
import { presenceLabels } from '../lib/presenceDisplay.js';

export default function NavbarSocial() {
    const { state } = useSocial();
    if (!state.userId) return null;
    return <Link to="/notifications" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-orange-300 hover:bg-white/5"
        title="Social-Eingang und globaler Status" aria-label={state.unreadCount == null ? 'Social-Eingang nicht verfügbar' : `Social-Eingang: ${state.unreadCount} ungelesen`}>
        <FaComments /><span className="hidden lg:inline">{presenceLabels[state.ownPresence?.effectiveStatus] || 'Social nicht verfügbar'}</span>
        {state.unreadCount > 0 && <b>{state.unreadCount > 99 ? '99+' : state.unreadCount}</b>}
    </Link>;
}

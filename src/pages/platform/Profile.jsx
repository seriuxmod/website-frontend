import { FaArrowRightFromBracket, FaComments, FaUser } from 'react-icons/fa6';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getAuthenticatedUser, logout } from '../../lib/auth';

export default function Profile() {
    const user = getAuthenticatedUser();
    const navigate = useNavigate();
    if (!user) return <Navigate to="/" replace />;

    const signOut = () => {
        logout();
        navigate('/');
    };

    return (
        <main className="min-h-screen bg-[#090a0d] px-5 pb-24 pt-36 text-white">
            <section className="mx-auto max-w-5xl">
                <p className="eyebrow">SERIUX-ID</p>
                <h1 className="mt-3 font-display text-5xl font-bold tracking-[-.05em] sm:text-7xl">Mein Profil</h1>
                <div className="liquid-panel mt-10 flex flex-col gap-7 rounded-3xl p-7 sm:flex-row sm:items-center">
                    <img
                        className="h-28 w-28 rounded-2xl border border-orange-500/20 bg-black/30 [image-rendering:pixelated]"
                        src={user.avatarUrl}
                        alt={`Minecraft-Kopf von ${user.username}`}
                    />
                    <div className="min-w-0 flex-1">
                        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-orange-400">
                            <FaUser /> Minecraft Account
                        </span>
                        <h2 className="mt-3 truncate font-display text-3xl font-bold">{user.username}</h2>
                        <p className="mt-2 break-all font-mono text-xs text-zinc-500">{user.playerId}</p>
                    </div>
                    <button type="button" onClick={signOut} className="button-secondary">
                        <FaArrowRightFromBracket /> Abmelden
                    </button>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                    <Link className="forum-button-primary" to={`/forum/user/${user.playerId}`}>
                        <FaComments /> Öffentliches Forum-Profil
                    </Link>
                    <Link className="forum-button-secondary" to="/forum/account">
                        Forum-Einstellungen
                    </Link>
                </div>
            </section>
        </main>
    );
}

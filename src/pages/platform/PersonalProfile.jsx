import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowUpRightFromSquare, FaShieldHalved, FaUser } from 'react-icons/fa6';
import { beginLogin, getAuthenticatedUser, refreshAuthenticatedSession } from '../../lib/auth';
import { publicProfilePath, SECURITY_SETTINGS_PATH } from '../../lib/profileRoutes';

export default function PersonalProfile() {
    const [user, setUser] = useState(() => getAuthenticatedUser());
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let active = true;
        const synchronize = async () => {
            try {
                const next = await refreshAuthenticatedSession();
                if (active) setUser(next);
            } finally { if (active) setLoading(false); }
        };
        void synchronize();
        window.addEventListener('seriux-auth-changed', synchronize);
        return () => { active = false; window.removeEventListener('seriux-auth-changed', synchronize); };
    }, []);

    return <main className="mx-auto min-h-screen max-w-5xl px-5 pb-24 pt-36 text-white">
        <p className="eyebrow">MEIN KONTO · PERSÖNLICH</p>
        <h1 className="mt-3 font-display text-4xl font-bold">Meine persönliche Ansicht</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
            Dein öffentlicher Auftritt und deine persönlichen Kontoeinstellungen bleiben getrennt.
        </p>
        {loading ? <div role="status" className="liquid-panel mt-8 flex items-center gap-3 rounded-3xl p-7 text-zinc-400">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-orange-500" /> Sitzung wird geprüft …
        </div> : !user ? <section className="liquid-panel mt-8 rounded-3xl p-7">
            <h2 className="text-xl font-bold">Anmeldung erforderlich</h2>
            <p className="mt-3 text-sm text-zinc-400">Diese Ansicht gehört ausschließlich zu deinem angemeldeten Konto.</p>
            <button className="forum-button-primary mt-6" onClick={() => beginLogin('/me')}>Anmelden</button>
        </section> : <>
            <section className="liquid-panel mt-8 flex flex-wrap items-center gap-5 rounded-3xl p-7">
                <img src={user.avatarUrl} alt="" className="h-16 w-16 rounded-2xl [image-rendering:pixelated]" />
                <div className="min-w-0">
                    <h2 className="flex items-center gap-2 text-2xl font-bold"><FaUser className="text-orange-400" /> {user.username}</h2>
                    <p className="mt-2 break-all font-mono text-xs text-zinc-400">UUID: {user.playerId || 'Nicht verfügbar'}</p>
                </div>
            </section>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
                <Link to={publicProfilePath(user)} className="liquid-panel rounded-3xl p-7 transition hover:border-orange-500/40">
                    <FaArrowUpRightFromSquare className="text-xl text-orange-400" />
                    <h2 className="mt-4 text-lg font-bold">Öffentliches Profil</h2>
                    <p className="mt-3 text-sm leading-6 text-zinc-400">So sehen andere Spieler dein Minecraft-Profil.</p>
                </Link>
                <Link to={SECURITY_SETTINGS_PATH} className="liquid-panel rounded-3xl p-7 transition hover:border-orange-500/40">
                    <FaShieldHalved className="text-xl text-orange-400" />
                    <h2 className="mt-4 text-lg font-bold">Sicherheitseinstellungen</h2>
                    <p className="mt-3 text-sm leading-6 text-zinc-400">Zugangsmittel und Sitzungen verwalten. Änderungen erfordern eine aktuelle Website-Anmeldung.</p>
                </Link>
            </div>
        </>}
    </main>;
}

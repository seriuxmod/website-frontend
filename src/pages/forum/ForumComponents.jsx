import { useEffect, useState } from 'react';
import { FaBullhorn, FaComments, FaFolderOpen, FaLifeRing, FaLock, FaThumbtack } from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import { getPublicUser } from '../../lib/forumApi';

export const formatDate = (value) =>
    value
        ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
        : 'Noch keine Aktivität';

export function ForumShell({
    eyebrow = 'SERIUXMOD COMMUNITY',
    title,
    description,
    breadcrumbs = [],
    actions,
    children,
    showHero = true
}) {
    return (
        <main className="min-h-screen bg-[#090a0d] px-4 pb-24 pt-32 text-white sm:px-6 sm:pt-36">
            <div className="mx-auto max-w-7xl">
                <div className={showHero ? '' : 'mb-5 flex flex-wrap items-center justify-between gap-4'}>
                    <nav
                        className={`${showHero ? 'mb-8' : ''} flex flex-wrap items-center gap-2 text-xs text-zinc-600`}
                        aria-label="Breadcrumb"
                    >
                        <Link className="transition hover:text-orange-400" to="/forum">
                            Forum
                        </Link>
                        {breadcrumbs.map((item) => (
                            <span className="flex items-center gap-2" key={item.label}>
                                <span>/</span>
                                {item.to ? (
                                    <Link className="transition hover:text-orange-400" to={item.to}>
                                        {item.label}
                                    </Link>
                                ) : (
                                    <span className="text-zinc-400">{item.label}</span>
                                )}
                            </span>
                        ))}
                    </nav>
                    {!showHero && actions && <div className="flex flex-wrap gap-3">{actions}</div>}
                </div>
                {showHero ? (
                    <section className="forum-hero relative overflow-hidden rounded-[32px] border border-white/[.08] px-6 py-10 sm:px-10 sm:py-12">
                        <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
                            <div className="max-w-3xl">
                                <p className="eyebrow">{eyebrow}</p>
                                <h1 className="mt-3 font-display text-4xl font-bold tracking-[-.05em] sm:text-6xl">
                                    {title}
                                </h1>
                                {description && (
                                    <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
                                        {description}
                                    </p>
                                )}
                            </div>
                            {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
                        </div>
                    </section>
                ) : null}
                <div className={showHero ? 'mt-8' : ''}>{children}</div>
            </div>
        </main>
    );
}

export function ForumIcon({ node, className = '' }) {
    const Icon = node?.title?.toLowerCase().includes('ankünd')
        ? FaBullhorn
        : node?.title?.toLowerCase().includes('hilfe')
          ? FaLifeRing
          : node?.type === 'CATEGORY'
            ? FaFolderOpen
            : FaComments;
    return <Icon className={className} />;
}

const rankColor = (color) =>
    Number.isInteger(color) ? `#${(color >>> 0).toString(16).padStart(6, '0').slice(-6)}` : '#fb923c';

export function UserIdentity({ playerId, compact = false, linked = false, author = false }) {
    const [profile, setProfile] = useState(null);
    useEffect(() => {
        let active = true;
        getPublicUser(playerId).then((value) => active && setProfile(value));
        return () => {
            active = false;
        };
    }, [playerId]);
    const identity = author ? (
        <div className="flex min-w-0 flex-col items-center text-center">
            <img
                className="h-24 w-24 rounded-[22px] bg-black/30 shadow-[0_16px_35px_rgba(0,0,0,.3)] [image-rendering:pixelated]"
                src={profile?.avatarUrl || `https://mc-heads.net/avatar/${encodeURIComponent(playerId || 'Steve')}/128`}
                alt={profile?.username ? `Minecraft-Kopf von ${profile.username}` : 'Minecraft-Kopf'}
            />
            <b className="mt-4 block max-w-full truncate text-base text-zinc-100">
                {profile?.username || 'Spieler wird geladen …'}
            </b>
            <span
                className="mt-2 inline-flex min-h-7 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold"
                style={{
                    borderColor: `${rankColor(profile?.rank?.color)}55`,
                    backgroundColor: `${rankColor(profile?.rank?.color)}14`,
                    color: rankColor(profile?.rank?.color)
                }}
            >
                {profile?.rank?.badgeUrl && (
                    <img className="h-4 w-4 object-contain" src={profile.rank.badgeUrl} alt="" />
                )}
                {profile?.rank?.displayName || (profile ? 'Spieler' : 'Rang wird geladen …')}
            </span>
        </div>
    ) : (
        <div className="flex min-w-0 items-center gap-3">
            <img
                className={`${compact ? 'h-8 w-8 rounded-lg' : 'h-11 w-11 rounded-xl'} bg-black/30 [image-rendering:pixelated]`}
                src={profile?.avatarUrl || `https://mc-heads.net/avatar/${encodeURIComponent(playerId || 'Steve')}/64`}
                alt=""
            />
            <div className="min-w-0">
                <b className="block truncate text-sm text-zinc-100">{profile?.username || 'Spieler wird geladen …'}</b>
                {!compact && (
                    <span className="text-[11px] text-zinc-600">{profile?.rank?.displayName || 'Spieler'}</span>
                )}
            </div>
        </div>
    );
    return linked && playerId ? (
        <Link
            className="block rounded-xl transition hover:opacity-80"
            to={`/forum/user/${encodeURIComponent(playerId)}`}
        >
            {identity}
        </Link>
    ) : (
        identity
    );
}

export function TopicFlags({ topic }) {
    return (
        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
            {topic.sticky && (
                <span className="rounded-full bg-orange-500/10 px-2 py-1 text-orange-400">
                    <FaThumbtack className="mr-1 inline" /> Angepinnt
                </span>
            )}
            {topic.locked && (
                <span className="rounded-full bg-red-500/10 px-2 py-1 text-red-300">
                    <FaLock className="mr-1 inline" /> Gesperrt
                </span>
            )}
        </span>
    );
}

export function Pagination({ page, size, total, onPage }) {
    const pages = Math.max(1, Math.ceil(total / size));
    if (pages <= 1) return null;
    return (
        <div className="mt-6 flex items-center justify-center gap-3">
            <button className="forum-button-secondary" disabled={page <= 0} onClick={() => onPage(page - 1)}>
                Zurück
            </button>
            <span className="text-xs text-zinc-500">
                Seite {page + 1} von {pages}
            </span>
            <button className="forum-button-secondary" disabled={page + 1 >= pages} onClick={() => onPage(page + 1)}>
                Weiter
            </button>
        </div>
    );
}

export function ForumLoading({ label = 'Forum wird geladen …' }) {
    return <div className="forum-panel animate-pulse rounded-3xl p-8 text-sm text-zinc-500">{label}</div>;
}

export function ForumError({ message, retry }) {
    return (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/[.06] p-8">
            <h2 className="font-display text-xl font-bold text-red-200">Das hat nicht geklappt.</h2>
            <p className="mt-2 text-sm text-red-200/70">{message}</p>
            {retry && (
                <button className="forum-button-secondary mt-5" onClick={retry}>
                    Erneut versuchen
                </button>
            )}
        </div>
    );
}

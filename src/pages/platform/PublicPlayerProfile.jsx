import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaCalendarDays, FaCheck, FaComments, FaCopy, FaHeart, FaMessage, FaShieldHalved } from 'react-icons/fa6';
import { Link, useParams } from 'react-router-dom';
import { forumApi } from '../../lib/forumApi';
import { getAuthenticatedUser } from '../../lib/auth';
import { playerAvatar, playerBody, userApi } from '../../lib/userApi';

function rankColor(color) {
    if (!Number.isFinite(color)) return '#f97316';
    return `#${((color >>> 0) & 0xffffff).toString(16).padStart(6, '0')}`;
}

function formatMemberSince(value) {
    if (!value) return 'SeriuxMod Mitglied';
    return `Dabei seit ${new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(new Date(value))}`;
}

export default function PublicPlayerProfile() {
    const { profileSlug } = useParams();
    const username = profileSlug?.startsWith('@') ? profileSlug.slice(1) : profileSlug;
    const [state, setState] = useState({ loading: true, profile: null, forum: null, error: '' });
    const [copied, setCopied] = useState('');
    const currentUser = getAuthenticatedUser();
    const identityRef = useRef(null);

    const load = useCallback(
        async (signal) => {
            setState({ loading: true, profile: null, forum: null, error: '' });
            try {
                const profile = await userApi.byUsername(username, signal);
                const forum = await forumApi.userProfile(profile.playerId, 6).catch(() => null);
                setState({ loading: false, profile, forum, error: '' });
            } catch (error) {
                if (error.name !== 'AbortError') {
                    setState({
                        loading: false,
                        profile: null,
                        forum: null,
                        error: error.status === 404 ? 'Dieses Spielerprofil wurde nicht gefunden.' : error.message
                    });
                }
            }
        },
        [username]
    );

    useEffect(() => {
        const controller = new AbortController();
        load(controller.signal);
        return () => controller.abort();
    }, [load]);

    useEffect(() => {
        if (!state.profile || !identityRef.current) return undefined;
        const profile = state.profile;
        const publish = (visible) =>
            window.dispatchEvent(
                new CustomEvent('seriux-profile-context', {
                    detail: {
                        visible,
                        username: profile.username,
                        playerId: profile.playerId,
                        avatarUrl: playerAvatar(profile.playerId, 96),
                        rank: profile.rank?.displayName || 'User'
                    }
                })
            );
        const observer = new IntersectionObserver(
            ([entry]) => publish(!entry.isIntersecting && entry.boundingClientRect.bottom < 120),
            { rootMargin: '-110px 0px 0px 0px', threshold: 0 }
        );
        observer.observe(identityRef.current);
        return () => {
            observer.disconnect();
            window.dispatchEvent(new CustomEvent('seriux-profile-context', { detail: null }));
        };
    }, [state.profile]);

    const isOwnProfile = useMemo(
        () => currentUser?.playerId && currentUser.playerId === state.profile?.playerId,
        [currentUser?.playerId, state.profile?.playerId]
    );

    if (state.loading) {
        return (
            <main className="grid min-h-screen place-items-center bg-[#07080b] px-5 pt-24 text-white">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-orange-500" />
                    <p className="mt-5 text-sm text-zinc-500">Spielerprofil wird geladen …</p>
                </div>
            </main>
        );
    }

    if (state.error) {
        return (
            <main className="grid min-h-screen place-items-center bg-[#07080b] px-5 pt-24 text-white">
                <section className="liquid-panel max-w-lg rounded-3xl p-8 text-center">
                    <h1 className="font-display text-3xl font-bold">Profil nicht gefunden</h1>
                    <p className="mt-4 text-sm leading-7 text-zinc-500">{state.error}</p>
                    <Link to="/" className="button-primary mt-7">
                        Zur Startseite
                    </Link>
                </section>
            </main>
        );
    }

    const { profile, forum } = state;
    const color = rankColor(profile.rank?.color);
    const stats = [
        [FaComments, 'Themen', forum?.topicsCreated ?? 0],
        [FaMessage, 'Beiträge', forum?.postsCreated ?? 0],
        [FaHeart, 'Reaktionen', forum?.reactionsReceived ?? 0]
    ];
    const profileFacts = [
        ['01', 'Spielername', profile.username],
        ['02', 'Minecraft UUID', profile.playerId],
        ['03', 'Community-Rang', profile.rank?.displayName || 'User'],
        ['04', 'Mitgliedschaft', formatMemberSince(profile.memberSince)]
    ];

    const copyValue = async (value, type) => {
        await navigator.clipboard.writeText(value);
        setCopied(type);
        window.setTimeout(() => setCopied(''), 1600);
    };

    return (
        <main className="min-h-screen overflow-hidden bg-[#07080b] pb-24 text-white">
            <section className="relative min-h-[610px] overflow-hidden pt-28 sm:pt-32">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_8%,rgba(30,94,163,.46),transparent_48%),linear-gradient(125deg,#19223f_0%,#13233e_48%,#08101c_76%,#07080b_100%)]" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-80 bg-gradient-to-b from-transparent via-[#07080b]/70 to-[#07080b]" />
                <div className="relative mx-auto grid min-h-[480px] max-w-6xl items-end gap-6 px-5 sm:px-8 lg:grid-cols-[390px_minmax(0,1fr)] lg:gap-10">
                    <div className="relative mx-auto flex h-[440px] w-full max-w-[360px] items-end justify-center pb-10">
                        <div className="absolute bottom-10 h-14 w-48 rounded-[50%] bg-black/55 blur-md" />
                        <img
                            className="relative z-10 h-[400px] w-full object-contain object-bottom drop-shadow-[0_30px_22px_rgba(0,0,0,.52)] [image-rendering:pixelated]"
                            src={playerBody(profile.username)}
                            alt={`Minecraft-Skin von ${profile.username}`}
                        />
                    </div>

                    <div className="min-w-0 pb-24 text-center lg:pb-28 lg:text-left">
                        <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                            {isOwnProfile && (
                                <span className="rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-orange-300">
                                    Dein Profil
                                </span>
                            )}
                        </div>
                        <h1
                            ref={identityRef}
                            className="truncate font-display text-5xl font-bold tracking-[-.055em] sm:text-7xl"
                        >
                            {profile.username}
                        </h1>
                        <button
                            type="button"
                            onClick={() => copyValue(profile.playerId, 'uuid')}
                            className="mx-auto mt-4 inline-flex max-w-full items-center gap-3 rounded-lg px-1 py-1 font-mono text-[11px] text-zinc-400 transition hover:text-white lg:mx-0"
                        >
                            <span className="text-[9px] font-bold uppercase tracking-[.12em] text-zinc-600">UUID</span>
                            <span className="truncate">{profile.playerId}</span>
                            {copied === 'uuid' ? <FaCheck className="text-emerald-400" /> : <FaCopy />}
                        </button>
                        <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
                            <span
                                className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold"
                                style={{ borderColor: `${color}55`, background: `${color}18`, color }}
                            >
                                <span className="relative grid h-4 w-4 place-items-center">
                                    <FaShieldHalved />
                                    {profile.rank?.badgeUrl && (
                                        <img
                                            className="absolute inset-0 h-4 w-4 object-contain"
                                            src={profile.rank.badgeUrl}
                                            alt=""
                                            onError={(event) => event.currentTarget.remove()}
                                        />
                                    )}
                                </span>
                                {profile.rank?.displayName || 'User'}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3.5 py-2 text-xs text-zinc-300">
                                <FaCalendarDays className="text-orange-400" /> {formatMemberSince(profile.memberSince)}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/[.08] px-3.5 py-2 text-xs text-pink-300">
                                <FaHeart /> {forum?.reactionsReceived ?? 0} Reaktionen
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="relative z-10 mx-auto mt-10 grid max-w-6xl gap-6 px-5 lg:grid-cols-[320px_1fr]">
                <aside className="space-y-6">
                    <div className="forum-panel overflow-hidden rounded-3xl p-6">
                        <h2 className="font-display text-lg font-bold">Minecraft-Profil</h2>
                        <div className="mt-5 flex items-center gap-4">
                            <img
                                className="h-16 w-16 rounded-2xl bg-black/30 [image-rendering:pixelated]"
                                src={playerAvatar(profile.playerId, 128)}
                                alt=""
                            />
                            <div className="min-w-0">
                                <small className="text-[10px] font-extrabold uppercase tracking-[.15em] text-zinc-600">
                                    Minecraft-Spieler
                                </small>
                                <b className="mt-1 block truncate font-display text-xl">{profile.username}</b>
                            </div>
                        </div>
                        <p className="mt-5 text-sm leading-7 text-zinc-500">
                            Verifiziert über den SeriuxMod Launcher und eindeutig mit dieser Minecraft-UUID verbunden.
                        </p>
                    </div>
                    <div className="forum-panel rounded-3xl p-6">
                        <h2 className="font-display text-lg font-bold">Profil teilen</h2>
                        <div className="mt-4 break-all rounded-xl border border-white/[.06] bg-black/20 px-4 py-3 font-mono text-[10px] text-zinc-500">
                            seriuxmod.net/@{profile.username}
                        </div>
                    </div>
                </aside>

                <div className="space-y-6">
                    <section className="forum-panel overflow-hidden rounded-3xl">
                        <header className="flex items-center justify-between border-b border-white/[.06] px-6 py-5">
                            <h2 className="font-display text-lg font-bold">Profilinformationen</h2>
                            <span className="text-[10px] font-bold uppercase tracking-[.14em] text-zinc-600">
                                Seriux-ID
                            </span>
                        </header>
                        <div className="space-y-2 p-4">
                            {profileFacts.map(([number, label, value]) => (
                                <div
                                    key={label}
                                    className="grid min-h-14 grid-cols-[34px_135px_minmax(0,1fr)] items-center gap-3 rounded-xl border border-white/[.04] bg-black/20 px-4 py-3"
                                >
                                    <b className="font-mono text-sm text-orange-500">{number}</b>
                                    <span className="text-xs text-zinc-600">{label}</span>
                                    <span
                                        className={`truncate text-right text-xs font-bold text-zinc-300 ${label === 'Minecraft UUID' ? 'font-mono text-[10px]' : ''}`}
                                    >
                                        {value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="grid gap-4 sm:grid-cols-3">
                        {stats.map(([Icon, label, value]) => (
                            <div className="forum-panel rounded-3xl p-6" key={label}>
                                <Icon className="text-orange-400" />
                                <b className="mt-5 block font-display text-4xl">{value}</b>
                                <span className="mt-1 block text-xs text-zinc-600">{label} im Forum</span>
                            </div>
                        ))}
                    </div>

                    <section className="forum-panel overflow-hidden rounded-3xl">
                        <header className="flex items-center justify-between gap-4 border-b border-white/[.06] p-6">
                            <div>
                                <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-orange-400">
                                    Community
                                </p>
                                <h2 className="mt-2 font-display text-2xl font-bold">Letzte Beiträge</h2>
                            </div>
                            <Link to={`/forum/user/${profile.playerId}`} className="forum-button-secondary">
                                Forum-Profil
                            </Link>
                        </header>
                        {(forum?.recentPosts ?? []).length === 0 ? (
                            <p className="p-8 text-sm text-zinc-500">
                                Noch keine öffentlichen Forenbeiträge vorhanden.
                            </p>
                        ) : (
                            forum.recentPosts.map((post) => (
                                <Link
                                    key={post.postId}
                                    to={`/forum/topic/${post.topicId}#post-${post.postId}`}
                                    className="block border-b border-white/[.055] p-6 transition last:border-0 hover:bg-white/[.025]"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <b className="truncate font-display text-lg">{post.topicTitle}</b>
                                        <span className="shrink-0 text-[10px] text-zinc-600">
                                            {post.reactions} Reaktionen
                                        </span>
                                    </div>
                                    <p className="mt-3 line-clamp-2 text-sm leading-7 text-zinc-500">
                                        {post.contentPreview}
                                    </p>
                                </Link>
                            ))
                        )}
                    </section>
                </div>
            </section>
        </main>
    );
}

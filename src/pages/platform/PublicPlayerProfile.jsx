import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    FaArrowUpRightFromSquare,
    FaCalendarDays,
    FaCheck,
    FaClock,
    FaComments,
    FaCopy,
    FaHeart,
    FaLink,
    FaMessage,
    FaRegBell,
    FaShieldHalved,
    FaUserCheck
} from 'react-icons/fa6';
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

function formatActivityDate(value) {
    if (!value) return 'Noch keine Aktivität';
    return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(value));
}

export default function PublicPlayerProfile() {
    const { profileSlug } = useParams();
    const username = profileSlug?.startsWith('@') ? profileSlug.slice(1) : profileSlug;
    const [state, setState] = useState({ loading: true, profile: null, forum: null, error: '' });
    const [copied, setCopied] = useState('');
    const currentUser = getAuthenticatedUser();

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
    const recentPosts = forum?.recentPosts ?? [];
    const latestActivity = recentPosts[0]?.createdAt;
    const profileUrl = `${window.location.origin}/@${profile.username}`;
    const stats = [
        [FaComments, 'Themen', forum?.topicsCreated ?? 0],
        [FaMessage, 'Beiträge', forum?.postsCreated ?? 0],
        [FaHeart, 'Erhaltene Reaktionen', forum?.reactionsReceived ?? 0],
        [FaRegBell, 'Gefolgte Themen', forum?.followedTopics ?? 0],
        [FaUserCheck, 'Vergebene Reaktionen', forum?.reactionsGiven ?? 0]
    ];

    const copyValue = async (value, type) => {
        await navigator.clipboard.writeText(value);
        setCopied(type);
        window.setTimeout(() => setCopied(''), 1600);
    };

    return (
        <main className="min-h-screen overflow-hidden bg-[#07080b] pb-24 text-white">
            <section className="relative px-4 pb-8 pt-28 sm:px-6 sm:pt-32">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[650px] bg-[radial-gradient(circle_at_18%_12%,rgba(59,130,246,.20),transparent_34rem),radial-gradient(circle_at_82%_16%,rgba(249,115,22,.16),transparent_30rem)]" />
                <div className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[34px] border border-white/[.08] bg-[#0d1017] shadow-[0_32px_100px_rgba(0,0,0,.45)]">
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(37,99,235,.14),transparent_42%,rgba(249,115,22,.08))]" />
                    <div className="pointer-events-none absolute inset-0 opacity-[.13] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:54px_54px] [mask-image:linear-gradient(to_bottom,black,transparent_76%)]" />

                    <div className="relative grid min-h-[440px] items-end gap-6 px-6 pt-14 sm:px-10 lg:grid-cols-[390px_1fr] lg:gap-12 lg:px-14">
                        <div className="relative mx-auto flex h-[360px] w-full max-w-[330px] items-end justify-center">
                            <div className="absolute bottom-5 h-20 w-56 rounded-full bg-orange-500/15 blur-3xl" />
                            <div className="absolute bottom-3 h-10 w-52 rounded-[50%] border border-white/[.07] bg-black/50 shadow-[0_18px_50px_rgba(0,0,0,.65)]" />
                            <img
                                className="relative z-10 h-[340px] w-full object-contain object-bottom drop-shadow-[0_28px_24px_rgba(0,0,0,.62)] [image-rendering:pixelated]"
                                src={playerBody(profile.username)}
                                alt={`Minecraft-Skin von ${profile.username}`}
                            />
                        </div>

                        <div className="min-w-0 pb-14 text-center lg:text-left">
                            <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-zinc-400">
                                    Öffentliches Profil
                                </span>
                                {isOwnProfile && (
                                    <span className="rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.16em] text-orange-300">
                                        Dein Profil
                                    </span>
                                )}
                            </div>
                            <h1 className="mt-5 truncate font-display text-5xl font-bold tracking-[-.055em] sm:text-7xl">
                                {profile.username}
                            </h1>
                            <button
                                type="button"
                                onClick={() => copyValue(profile.playerId, 'uuid')}
                                className="mx-auto mt-4 inline-flex max-w-full items-center gap-2 rounded-xl px-2 py-1 font-mono text-[11px] text-zinc-500 transition hover:bg-white/[.04] hover:text-zinc-300 lg:mx-0"
                            >
                                <span className="truncate">UUID {profile.playerId}</span>
                                {copied === 'uuid' ? <FaCheck className="text-emerald-400" /> : <FaCopy />}
                            </button>
                            <div className="mt-5 flex flex-wrap justify-center gap-3 lg:justify-start">
                                <span
                                    className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold"
                                    style={{ borderColor: `${color}55`, background: `${color}18`, color }}
                                >
                                    <span className="relative grid h-5 w-5 place-items-center">
                                        <FaShieldHalved />
                                        {profile.rank?.badgeUrl && (
                                            <img
                                                className="absolute inset-0 h-5 w-5 object-contain"
                                                src={profile.rank.badgeUrl}
                                                alt=""
                                                onError={(event) => event.currentTarget.remove()}
                                            />
                                        )}
                                    </span>
                                    {profile.rank?.displayName || 'User'}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3.5 py-2 text-xs text-zinc-400">
                                    <FaCalendarDays className="text-orange-400" />{' '}
                                    {formatMemberSince(profile.memberSince)}
                                </span>
                            </div>
                            <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
                                <Link to={`/forum/user/${profile.playerId}`} className="forum-button-primary">
                                    <FaComments /> Forum-Aktivität
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => copyValue(profileUrl, 'profile')}
                                    className="forum-button-secondary"
                                >
                                    {copied === 'profile' ? <FaCheck /> : <FaLink />}
                                    {copied === 'profile' ? 'Link kopiert' : 'Profil teilen'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="relative grid border-t border-white/[.07] bg-black/20 sm:grid-cols-3">
                        <div className="flex items-center gap-4 border-b border-white/[.06] px-6 py-5 sm:border-b-0 sm:border-r">
                            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400">
                                <FaUserCheck />
                            </span>
                            <div>
                                <small className="block text-[9px] font-bold uppercase tracking-[.14em] text-zinc-600">
                                    Identität
                                </small>
                                <b className="mt-1 block text-sm">Minecraft verifiziert</b>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 border-b border-white/[.06] px-6 py-5 sm:border-b-0 sm:border-r">
                            <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500/10 text-orange-400">
                                <FaShieldHalved />
                            </span>
                            <div className="min-w-0">
                                <small className="block text-[9px] font-bold uppercase tracking-[.14em] text-zinc-600">
                                    Community-Rang
                                </small>
                                <b className="mt-1 block truncate text-sm">{profile.rank?.displayName || 'User'}</b>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 px-6 py-5">
                            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-400">
                                <FaClock />
                            </span>
                            <div className="min-w-0">
                                <small className="block text-[9px] font-bold uppercase tracking-[.14em] text-zinc-600">
                                    Letzte Forum-Aktivität
                                </small>
                                <b className="mt-1 block truncate text-sm">{formatActivityDate(latestActivity)}</b>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto grid max-w-[1180px] gap-6 px-4 sm:px-6 lg:grid-cols-[330px_minmax(0,1fr)]">
                <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
                    <div className="forum-panel overflow-hidden rounded-3xl p-6">
                        <div className="flex items-center gap-4">
                            <img
                                className="h-16 w-16 rounded-2xl border border-white/[.08] bg-black/30 [image-rendering:pixelated]"
                                src={playerAvatar(profile.playerId, 128)}
                                alt={`Kopf von ${profile.username}`}
                            />
                            <div className="min-w-0">
                                <small className="text-[9px] font-extrabold uppercase tracking-[.15em] text-zinc-600">
                                    Minecraft-Spieler
                                </small>
                                <b className="mt-1 block truncate font-display text-xl">{profile.username}</b>
                            </div>
                        </div>
                        <dl className="mt-6 divide-y divide-white/[.055] border-y border-white/[.055]">
                            <div className="flex items-center justify-between gap-4 py-4">
                                <dt className="text-xs text-zinc-600">Rang</dt>
                                <dd className="text-xs font-bold" style={{ color }}>
                                    {profile.rank?.displayName || 'User'}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-4 py-4">
                                <dt className="text-xs text-zinc-600">Status</dt>
                                <dd className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Verifiziert
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-4 py-4">
                                <dt className="text-xs text-zinc-600">Profil</dt>
                                <dd className="text-xs font-bold text-zinc-300">Öffentlich</dd>
                            </div>
                        </dl>
                        <p className="mt-5 text-xs leading-6 text-zinc-600">
                            Dieses Profil ist eindeutig mit der Minecraft-UUID des Spielers verbunden.
                        </p>
                    </div>

                    <div className="forum-panel rounded-3xl p-6">
                        <h2 className="font-display text-lg font-bold">Profil teilen</h2>
                        <button
                            type="button"
                            onClick={() => copyValue(profileUrl, 'sidebar')}
                            className="mt-4 flex w-full items-center gap-3 rounded-xl border border-white/[.06] bg-black/20 px-4 py-3 text-left transition hover:border-orange-500/20 hover:bg-orange-500/[.04]"
                        >
                            <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-zinc-500">
                                seriuxmod.net/@{profile.username}
                            </span>
                            {copied === 'sidebar' ? (
                                <FaCheck className="text-emerald-400" />
                            ) : (
                                <FaCopy className="text-zinc-600" />
                            )}
                        </button>
                    </div>
                </aside>

                <div className="min-w-0 space-y-6">
                    <section className="forum-panel rounded-3xl p-6 sm:p-7">
                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-orange-400">
                                    Community
                                </p>
                                <h2 className="mt-2 font-display text-2xl font-bold">Profilstatistiken</h2>
                            </div>
                            <span className="hidden text-[10px] text-zinc-600 sm:block">Öffentliche Aktivität</span>
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                            {stats.map(([Icon, label, value]) => (
                                <div className="rounded-2xl border border-white/[.06] bg-black/20 p-4" key={label}>
                                    <Icon className="text-sm text-orange-400" />
                                    <b className="mt-5 block font-display text-3xl">{value}</b>
                                    <span className="mt-1 block text-[10px] leading-4 text-zinc-600">{label}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="forum-panel overflow-hidden rounded-3xl">
                        <header className="flex items-center justify-between gap-4 border-b border-white/[.06] p-6 sm:p-7">
                            <div>
                                <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-orange-400">
                                    Aktivität
                                </p>
                                <h2 className="mt-2 font-display text-2xl font-bold">Letzte Beiträge</h2>
                            </div>
                            <Link to={`/forum/user/${profile.playerId}`} className="forum-button-secondary">
                                Alle ansehen <FaArrowUpRightFromSquare />
                            </Link>
                        </header>
                        {recentPosts.length === 0 ? (
                            <p className="p-8 text-sm text-zinc-500">
                                Noch keine öffentlichen Forenbeiträge vorhanden.
                            </p>
                        ) : (
                            <div>
                                {recentPosts.map((post) => (
                                    <Link
                                        key={post.postId}
                                        to={`/forum/topic/${post.topicId}#post-${post.postId}`}
                                        className="group grid gap-4 border-b border-white/[.055] p-6 transition last:border-0 hover:bg-white/[.025] sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:items-start sm:p-7"
                                    >
                                        <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/[.06] bg-black/20 font-mono text-[10px] text-zinc-600 transition group-hover:border-orange-500/20 group-hover:text-orange-400">
                                            #{post.postNumber}
                                        </span>
                                        <span className="min-w-0">
                                            <b className="block truncate font-display text-base transition group-hover:text-orange-300">
                                                {post.topicTitle}
                                            </b>
                                            <span className="mt-2 line-clamp-2 block text-sm leading-6 text-zinc-500">
                                                {post.contentPreview}
                                            </span>
                                            <span className="mt-3 flex items-center gap-2 text-[10px] text-zinc-700">
                                                <FaClock /> {formatActivityDate(post.createdAt)}
                                            </span>
                                        </span>
                                        <span className="inline-flex items-center gap-2 text-[10px] text-zinc-600">
                                            <FaHeart /> {post.reactions}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </section>
        </main>
    );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
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
    if (!value) return 'Nicht verfügbar';
    return new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(new Date(value));
}

export default function PublicPlayerProfile() {
    const { profileSlug } = useParams();
    const username = profileSlug?.startsWith('@') ? profileSlug.slice(1) : profileSlug;
    const [state, setState] = useState({ loading: true, profile: null, forum: null, error: '' });
    const [copied, setCopied] = useState(false);
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
            <main className="grid min-h-screen place-items-center bg-[#08090c] px-5 pt-24 text-white">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-orange-500" />
                    <p className="mt-5 text-sm text-zinc-500">Spielerprofil wird geladen …</p>
                </div>
            </main>
        );
    }

    if (state.error) {
        return (
            <main className="grid min-h-screen place-items-center bg-[#08090c] px-5 pt-24 text-white">
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

    const copyUuid = async () => {
        await navigator.clipboard.writeText(profile.playerId);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
    };

    return (
        <main className="min-h-screen bg-[#08090c] pb-24 text-white">
            <section className="relative overflow-hidden border-b border-white/[.06] bg-[radial-gradient(circle_at_70%_12%,rgba(249,115,22,.18),transparent_28rem),linear-gradient(135deg,#17233d_0%,#101624_42%,#08090c_80%)] px-5 pb-14 pt-36 sm:pb-20 sm:pt-44">
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_35%,#08090c)]" />
                <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-8 sm:flex-row sm:items-end sm:gap-12">
                    <div className="relative h-64 w-52 shrink-0 sm:h-80 sm:w-60">
                        <div className="absolute inset-x-3 bottom-2 h-16 rounded-full bg-orange-500/20 blur-3xl" />
                        <img
                            className="relative h-full w-full object-contain drop-shadow-[0_28px_24px_rgba(0,0,0,.55)] [image-rendering:pixelated]"
                            src={playerBody(profile.username)}
                            alt={`Minecraft-Skin von ${profile.username}`}
                        />
                    </div>
                    <div className="min-w-0 flex-1 pb-4 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
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
                            onClick={copyUuid}
                            className="mx-auto mt-4 inline-flex max-w-full items-center gap-2 rounded-xl px-2 py-1 font-mono text-[11px] text-zinc-500 transition hover:bg-white/[.04] hover:text-zinc-300 sm:mx-0"
                        >
                            <span className="truncate">UUID {profile.playerId}</span>
                            {copied ? <FaCheck className="text-emerald-400" /> : <FaCopy />}
                        </button>
                        <div className="mt-5 flex flex-wrap justify-center gap-3 sm:justify-start">
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
                                {profile.memberSince
                                    ? `Seit ${formatMemberSince(profile.memberSince)} dabei`
                                    : 'SeriuxMod Mitglied'}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto -mt-3 grid max-w-6xl gap-6 px-5 lg:grid-cols-[320px_1fr]">
                <aside className="space-y-6">
                    <div className="forum-panel overflow-hidden rounded-3xl p-6">
                        <div className="flex items-center gap-4">
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

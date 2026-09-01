import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    FaCalendarDays,
    FaChartColumn,
    FaCheck,
    FaCircle,
    FaComments,
    FaCopy,
    FaGamepad,
    FaGlobe,
    FaHeart,
    FaMessage,
    FaRocket,
    FaShieldHalved,
    FaUsers
} from 'react-icons/fa6';
import { Link, useParams } from 'react-router-dom';
import { forumApi } from '../../lib/forumApi';
import { getAuthenticatedUser } from '../../lib/auth';
import { playerAvatar, playerBody, userApi } from '../../lib/userApi';
import { socialApi } from '../../lib/socialApi';

const PRESENCE_LABELS = {
    CLIENT: 'Client',
    LAUNCHER: 'Launcher',
    WEBSITE: 'Webseite'
};

function rankColor(color) {
    if (!Number.isFinite(color)) return '#f97316';
    return `#${((color >>> 0) & 0xffffff).toString(16).padStart(6, '0')}`;
}

function formatMemberSince(value) {
    if (!value) return 'SeriuxMod Mitglied';
    return `Dabei seit ${new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(new Date(value))}`;
}

function formatDate(value, fallback = 'Noch nicht erfasst') {
    if (!value) return fallback;
    return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).format(new Date(value));
}

function formatLastOnline(value, online) {
    if (online) return 'Jetzt';
    if (!value) return 'Noch nicht erfasst';
    const date = new Date(value);
    const today = new Date();
    const sameDay = date.toDateString() === today.toDateString();
    return new Intl.DateTimeFormat(
        'de-DE',
        sameDay ? { hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: 'short', year: 'numeric' }
    ).format(date);
}

function activityWeeks(activity = []) {
    const byDate = new Map(activity.map((entry) => [entry.date, entry]));
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const mondayOffset = (today.getUTCDay() + 6) % 7;
    const start = new Date(today);
    start.setUTCDate(today.getUTCDate() - mondayOffset - 15 * 7);

    return Array.from({ length: 16 }, (_, weekIndex) =>
        Array.from({ length: 7 }, (_, dayIndex) => {
            const date = new Date(start);
            date.setUTCDate(start.getUTCDate() + weekIndex * 7 + dayIndex);
            const key = date.toISOString().slice(0, 10);
            return {
                key,
                date,
                future: date > today,
                ...(byDate.get(key) || { events: 0, surfaces: [] })
            };
        })
    );
}

function activityLevel(events = 0) {
    if (events >= 12) return 'bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,.38)]';
    if (events >= 6) return 'bg-orange-600';
    if (events >= 2) return 'bg-orange-800';
    if (events >= 1) return 'bg-orange-950';
    return 'bg-white/[.055]';
}

export default function PublicPlayerProfile() {
    const { profileSlug } = useParams();
    const username = profileSlug?.startsWith('@') ? profileSlug.slice(1) : profileSlug;
    const [state, setState] = useState({
        loading: true,
        profile: null,
        forum: null,
        presence: null,
        friends: [],
        error: ''
    });
    const [copied, setCopied] = useState('');
    const currentUser = getAuthenticatedUser();
    const identityRef = useRef(null);

    const load = useCallback(
        async (signal) => {
            setState({ loading: true, profile: null, forum: null, presence: null, friends: [], error: '' });
            try {
                const profile = await userApi.byUsername(username, signal);
                const [forum, presence, friendRelations] = await Promise.all([
                    forumApi.userProfile(profile.playerId, 6).catch(() => null),
                    socialApi.presence.public(profile.playerId, 112, signal).catch(() => null),
                    socialApi.profiles.friends(profile.playerId, 100, signal).catch(() => [])
                ]);
                const friendProfiles = await userApi
                    .batch(
                        friendRelations.map((friend) => friend.friendUserId),
                        signal
                    )
                    .catch(() => []);
                const profilesById = new Map(friendProfiles.map((friend) => [friend.playerId, friend]));
                const friends = friendRelations
                    .map((relation) => {
                        const friend = profilesById.get(relation.friendUserId);
                        return friend ? { ...friend, friendsSince: relation.friendsSince } : null;
                    })
                    .filter(Boolean);
                setState({ loading: false, profile, forum, presence, friends, error: '' });
            } catch (error) {
                if (error.name !== 'AbortError') {
                    setState({
                        loading: false,
                        profile: null,
                        forum: null,
                        presence: null,
                        friends: [],
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

    const { profile, forum, presence, friends } = state;
    const color = rankColor(profile.rank?.color);
    const online = Boolean(presence?.online);
    const surfaces = presence?.surfaces || [];
    const lastOnline = presence?.lastSeenAt || profile.lastOnline;
    const weeks = activityWeeks(presence?.activity);
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
                            <span
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.14em] ${
                                    online
                                        ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
                                        : 'border-white/[.08] bg-black/20 text-zinc-500'
                                }`}
                            >
                                <span className="relative grid h-2 w-2 place-items-center">
                                    {online && (
                                        <span className="absolute h-2 w-2 animate-ping rounded-full bg-emerald-400/50" />
                                    )}
                                    <FaCircle
                                        className={`relative text-[7px] ${online ? 'text-emerald-400' : 'text-zinc-700'}`}
                                    />
                                </span>
                                {online
                                    ? `Online · ${surfaces.map((surface) => PRESENCE_LABELS[surface] || surface).join(', ')}`
                                    : 'Offline'}
                            </span>
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

                <div className="min-w-0 space-y-6">
                    <section className="forum-panel min-w-0 rounded-3xl p-6 sm:p-7">
                        <header className="flex items-center gap-3">
                            <FaChartColumn className="text-sky-400" />
                            <h2 className="font-display text-lg font-bold">SeriuxMod Stats</h2>
                        </header>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/[.055] bg-white/[.025] px-5 py-6 text-center">
                                <b className="block break-words font-display text-xl tracking-tight text-white sm:text-3xl">
                                    {formatDate(profile.memberSince)}
                                </b>
                                <span className="mt-2 block text-[10px] uppercase tracking-[.12em] text-zinc-600">
                                    Beigetreten
                                </span>
                            </div>
                            <div className="rounded-2xl border border-white/[.055] bg-white/[.025] px-5 py-6 text-center">
                                <b className="block break-words font-display text-xl tracking-tight text-white sm:text-3xl">
                                    {formatLastOnline(lastOnline, online)}
                                </b>
                                <span className="mt-2 block text-[10px] uppercase tracking-[.12em] text-zinc-600">
                                    Zuletzt online
                                </span>
                            </div>
                        </div>
                        <div className="mt-3 flex flex-col justify-between gap-4 rounded-2xl border border-white/[.055] bg-black/20 px-5 py-4 sm:flex-row sm:items-center">
                            <div>
                                <span className="text-[10px] uppercase tracking-[.12em] text-zinc-600">
                                    Aktive Verbindung
                                </span>
                                <b className="mt-1 block text-sm text-zinc-200">
                                    {online ? 'SeriuxMod ist gerade verbunden' : 'Aktuell keine aktive Sitzung'}
                                </b>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(online ? surfaces : ['OFFLINE']).map((surface) => (
                                    <span
                                        key={surface}
                                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold ${
                                            online
                                                ? 'border-emerald-400/20 bg-emerald-400/[.08] text-emerald-300'
                                                : 'border-white/[.07] text-zinc-600'
                                        }`}
                                    >
                                        {surface === 'CLIENT' && <FaGamepad />}
                                        {surface === 'LAUNCHER' && <FaRocket />}
                                        {surface === 'WEBSITE' && <FaGlobe />}
                                        <FaCircle className="text-[6px]" />
                                        {PRESENCE_LABELS[surface] || 'Offline'}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="forum-panel min-w-0 rounded-3xl p-6 sm:p-7">
                        <header className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <FaCalendarDays className="text-sky-400" />
                                <h2 className="font-display text-lg font-bold">Aktivität</h2>
                            </div>
                            <span
                                className={`flex items-center gap-2 text-[10px] font-bold ${online ? 'text-emerald-300' : 'text-zinc-600'}`}
                            >
                                <FaCircle className="text-[6px]" /> {online ? 'Online' : 'Offline'}
                            </span>
                        </header>
                        <div className="mt-6 overflow-x-auto pb-2">
                            <div className="min-w-[570px]">
                                <div className="mb-2 grid grid-cols-[34px_1fr] gap-3 text-[9px] font-bold uppercase tracking-[.1em] text-zinc-700">
                                    <span />
                                    <div className="flex justify-between px-1">
                                        <span>Vor 4 Monaten</span>
                                        <span>Heute</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-[34px_1fr] gap-3">
                                    <div className="grid grid-rows-7 gap-1.5 py-0.5 text-[9px] text-zinc-700">
                                        {['Mo', '', 'Mi', '', 'Fr', '', 'So'].map((day, index) => (
                                            <span key={`${day}-${index}`} className="flex h-5 items-center">
                                                {day}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-1.5">
                                        {weeks.map((week, weekIndex) => (
                                            <div key={weekIndex} className="grid flex-1 grid-rows-7 gap-1.5">
                                                {week.map((day) => (
                                                    <span
                                                        key={day.key}
                                                        title={`${formatDate(day.date)} · ${day.events || 0} Aktivitätspunkte${
                                                            day.surfaces?.length
                                                                ? ` · ${day.surfaces.map((surface) => PRESENCE_LABELS[surface] || surface).join(', ')}`
                                                                : ''
                                                        }`}
                                                        className={`h-5 min-w-5 rounded-[5px] border border-white/[.025] ${
                                                            day.future ? 'opacity-20' : activityLevel(day.events)
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-end gap-1.5 text-[9px] text-zinc-700">
                            <span>Weniger</span>
                            {[0, 1, 2, 6, 12].map((value) => (
                                <span key={value} className={`h-3 w-3 rounded-[3px] ${activityLevel(value)}`} />
                            ))}
                            <span>Mehr</span>
                        </div>
                    </section>

                    <section className="forum-panel min-w-0 rounded-3xl p-6 sm:p-7">
                        <header className="flex items-center gap-3">
                            <FaUsers className="text-sky-400" />
                            <h2 className="font-display text-lg font-bold">Freunde</h2>
                            <span className="rounded-full bg-white/[.06] px-2 py-0.5 text-[10px] font-bold text-zinc-500">
                                {friends.length}
                            </span>
                        </header>
                        {friends.length === 0 ? (
                            <p className="mt-5 break-words rounded-2xl border border-dashed border-white/[.07] p-6 text-sm text-zinc-600">
                                Dieses Profil hat noch keine öffentlichen Freundschaften.
                            </p>
                        ) : (
                            <div className="mt-5 flex flex-wrap gap-2">
                                {friends.map((friend) => (
                                    <Link
                                        key={friend.playerId}
                                        to={`/@${encodeURIComponent(friend.username)}`}
                                        className="group inline-flex max-w-full items-center gap-2 rounded-full border border-white/[.075] bg-white/[.025] py-1.5 pl-1.5 pr-3 text-xs font-bold text-zinc-400 transition hover:border-orange-500/25 hover:bg-orange-500/[.07] hover:text-white"
                                    >
                                        <img
                                            className="h-6 w-6 rounded-full bg-black/30 [image-rendering:pixelated]"
                                            src={playerAvatar(friend.playerId, 48)}
                                            alt=""
                                        />
                                        <span className="truncate">{friend.username}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

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
                        <header className="border-b border-white/[.06] p-6">
                            <div>
                                <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-orange-400">
                                    Community
                                </p>
                                <h2 className="mt-2 font-display text-2xl font-bold">Letzte Beiträge</h2>
                            </div>
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

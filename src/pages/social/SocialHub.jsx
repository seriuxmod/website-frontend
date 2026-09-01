import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    FaArrowRight,
    FaCheck,
    FaClockRotateLeft,
    FaCopy,
    FaCrown,
    FaGear,
    FaGlobe,
    FaLock,
    FaMagnifyingGlass,
    FaPlus,
    FaRightToBracket,
    FaRotate,
    FaShieldHalved,
    FaTrash,
    FaUserPlus,
    FaUsers,
    FaXmark
} from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import { beginLogin, fetchAuthenticatedUser, getAuthenticatedUser } from '../../lib/auth';
import { socialApi } from '../../lib/socialApi';
import { playerAvatar, userApi } from '../../lib/userApi';
import { ForumError, ForumLoading, ForumShell, Pagination } from '../forum/ForumComponents';

const tabs = [
    { key: 'clans', label: 'Clans', to: '/clans', icon: FaCrown },
    { key: 'friends', label: 'Freunde', to: '/friends', icon: FaUsers },
    { key: 'party', label: 'Party', to: '/party', icon: FaShieldHalved }
];

const uuidPattern = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
const profileCache = new Map();

const formatDate = (value) =>
    value
        ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
        : 'Unbekannt';

const nullable = async (promise) => {
    try {
        return await promise;
    } catch (error) {
        if (error.status === 404) return null;
        throw error;
    }
};

async function resolvePlayer(value) {
    const target = value.trim();
    if (!target) throw new Error('Bitte gib einen Minecraft-Namen oder eine UUID ein.');
    if (uuidPattern.test(target)) return target;
    const profile = await userApi.byUsername(target);
    if (!profile?.playerId) throw new Error('Der Spieler konnte nicht gefunden werden.');
    return profile.playerId;
}

function usePlayer(playerId) {
    const [profile, setProfile] = useState(() => profileCache.get(playerId) || null);
    useEffect(() => {
        if (!playerId || profileCache.has(playerId)) return;
        let active = true;
        userApi
            .byId(playerId)
            .then((result) => {
                profileCache.set(playerId, result);
                if (active) setProfile(result);
            })
            .catch(() => {
                if (active) setProfile(null);
            });
        return () => {
            active = false;
        };
    }, [playerId]);
    return profile;
}

function PlayerIdentity({ playerId, subtitle, compact = false }) {
    const profile = usePlayer(playerId);
    const username = profile?.username || 'Minecraft-Spieler';
    return (
        <Link
            to={profile?.username ? `/@${encodeURIComponent(profile.username)}` : '#'}
            className="flex min-w-0 items-center gap-3 rounded-xl transition hover:opacity-80"
            onClick={(event) => !profile?.username && event.preventDefault()}
        >
            <img
                src={playerAvatar(playerId, compact ? 48 : 64)}
                alt=""
                className={`${compact ? 'h-9 w-9 rounded-lg' : 'h-12 w-12 rounded-xl'} bg-black/30 [image-rendering:pixelated]`}
            />
            <span className="min-w-0">
                <b className="block truncate text-sm text-zinc-100">{username}</b>
                <small className="mt-0.5 block truncate text-[11px] text-zinc-600">
                    {subtitle || profile?.rank?.displayName || playerId}
                </small>
            </span>
        </Link>
    );
}

function Feedback({ notice }) {
    if (!notice?.message) return null;
    return (
        <div
            className={`mb-5 rounded-2xl border px-5 py-4 text-sm ${
                notice.type === 'error'
                    ? 'border-red-500/20 bg-red-500/[.07] text-red-200'
                    : 'border-emerald-500/20 bg-emerald-500/[.07] text-emerald-200'
            }`}
            role="status"
        >
            {notice.message}
        </div>
    );
}

function EmptyState({ icon: Icon = FaUsers, title, copy, action }) {
    return (
        <div className="forum-panel rounded-3xl px-6 py-12 text-center sm:px-10">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-orange-500/10 text-xl text-orange-300">
                <Icon />
            </span>
            <h2 className="mt-5 font-display text-2xl font-bold">{title}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-500">{copy}</p>
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}

function AuthGate({ section }) {
    return (
        <EmptyState
            icon={FaLock}
            title={`Melde dich für ${section} an`}
            copy="Deine Social-Daten sind an deine Minecraft-UUID gebunden. Die Anmeldung stellt sicher, dass ausschließlich du Freundschaften, Einladungen und Mitgliedschaften verwalten kannst."
            action={
                <button className="forum-button-primary" onClick={() => beginLogin(window.location.pathname)}>
                    <FaRightToBracket /> Mit Minecraft anmelden
                </button>
            }
        />
    );
}

export default function SocialHub({ initialTab = 'clans' }) {
    const [user, setUser] = useState(() => getAuthenticatedUser());
    useEffect(() => {
        let active = true;
        fetchAuthenticatedUser().then((profile) => active && setUser(profile));
        const changed = () => fetchAuthenticatedUser().then((profile) => active && setUser(profile));
        window.addEventListener('seriux-auth-changed', changed);
        return () => {
            active = false;
            window.removeEventListener('seriux-auth-changed', changed);
        };
    }, []);

    return (
        <ForumShell
            eyebrow="SERIUXMOD SOCIAL"
            title="Gemeinsam statt allein."
            description="Finde deinen Clan, verbinde dich mit Freunden und organisiere deine nächste Session in einer Party – direkt über dein verifiziertes Minecraft-Profil."
            rootBreadcrumb={{ label: 'Social' }}
        >
            <nav className="forum-panel mb-7 grid gap-2 rounded-2xl p-2 sm:grid-cols-3" aria-label="Social-Bereiche">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <Link
                            key={tab.key}
                            to={tab.to}
                            className={`flex items-center justify-center gap-3 rounded-xl px-5 py-3.5 text-sm font-bold transition ${
                                initialTab === tab.key
                                    ? 'bg-orange-500 text-white shadow-[0_12px_30px_rgba(249,115,22,.18)]'
                                    : 'text-zinc-500 hover:bg-white/[.04] hover:text-white'
                            }`}
                        >
                            <Icon /> {tab.label}
                        </Link>
                    );
                })}
            </nav>
            {initialTab === 'clans' && <ClansPanel user={user} />}
            {initialTab === 'friends' && (user ? <FriendsPanel /> : <AuthGate section="deine Freunde" />)}
            {initialTab === 'party' && (user ? <PartyPanel user={user} /> : <AuthGate section="deine Party" />)}
        </ForumShell>
    );
}

function ClansPanel({ user }) {
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    const [catalog, setCatalog] = useState(null);
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [catalogError, setCatalogError] = useState('');
    const [selectedClan, setSelectedClan] = useState(null);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [privateState, setPrivateState] = useState({ loading: Boolean(user), clan: null, invites: [] });
    const [members, setMembers] = useState([]);
    const [ranks, setRanks] = useState([]);
    const [requests, setRequests] = useState([]);
    const [notice, setNotice] = useState(null);
    const [pending, setPending] = useState('');
    const [createForm, setCreateForm] = useState({ name: '', tag: '', description: '', open: true });
    const [editForm, setEditForm] = useState({ name: '', description: '', open: true });
    const [inviteTarget, setInviteTarget] = useState('');
    const [rankForm, setRankForm] = useState({
        key: '',
        priority: 10,
        canInvite: false,
        canKick: false,
        canPromote: false,
        canEditClan: false
    });

    const loadCatalog = useCallback(
        (signal) => {
            setCatalogLoading(true);
            setCatalogError('');
            socialApi.clans
                .public(query, page, 12, signal)
                .then(setCatalog)
                .catch((error) => error.name !== 'AbortError' && setCatalogError(error.message))
                .finally(() => setCatalogLoading(false));
        },
        [page, query]
    );

    useEffect(() => {
        const controller = new AbortController();
        const timer = window.setTimeout(() => loadCatalog(controller.signal), 220);
        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [loadCatalog]);

    const loadPrivate = useCallback(async () => {
        if (!user) return setPrivateState({ loading: false, clan: null, invites: [] });
        setPrivateState((current) => ({ ...current, loading: true }));
        try {
            const [clan, invites] = await Promise.all([nullable(socialApi.clans.mine()), socialApi.clans.invites()]);
            setPrivateState({ loading: false, clan, invites });
            if (clan) {
                const [clanMembers, clanRanks, joinRequests] = await Promise.all([
                    socialApi.clans.members(clan.id),
                    socialApi.clans.ranks(clan.id),
                    socialApi.clans.requests(clan.id).catch(() => [])
                ]);
                setMembers(clanMembers);
                setRanks(clanRanks);
                setRequests(joinRequests);
                setEditForm({ name: clan.name, description: clan.description || '', open: clan.open });
            } else {
                setMembers([]);
                setRanks([]);
                setRequests([]);
            }
        } catch (error) {
            setNotice({ type: 'error', message: error.message });
            setPrivateState((current) => ({ ...current, loading: false }));
        }
    }, [user]);

    useEffect(() => {
        loadPrivate();
    }, [loadPrivate]);

    const act = async (key, action, message, refresh = loadPrivate) => {
        setPending(key);
        setNotice(null);
        try {
            await action();
            setNotice({ type: 'success', message });
            await refresh?.();
            loadCatalog();
        } catch (error) {
            setNotice({ type: 'error', message: error.message });
        } finally {
            setPending('');
        }
    };

    const openClan = async (clan) => {
        setSelectedClan(clan);
        try {
            setSelectedMembers(await socialApi.clans.publicMembers(clan.id));
        } catch {
            setSelectedMembers([]);
        }
    };

    const clan = privateState.clan;
    const owner = clan && user?.playerId === clan.ownerUserId;
    const ownMembership = members.find((member) => member.userId === user?.playerId);
    const ownRank = ranks.find((rank) => rank.key === ownMembership?.rankKey);
    const canInvite = Boolean(owner || ownRank?.canInvite);
    const canKick = Boolean(owner || ownRank?.canKick);
    const canPromote = Boolean(owner || ownRank?.canPromote);
    const canEditClan = Boolean(owner || ownRank?.canEditClan);

    return (
        <div className="space-y-7">
            <Feedback notice={notice} />
            {user && privateState.loading && <ForumLoading label="Dein Clan wird geladen …" />}
            {user && !privateState.loading && !clan && (
                <section className="forum-panel rounded-3xl p-6 sm:p-8">
                    <div className="grid gap-8 xl:grid-cols-[.8fr_1.2fr] xl:items-start">
                        <div>
                            <p className="eyebrow">DEIN CLAN</p>
                            <h2 className="mt-3 font-display text-3xl font-bold">Gründe deine Community.</h2>
                            <p className="mt-3 text-sm leading-6 text-zinc-500">
                                Name und Tag sind eindeutig. Du wirst automatisch Owner und erhältst alle
                                Verwaltungsrechte.
                            </p>
                        </div>
                        <form
                            className="grid gap-4 sm:grid-cols-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                act(
                                    'create-clan',
                                    () => socialApi.clans.create(createForm),
                                    'Dein Clan wurde erstellt.'
                                );
                            }}
                        >
                            <label className="text-xs font-bold text-zinc-400">
                                Clanname
                                <input
                                    className="forum-input"
                                    minLength={3}
                                    maxLength={32}
                                    required
                                    value={createForm.name}
                                    onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })}
                                    placeholder="Seriux Elite"
                                />
                            </label>
                            <label className="text-xs font-bold text-zinc-400">
                                Tag
                                <input
                                    className="forum-input uppercase"
                                    minLength={2}
                                    maxLength={5}
                                    required
                                    value={createForm.tag}
                                    onChange={(event) =>
                                        setCreateForm({ ...createForm, tag: event.target.value.toUpperCase() })
                                    }
                                    placeholder="SRX"
                                />
                            </label>
                            <label className="text-xs font-bold text-zinc-400 sm:col-span-2">
                                Beschreibung
                                <textarea
                                    className="forum-input min-h-24 resize-y"
                                    maxLength={255}
                                    value={createForm.description}
                                    onChange={(event) =>
                                        setCreateForm({ ...createForm, description: event.target.value })
                                    }
                                    placeholder="Wofür steht dein Clan?"
                                />
                            </label>
                            <Toggle
                                checked={createForm.open}
                                onChange={(open) => setCreateForm({ ...createForm, open })}
                                label="Beitrittsanfragen erlauben"
                            />
                            <button
                                className="forum-button-primary sm:justify-self-end"
                                disabled={pending === 'create-clan'}
                            >
                                <FaPlus /> {pending === 'create-clan' ? 'Wird erstellt …' : 'Clan erstellen'}
                            </button>
                        </form>
                    </div>
                </section>
            )}

            {user && !privateState.loading && clan && (
                <section className="forum-panel overflow-hidden rounded-3xl">
                    <div className="border-b border-white/[.06] bg-gradient-to-br from-orange-500/[.09] to-transparent p-6 sm:p-8">
                        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className="rounded-lg bg-orange-500 px-2.5 py-1 text-xs font-black text-white">
                                        [{clan.tag}]
                                    </span>
                                    <span className="text-xs font-bold text-zinc-600">
                                        {clan.open ? 'Offener Clan' : 'Nur auf Einladung'}
                                    </span>
                                </div>
                                <h2 className="mt-3 font-display text-4xl font-bold">{clan.name}</h2>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
                                    {clan.description || 'Noch keine Clanbeschreibung hinterlegt.'}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    className="forum-button-secondary"
                                    onClick={() => navigator.clipboard.writeText(clan.id)}
                                >
                                    <FaCopy /> Clan-ID
                                </button>
                                <button className="forum-button-secondary" onClick={loadPrivate}>
                                    <FaRotate /> Aktualisieren
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className={canInvite ? 'grid xl:grid-cols-[1.25fr_.75fr]' : 'grid'}>
                        <div className="border-b border-white/[.06] p-6 sm:p-8 xl:border-b-0 xl:border-r">
                            <div className="flex items-center justify-between gap-4">
                                <h3 className="font-display text-xl font-bold">Mitglieder</h3>
                                <span className="text-xs text-zinc-600">{members.length} Spieler</span>
                            </div>
                            <div className="mt-5 divide-y divide-white/[.055]">
                                {members.map((member) => (
                                    <div
                                        key={member.userId}
                                        className="grid gap-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
                                    >
                                        <PlayerIdentity playerId={member.userId} subtitle={member.rankKey} />
                                        {member.userId !== clan.ownerUserId && (canPromote || canKick) && (
                                            <div className="flex flex-wrap items-center gap-2">
                                                {canPromote && (
                                                    <select
                                                        className="rounded-xl border border-white/[.08] bg-[#090a0d] px-3 py-2 text-xs text-zinc-300 outline-none"
                                                        value={member.rankKey}
                                                        onChange={(event) =>
                                                            act(
                                                                `rank-${member.userId}`,
                                                                () =>
                                                                    socialApi.clans.changeRank(
                                                                        clan.id,
                                                                        member.userId,
                                                                        event.target.value
                                                                    ),
                                                                'Der Clanrang wurde aktualisiert.'
                                                            )
                                                        }
                                                    >
                                                        {ranks.map((rank) => (
                                                            <option key={rank.key} value={rank.key}>
                                                                {rank.key}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                                {canKick && (
                                                    <button
                                                        className="forum-icon-button text-red-300"
                                                        title="Mitglied entfernen"
                                                        onClick={() =>
                                                            window.confirm(
                                                                'Mitglied wirklich aus dem Clan entfernen?'
                                                            ) &&
                                                            act(
                                                                `kick-${member.userId}`,
                                                                () => socialApi.clans.kick(clan.id, member.userId),
                                                                'Das Mitglied wurde entfernt.'
                                                            )
                                                        }
                                                    >
                                                        <FaXmark />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {canInvite && (
                            <div className="p-6 sm:p-8">
                                <h3 className="font-display text-xl font-bold">Spieler einladen</h3>
                                <p className="mt-2 text-xs leading-5 text-zinc-600">
                                    Minecraft-Name oder UUID eingeben.
                                </p>
                                <form
                                    className="mt-4 flex gap-2"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        act(
                                            'clan-invite',
                                            async () =>
                                                socialApi.clans.invite(clan.id, await resolvePlayer(inviteTarget)),
                                            'Die Einladung wurde versendet.'
                                        ).then(() => setInviteTarget(''));
                                    }}
                                >
                                    <input
                                        className="forum-input !mt-0 min-w-0 flex-1"
                                        value={inviteTarget}
                                        onChange={(event) => setInviteTarget(event.target.value)}
                                        placeholder="Minecraft-Name"
                                    />
                                    <button className="forum-button-primary" disabled={pending === 'clan-invite'}>
                                        <FaUserPlus />
                                    </button>
                                </form>
                                {requests.length > 0 && (
                                    <div className="mt-8">
                                        <h3 className="font-display text-lg font-bold">Beitrittsanfragen</h3>
                                        <div className="mt-3 space-y-3">
                                            {requests.map((request) => (
                                                <InviteRow
                                                    key={request.id}
                                                    playerId={request.senderUserId}
                                                    expiresAt={request.expiresAt}
                                                    onAccept={() =>
                                                        act(
                                                            `accept-${request.id}`,
                                                            () => socialApi.clans.acceptInvite(request.id),
                                                            'Beitrittsanfrage angenommen.'
                                                        )
                                                    }
                                                    onDecline={() =>
                                                        act(
                                                            `decline-${request.id}`,
                                                            () => socialApi.clans.declineInvite(request.id),
                                                            'Beitrittsanfrage abgelehnt.'
                                                        )
                                                    }
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="border-t border-white/[.06] p-6 sm:p-8">
                        <details>
                            <summary className="cursor-pointer list-none font-display text-xl font-bold text-zinc-200">
                                <FaGear className="mr-2 inline text-orange-400" /> Clan verwalten
                            </summary>
                            <div className="mt-6 grid gap-8 xl:grid-cols-2">
                                {canEditClan && (
                                    <form
                                        className="grid gap-4"
                                        onSubmit={(event) => {
                                            event.preventDefault();
                                            act(
                                                'update-clan',
                                                () => socialApi.clans.update(clan.id, editForm),
                                                'Die Clan-Einstellungen wurden gespeichert.'
                                            );
                                        }}
                                    >
                                        <label className="text-xs font-bold text-zinc-400">
                                            Name
                                            <input
                                                className="forum-input"
                                                value={editForm.name}
                                                minLength={3}
                                                maxLength={32}
                                                required
                                                onChange={(event) =>
                                                    setEditForm({ ...editForm, name: event.target.value })
                                                }
                                            />
                                        </label>
                                        <label className="text-xs font-bold text-zinc-400">
                                            Beschreibung
                                            <textarea
                                                className="forum-input min-h-24 resize-y"
                                                value={editForm.description}
                                                maxLength={255}
                                                onChange={(event) =>
                                                    setEditForm({ ...editForm, description: event.target.value })
                                                }
                                            />
                                        </label>
                                        <Toggle
                                            checked={editForm.open}
                                            onChange={(open) => setEditForm({ ...editForm, open })}
                                            label="Beitrittsanfragen erlauben"
                                        />
                                        <button className="forum-button-primary justify-self-start">Speichern</button>
                                    </form>
                                )}
                                <div>
                                    <h4 className="text-sm font-bold">Individuellen Rang erstellen</h4>
                                    {canPromote && (
                                        <form
                                            className="mt-4 grid gap-3 sm:grid-cols-2"
                                            onSubmit={(event) => {
                                                event.preventDefault();
                                                act(
                                                    'create-rank',
                                                    () => socialApi.clans.createRank(clan.id, rankForm),
                                                    'Der Clanrang wurde erstellt.'
                                                );
                                            }}
                                        >
                                            <input
                                                className="forum-input !mt-0"
                                                placeholder="Rangschlüssel"
                                                minLength={2}
                                                maxLength={20}
                                                required
                                                value={rankForm.key}
                                                onChange={(event) =>
                                                    setRankForm({ ...rankForm, key: event.target.value.toUpperCase() })
                                                }
                                            />
                                            <input
                                                className="forum-input !mt-0"
                                                type="number"
                                                min={1}
                                                max={99}
                                                value={rankForm.priority}
                                                onChange={(event) =>
                                                    setRankForm({ ...rankForm, priority: Number(event.target.value) })
                                                }
                                            />
                                            <div className="grid gap-2 text-xs text-zinc-500 sm:col-span-2 sm:grid-cols-2">
                                                {[
                                                    ['canInvite', 'Einladen'],
                                                    ['canKick', 'Entfernen'],
                                                    ['canPromote', 'Ränge verwalten'],
                                                    ['canEditClan', 'Clan bearbeiten']
                                                ].map(([key, label]) => (
                                                    <label key={key} className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={rankForm[key]}
                                                            onChange={(event) =>
                                                                setRankForm({
                                                                    ...rankForm,
                                                                    [key]: event.target.checked
                                                                })
                                                            }
                                                        />
                                                        {label}
                                                    </label>
                                                ))}
                                            </div>
                                            <button className="forum-button-secondary sm:col-span-2">
                                                <FaPlus /> Rang erstellen
                                            </button>
                                        </form>
                                    )}
                                    <div className="mt-6 flex flex-wrap gap-2">
                                        {ranks.map((rank) => (
                                            <span
                                                key={rank.key}
                                                className="rounded-full border border-white/[.07] bg-black/20 px-3 py-1.5 text-xs text-zinc-400"
                                            >
                                                {rank.key} · {rank.priority}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 flex flex-wrap gap-3 border-t border-white/[.06] pt-6">
                                {owner ? (
                                    <button
                                        className="forum-button-secondary text-red-300"
                                        onClick={() =>
                                            window.confirm(
                                                'Clan endgültig auflösen? Diese Aktion kann nicht rückgängig gemacht werden.'
                                            ) &&
                                            act(
                                                'delete-clan',
                                                () => socialApi.clans.remove(clan.id),
                                                'Der Clan wurde aufgelöst.'
                                            )
                                        }
                                    >
                                        <FaTrash /> Clan auflösen
                                    </button>
                                ) : (
                                    <button
                                        className="forum-button-secondary text-red-300"
                                        onClick={() =>
                                            window.confirm('Möchtest du den Clan wirklich verlassen?') &&
                                            act(
                                                'leave-clan',
                                                () => socialApi.clans.leave(clan.id),
                                                'Du hast den Clan verlassen.'
                                            )
                                        }
                                    >
                                        <FaXmark /> Clan verlassen
                                    </button>
                                )}
                            </div>
                        </details>
                    </div>
                </section>
            )}

            {user && privateState.invites.length > 0 && !clan && (
                <section className="forum-panel rounded-3xl p-6 sm:p-8">
                    <h2 className="font-display text-2xl font-bold">Clan-Einladungen</h2>
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                        {privateState.invites.map((invite) => (
                            <InviteRow
                                key={invite.id}
                                playerId={invite.senderUserId}
                                label={`Clan ${invite.clanId}`}
                                expiresAt={invite.expiresAt}
                                onAccept={() =>
                                    act(
                                        `accept-${invite.id}`,
                                        () => socialApi.clans.acceptInvite(invite.id),
                                        'Du bist dem Clan beigetreten.'
                                    )
                                }
                                onDecline={() =>
                                    act(
                                        `decline-${invite.id}`,
                                        () => socialApi.clans.declineInvite(invite.id),
                                        'Einladung abgelehnt.'
                                    )
                                }
                            />
                        ))}
                    </div>
                </section>
            )}

            <section>
                <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="eyebrow">CLANVERZEICHNIS</p>
                        <h2 className="mt-2 font-display text-3xl font-bold">Communitys entdecken</h2>
                    </div>
                    <label className="flex h-12 w-full items-center gap-3 rounded-2xl border border-white/[.08] bg-[#111218] px-4 sm:max-w-sm">
                        <FaMagnifyingGlass className="text-zinc-600" />
                        <input
                            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-700"
                            value={query}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                setPage(0);
                            }}
                            placeholder="Clans suchen …"
                        />
                    </label>
                </div>
                {catalogLoading && <ForumLoading label="Clanverzeichnis wird geladen …" />}
                {catalogError && <ForumError message={catalogError} retry={() => loadCatalog()} />}
                {!catalogLoading && !catalogError && catalog?.content?.length === 0 && (
                    <EmptyState
                        icon={FaCrown}
                        title="Noch keine passenden Clans"
                        copy={
                            query
                                ? 'Versuche einen anderen Suchbegriff.'
                                : 'Der erste Clan wartet darauf, gegründet zu werden.'
                        }
                    />
                )}
                {!catalogLoading && catalog?.content?.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {catalog.content.map((entry) => (
                            <button
                                key={entry.id}
                                className="forum-panel group rounded-3xl p-6 text-left transition hover:-translate-y-1 hover:border-orange-500/20"
                                onClick={() => openClan(entry)}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <span className="rounded-lg bg-orange-500/10 px-2.5 py-1 text-xs font-black text-orange-300">
                                        [{entry.tag}]
                                    </span>
                                    {entry.open ? (
                                        <FaGlobe className="text-emerald-400" />
                                    ) : (
                                        <FaLock className="text-zinc-700" />
                                    )}
                                </div>
                                <h3 className="mt-5 font-display text-2xl font-bold">{entry.name}</h3>
                                <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-zinc-600">
                                    {entry.description || 'Dieser Clan hat noch keine Beschreibung.'}
                                </p>
                                <span className="mt-6 flex items-center gap-2 text-xs font-bold text-orange-400">
                                    Clan ansehen <FaArrowRight />
                                </span>
                            </button>
                        ))}
                    </div>
                )}
                <Pagination
                    page={catalog?.page?.number ?? page}
                    size={catalog?.page?.size ?? 12}
                    total={catalog?.page?.totalElements ?? 0}
                    onPage={setPage}
                />
            </section>

            {selectedClan && (
                <section className="forum-panel rounded-3xl p-6 sm:p-8">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                        <div>
                            <div className="flex items-center gap-3">
                                <span className="rounded-lg bg-orange-500 px-2.5 py-1 text-xs font-black text-white">
                                    [{selectedClan.tag}]
                                </span>
                                <span className="text-xs text-zinc-600">{selectedMembers.length} Mitglieder</span>
                            </div>
                            <h2 className="mt-4 font-display text-3xl font-bold">{selectedClan.name}</h2>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
                                {selectedClan.description || 'Keine Beschreibung hinterlegt.'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {user && !clan && selectedClan.open && (
                                <button
                                    className="forum-button-primary"
                                    onClick={() =>
                                        act(
                                            `join-${selectedClan.id}`,
                                            () => socialApi.clans.requestJoin(selectedClan.id),
                                            'Deine Beitrittsanfrage wurde versendet.'
                                        )
                                    }
                                >
                                    <FaUserPlus /> Beitritt anfragen
                                </button>
                            )}
                            <button className="forum-icon-button" onClick={() => setSelectedClan(null)}>
                                <FaXmark />
                            </button>
                        </div>
                    </div>
                    <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {selectedMembers.map((member) => (
                            <div key={member.userId} className="rounded-2xl border border-white/[.06] bg-black/15 p-4">
                                <PlayerIdentity playerId={member.userId} subtitle={member.rankKey} compact />
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

function FriendsPanel() {
    const [state, setState] = useState({ loading: true, friends: [], requests: [], error: '' });
    const [target, setTarget] = useState('');
    const [notice, setNotice] = useState(null);
    const [pending, setPending] = useState('');

    const load = useCallback(async () => {
        setState((current) => ({ ...current, loading: true, error: '' }));
        try {
            const [friends, requests] = await Promise.all([socialApi.friends.list(), socialApi.friends.requests()]);
            setState({ loading: false, friends, requests, error: '' });
        } catch (error) {
            setState((current) => ({ ...current, loading: false, error: error.message }));
        }
    }, []);
    useEffect(() => {
        load();
    }, [load]);

    const act = async (key, action, message) => {
        setPending(key);
        setNotice(null);
        try {
            await action();
            setNotice({ type: 'success', message });
            await load();
        } catch (error) {
            setNotice({ type: 'error', message: error.message });
        } finally {
            setPending('');
        }
    };

    if (state.loading) return <ForumLoading label="Freundesliste wird geladen …" />;
    if (state.error) return <ForumError message={state.error} retry={load} />;
    return (
        <div className="space-y-7">
            <Feedback notice={notice} />
            <section className="forum-panel rounded-3xl p-6 sm:p-8">
                <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div>
                        <p className="eyebrow">SPIELER VERBINDEN</p>
                        <h2 className="mt-2 font-display text-3xl font-bold">Freund hinzufügen</h2>
                        <p className="mt-3 text-sm text-zinc-500">
                            Suche über Minecraft-Name oder verwende direkt die Spieler-UUID.
                        </p>
                    </div>
                    <form
                        className="flex w-full gap-2 lg:w-[430px]"
                        onSubmit={(event) => {
                            event.preventDefault();
                            act(
                                'send',
                                async () => socialApi.friends.send(await resolvePlayer(target)),
                                'Freundschaftsanfrage versendet.'
                            ).then(() => setTarget(''));
                        }}
                    >
                        <input
                            className="forum-input !mt-0 min-w-0 flex-1"
                            value={target}
                            onChange={(event) => setTarget(event.target.value)}
                            placeholder="Minecraft-Name"
                        />
                        <button className="forum-button-primary" disabled={pending === 'send'}>
                            <FaUserPlus /> <span className="hidden sm:inline">Anfragen</span>
                        </button>
                    </form>
                </div>
            </section>

            {state.requests.length > 0 && (
                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-display text-2xl font-bold">Offene Anfragen</h2>
                        <span className="rounded-full bg-orange-500 px-2.5 py-1 text-xs font-bold text-white">
                            {state.requests.length}
                        </span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        {state.requests.map((request) => (
                            <InviteRow
                                key={request.id}
                                playerId={request.senderUserId}
                                expiresAt={request.expiresAt}
                                onAccept={() =>
                                    act(
                                        `accept-${request.id}`,
                                        () => socialApi.friends.accept(request.id),
                                        'Ihr seid jetzt befreundet.'
                                    )
                                }
                                onDecline={() =>
                                    act(
                                        `decline-${request.id}`,
                                        () => socialApi.friends.decline(request.id),
                                        'Anfrage abgelehnt.'
                                    )
                                }
                            />
                        ))}
                    </div>
                </section>
            )}

            <section>
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <p className="eyebrow">DEIN NETZWERK</p>
                        <h2 className="mt-2 font-display text-3xl font-bold">Freunde</h2>
                    </div>
                    <span className="text-sm text-zinc-600">{state.friends.length} verbunden</span>
                </div>
                {state.friends.length === 0 ? (
                    <EmptyState
                        title="Deine Freundesliste ist noch leer"
                        copy="Sende oben deine erste Anfrage. Nach der Bestätigung erscheint der Spieler hier und kann später direkt in Partys eingeladen werden."
                    />
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {state.friends.map((friend) => (
                            <article key={friend.id} className="forum-panel rounded-3xl p-5">
                                <PlayerIdentity
                                    playerId={friend.friendUserId}
                                    subtitle={`Seit ${formatDate(friend.createdAt)}`}
                                />
                                <div className="mt-5 flex items-center justify-between border-t border-white/[.06] pt-4">
                                    <button
                                        className="text-xs font-bold text-zinc-600 transition hover:text-red-300"
                                        onClick={() =>
                                            window.confirm('Freundschaft wirklich entfernen?') &&
                                            act(
                                                `remove-${friend.friendUserId}`,
                                                () => socialApi.friends.remove(friend.friendUserId),
                                                'Freundschaft entfernt.'
                                            )
                                        }
                                    >
                                        Entfernen
                                    </button>
                                    <Link to="/party" className="text-xs font-bold text-orange-400">
                                        Party öffnen <FaArrowRight className="ml-1 inline" />
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function PartyPanel({ user }) {
    const [state, setState] = useState({
        loading: true,
        party: null,
        invites: [],
        members: [],
        ranks: [],
        history: []
    });
    const [notice, setNotice] = useState(null);
    const [pending, setPending] = useState('');
    const [createForm, setCreateForm] = useState({ name: '', maxMembers: 8, open: false });
    const [editForm, setEditForm] = useState({ name: '', maxMembers: 8, open: false });
    const [inviteTarget, setInviteTarget] = useState('');
    const [joinId, setJoinId] = useState('');

    const load = useCallback(async () => {
        setState((current) => ({ ...current, loading: true }));
        try {
            const [party, invites, ranks] = await Promise.all([
                nullable(socialApi.parties.mine()),
                socialApi.parties.invites(),
                socialApi.parties.ranks()
            ]);
            let members = [];
            let history = [];
            if (party) {
                [members, history] = await Promise.all([
                    socialApi.parties.members(party.id),
                    socialApi.parties.history(party.id).then((result) => result.content || [])
                ]);
                setEditForm({ name: party.name, maxMembers: party.maxMembers, open: party.open });
            }
            setState({ loading: false, party, invites, members, ranks, history });
        } catch (error) {
            setState((current) => ({ ...current, loading: false }));
            setNotice({ type: 'error', message: error.message });
        }
    }, []);
    useEffect(() => {
        load();
    }, [load]);

    const act = async (key, action, message) => {
        setPending(key);
        setNotice(null);
        try {
            await action();
            setNotice({ type: 'success', message });
            await load();
        } catch (error) {
            setNotice({ type: 'error', message: error.message });
        } finally {
            setPending('');
        }
    };

    if (state.loading) return <ForumLoading label="Party wird geladen …" />;
    const party = state.party;
    const owner = party?.ownerUserId === user?.playerId;
    const ownMembership = state.members.find((member) => member.userId === user?.playerId);
    const ownRank = state.ranks.find((rank) => rank.key === ownMembership?.rankKey);
    const canInvite = Boolean(owner || ownRank?.canInvite);
    const canKick = Boolean(owner || ownRank?.canKick);
    const canPromote = Boolean(owner || ownRank?.canPromote);
    const canEditParty = Boolean(owner || ownRank?.canEditParty);
    return (
        <div className="space-y-7">
            <Feedback notice={notice} />
            {state.invites.length > 0 && !party && (
                <section>
                    <h2 className="mb-4 font-display text-2xl font-bold">Party-Einladungen</h2>
                    <div className="grid gap-3 md:grid-cols-2">
                        {state.invites.map((invite) => (
                            <InviteRow
                                key={invite.id}
                                playerId={invite.senderUserId}
                                label={`Party ${invite.partyId}`}
                                expiresAt={invite.expiresAt}
                                onAccept={() =>
                                    act(
                                        `accept-${invite.id}`,
                                        () => socialApi.parties.acceptInvite(invite.id),
                                        'Du bist der Party beigetreten.'
                                    )
                                }
                                onDecline={() =>
                                    act(
                                        `decline-${invite.id}`,
                                        () => socialApi.parties.declineInvite(invite.id),
                                        'Einladung abgelehnt.'
                                    )
                                }
                            />
                        ))}
                    </div>
                </section>
            )}

            {!party ? (
                <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
                    <section className="forum-panel rounded-3xl p-6 sm:p-8">
                        <p className="eyebrow">NEUE PARTY</p>
                        <h2 className="mt-2 font-display text-3xl font-bold">Session organisieren</h2>
                        <p className="mt-3 text-sm leading-6 text-zinc-500">
                            Erstelle eine temporäre Gruppe, lade Spieler ein und verwalte ihre Party-Ränge.
                        </p>
                        <form
                            className="mt-7 grid gap-4 sm:grid-cols-2"
                            onSubmit={(event) => {
                                event.preventDefault();
                                act(
                                    'create-party',
                                    () => socialApi.parties.create(createForm),
                                    'Deine Party wurde erstellt.'
                                );
                            }}
                        >
                            <label className="text-xs font-bold text-zinc-400 sm:col-span-2">
                                Partyname
                                <input
                                    className="forum-input"
                                    minLength={2}
                                    maxLength={48}
                                    required
                                    value={createForm.name}
                                    onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })}
                                    placeholder="Abendrunde"
                                />
                            </label>
                            <label className="text-xs font-bold text-zinc-400">
                                Maximale Spieler
                                <input
                                    className="forum-input"
                                    type="number"
                                    min={2}
                                    max={100}
                                    value={createForm.maxMembers}
                                    onChange={(event) =>
                                        setCreateForm({ ...createForm, maxMembers: Number(event.target.value) })
                                    }
                                />
                            </label>
                            <Toggle
                                checked={createForm.open}
                                onChange={(open) => setCreateForm({ ...createForm, open })}
                                label="Offener Beitritt"
                            />
                            <button
                                className="forum-button-primary sm:col-span-2"
                                disabled={pending === 'create-party'}
                            >
                                <FaPlus /> Party erstellen
                            </button>
                        </form>
                    </section>
                    <section className="forum-panel rounded-3xl p-6 sm:p-8">
                        <p className="eyebrow">PARTY-CODE</p>
                        <h2 className="mt-2 font-display text-2xl font-bold">Offener Party beitreten</h2>
                        <p className="mt-3 text-sm leading-6 text-zinc-500">
                            Lass dir vom Party-Leader die Party-ID schicken und tritt direkt bei.
                        </p>
                        <form
                            className="mt-7"
                            onSubmit={(event) => {
                                event.preventDefault();
                                act(
                                    'join-party',
                                    () => socialApi.parties.join(joinId.trim()),
                                    'Du bist der Party beigetreten.'
                                );
                            }}
                        >
                            <input
                                className="forum-input"
                                required
                                value={joinId}
                                onChange={(event) => setJoinId(event.target.value)}
                                placeholder="Party-ID"
                            />
                            <button className="forum-button-secondary mt-3 w-full" disabled={pending === 'join-party'}>
                                <FaRightToBracket /> Beitreten
                            </button>
                        </form>
                    </section>
                </div>
            ) : (
                <section className="forum-panel overflow-hidden rounded-3xl">
                    <div className="border-b border-white/[.06] bg-gradient-to-br from-orange-500/[.09] to-transparent p-6 sm:p-8">
                        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                            <div>
                                <div className="flex items-center gap-2 text-xs font-bold text-zinc-600">
                                    {party.open ? <FaGlobe className="text-emerald-400" /> : <FaLock />}
                                    {party.open ? 'Offener Beitritt' : 'Nur auf Einladung'} · {state.members.length}/
                                    {party.maxMembers} Spieler
                                </div>
                                <h2 className="mt-3 font-display text-4xl font-bold">{party.name}</h2>
                            </div>
                            <button
                                className="forum-button-secondary"
                                onClick={() => navigator.clipboard.writeText(party.id)}
                            >
                                <FaCopy /> Party-ID kopieren
                            </button>
                        </div>
                    </div>
                    <div className="grid xl:grid-cols-[1.2fr_.8fr]">
                        <div className="border-b border-white/[.06] p-6 sm:p-8 xl:border-b-0 xl:border-r">
                            <div className="flex items-center justify-between">
                                <h3 className="font-display text-xl font-bold">Mitglieder</h3>
                                <span className="text-xs text-zinc-600">{state.members.length} online organisiert</span>
                            </div>
                            <div className="mt-5 divide-y divide-white/[.055]">
                                {state.members.map((member) => (
                                    <div
                                        key={member.id}
                                        className="grid gap-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
                                    >
                                        <PlayerIdentity playerId={member.userId} subtitle={member.rankKey} />
                                        {member.userId !== party.ownerUserId && (canPromote || canKick) && (
                                            <div className="flex items-center gap-2">
                                                {canPromote && (
                                                    <select
                                                        className="rounded-xl border border-white/[.08] bg-[#090a0d] px-3 py-2 text-xs text-zinc-300 outline-none"
                                                        value={member.rankKey}
                                                        onChange={(event) =>
                                                            act(
                                                                `party-rank-${member.userId}`,
                                                                () =>
                                                                    socialApi.parties.changeRank(
                                                                        party.id,
                                                                        member.userId,
                                                                        event.target.value
                                                                    ),
                                                                'Der Partyrang wurde aktualisiert.'
                                                            )
                                                        }
                                                    >
                                                        {state.ranks.map((rank) => (
                                                            <option key={rank.key} value={rank.key}>
                                                                {rank.key}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                                {canKick && (
                                                    <button
                                                        className="forum-icon-button text-red-300"
                                                        onClick={() =>
                                                            window.confirm('Spieler aus der Party entfernen?') &&
                                                            act(
                                                                `party-kick-${member.userId}`,
                                                                () => socialApi.parties.kick(party.id, member.userId),
                                                                'Spieler aus der Party entfernt.'
                                                            )
                                                        }
                                                    >
                                                        <FaXmark />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 sm:p-8">
                            <h3 className="font-display text-xl font-bold">Spieler einladen</h3>
                            {canInvite && (
                                <form
                                    className="mt-4 flex gap-2"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        act(
                                            'party-invite',
                                            async () =>
                                                socialApi.parties.invite(party.id, await resolvePlayer(inviteTarget)),
                                            'Party-Einladung versendet.'
                                        ).then(() => setInviteTarget(''));
                                    }}
                                >
                                    <input
                                        className="forum-input !mt-0 min-w-0 flex-1"
                                        value={inviteTarget}
                                        onChange={(event) => setInviteTarget(event.target.value)}
                                        placeholder="Minecraft-Name"
                                    />
                                    <button className="forum-button-primary" disabled={pending === 'party-invite'}>
                                        <FaUserPlus />
                                    </button>
                                </form>
                            )}
                            <div className="mt-8">
                                <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                                    <FaClockRotateLeft className="text-orange-400" /> Verlauf
                                </h3>
                                <div className="mt-4 space-y-3">
                                    {state.history.length === 0 && (
                                        <p className="text-xs text-zinc-600">Noch keine Party-Aktivitäten vorhanden.</p>
                                    )}
                                    {state.history.slice(0, 8).map((entry) => (
                                        <div
                                            key={entry.id}
                                            className="rounded-xl border border-white/[.055] bg-black/15 p-3"
                                        >
                                            <b className="block text-xs text-zinc-300">
                                                {entry.action.replaceAll('_', ' ')}
                                            </b>
                                            <span className="mt-1 block text-[10px] text-zinc-700">
                                                {formatDate(entry.createdAt)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-white/[.06] p-6 sm:p-8">
                        <details>
                            <summary className="cursor-pointer list-none font-display text-xl font-bold">
                                <FaGear className="mr-2 inline text-orange-400" /> Party verwalten
                            </summary>
                            {canEditParty && (
                                <form
                                    className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_160px_auto_auto] lg:items-end"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        act(
                                            'update-party',
                                            () => socialApi.parties.update(party.id, editForm),
                                            'Party-Einstellungen gespeichert.'
                                        );
                                    }}
                                >
                                    <label className="text-xs font-bold text-zinc-400">
                                        Name
                                        <input
                                            className="forum-input"
                                            value={editForm.name}
                                            minLength={2}
                                            maxLength={48}
                                            required
                                            onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                                        />
                                    </label>
                                    <label className="text-xs font-bold text-zinc-400">
                                        Spielerlimit
                                        <input
                                            className="forum-input"
                                            type="number"
                                            min={2}
                                            max={100}
                                            value={editForm.maxMembers}
                                            onChange={(event) =>
                                                setEditForm({ ...editForm, maxMembers: Number(event.target.value) })
                                            }
                                        />
                                    </label>
                                    <Toggle
                                        checked={editForm.open}
                                        onChange={(open) => setEditForm({ ...editForm, open })}
                                        label="Offen"
                                    />
                                    <button className="forum-button-primary">Speichern</button>
                                </form>
                            )}
                            <div className="mt-6 flex flex-wrap gap-3 border-t border-white/[.06] pt-6">
                                {owner ? (
                                    <button
                                        className="forum-button-secondary text-red-300"
                                        onClick={() =>
                                            window.confirm('Party endgültig auflösen?') &&
                                            act(
                                                'disband-party',
                                                () => socialApi.parties.disband(party.id),
                                                'Die Party wurde aufgelöst.'
                                            )
                                        }
                                    >
                                        <FaTrash /> Party auflösen
                                    </button>
                                ) : (
                                    <button
                                        className="forum-button-secondary text-red-300"
                                        onClick={() =>
                                            window.confirm('Party wirklich verlassen?') &&
                                            act(
                                                'leave-party',
                                                () => socialApi.parties.leave(party.id),
                                                'Du hast die Party verlassen.'
                                            )
                                        }
                                    >
                                        <FaXmark /> Party verlassen
                                    </button>
                                )}
                            </div>
                        </details>
                    </div>
                </section>
            )}
        </div>
    );
}

function InviteRow({ playerId, label, expiresAt, onAccept, onDecline }) {
    return (
        <article className="forum-panel rounded-2xl p-4">
            <PlayerIdentity playerId={playerId} subtitle={label || `Gültig bis ${formatDate(expiresAt)}`} compact />
            <div className="mt-4 flex gap-2 border-t border-white/[.055] pt-3">
                <button className="forum-button-primary flex-1 !py-2.5" onClick={onAccept}>
                    <FaCheck /> Annehmen
                </button>
                <button className="forum-button-secondary flex-1 !py-2.5" onClick={onDecline}>
                    <FaXmark /> Ablehnen
                </button>
            </div>
        </article>
    );
}

function Toggle({ checked, onChange, label }) {
    return (
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/[.06] bg-black/15 px-4 py-3 text-xs font-bold text-zinc-400">
            <input
                type="checkbox"
                className="h-4 w-4 accent-orange-500"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
            />
            {label}
        </label>
    );
}

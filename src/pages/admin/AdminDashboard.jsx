import { useEffect, useState } from 'react';
import {
    FaArrowRight,
    FaArrowRotateRight,
    FaBagShopping,
    FaCircleCheck,
    FaClock,
    FaComments,
    FaSpinner,
    FaTriangleExclamation,
    FaUserGroup,
    FaUsers
} from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import {
    AdminDashboardSkeleton,
    AdminEmptyState,
    AdminMetricCard,
    AdminPendingState
} from '../../components/admin/AdminUi';
import AdminApiWorldMap from '../../components/admin/AdminApiWorldMap';
import {
    fetchAuthenticatedUser,
    getAuthenticatedUser,
    isForumAdministrator,
    isStoreAdministrator,
    isUserAdministrator
} from '../../lib/auth';
import { forumApi } from '../../lib/forumApi';
import { storeApi } from '../../lib/storeApi';
import { playerAvatar } from '../../lib/userApi';
import { userAdminApi } from '../../lib/userAdminApi';

const STATUS_API = 'https://api.seriuxmod.net/api/v1/status/summary';
const EMPTY_DATA = { users: null, store: null, forum: null, status: null };

export default function AdminDashboard() {
    const [user, setUser] = useState(() => getAuthenticatedUser());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [updatedAt, setUpdatedAt] = useState(null);
    const [data, setData] = useState(EMPTY_DATA);
    const [sourceState, setSourceState] = useState({
        users: 'hidden',
        store: 'hidden',
        forum: 'hidden',
        status: 'loading'
    });

    useEffect(() => {
        let active = true;

        async function loadDashboard() {
            if (refreshKey > 0) setRefreshing(true);

            const profile = await fetchAuthenticatedUser();
            if (!active) return;
            setUser(profile);

            if (!profile) {
                setLoading(false);
                setRefreshing(false);
                return;
            }

            const states = {
                users: isUserAdministrator(profile) ? 'loading' : 'hidden',
                store: isStoreAdministrator(profile) ? 'loading' : 'hidden',
                forum: isForumAdministrator(profile) ? 'loading' : 'hidden',
                status: 'loading'
            };
            setSourceState(states);

            const tasks = [
                {
                    key: 'status',
                    promise: fetch(STATUS_API, { cache: 'no-store' }).then((response) =>
                        response.ok ? response.json() : Promise.reject(new Error('Status unavailable'))
                    )
                }
            ];

            if (isUserAdministrator(profile)) tasks.push({ key: 'users', promise: userAdminApi.overview() });
            if (isStoreAdministrator(profile)) tasks.push({ key: 'store', promise: storeApi.admin.overview() });
            if (isForumAdministrator(profile)) {
                tasks.push({
                    key: 'forum',
                    promise: Promise.all([forumApi.admin.nodes(), forumApi.admin.reports(0, 1, 'OPEN')]).then(
                        ([nodes, reports]) => ({
                            nodes: nodes?.nodes?.length ?? nodes?.length ?? 0,
                            reports: reports?.totalElements ?? reports?.content?.length ?? 0
                        })
                    )
                });
            }

            const settled = await Promise.allSettled(tasks.map((task) => task.promise));
            if (!active) return;

            const nextData = { ...EMPTY_DATA };
            const nextStates = { ...states };
            settled.forEach((entry, index) => {
                const key = tasks[index].key;
                if (entry.status === 'fulfilled') {
                    nextData[key] = entry.value;
                    nextStates[key] = 'ready';
                } else {
                    nextStates[key] = 'waiting';
                }
            });

            setData(nextData);
            setSourceState(nextStates);
            setUpdatedAt(new Date());
            setLoading(false);
            setRefreshing(false);
        }

        loadDashboard().catch(() => {
            if (!active) return;
            setSourceState((current) =>
                Object.fromEntries(
                    Object.entries(current).map(([key, state]) => [key, state === 'hidden' ? state : 'waiting'])
                )
            );
            setLoading(false);
            setRefreshing(false);
        });

        return () => {
            active = false;
        };
    }, [refreshKey]);

    const monitoredServices = data.status?.monitoredServices ?? data.status?.services?.length ?? 0;
    const healthyServices = data.status?.healthyServices ?? 0;
    const serviceProblem = sourceState.status === 'ready' && healthyServices < monitoredServices;

    if (loading) return <AdminDashboardSkeleton />;

    return (
        <div>
            <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="eyebrow">TEAM-DASHBOARD</p>
                    <h2 className="mt-2 font-display text-3xl font-bold tracking-[-.04em] sm:text-4xl xl:text-[2.7rem]">
                        Willkommen zurück, {user?.username ?? 'Team'}.
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
                        Hier siehst du, was bei SeriuxMod gerade passiert – kompakt und direkt aus den angebundenen
                        Services.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {updatedAt && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/[.07] bg-white/[.025] px-3 py-2 text-[10px] font-bold text-zinc-600">
                            <FaClock /> Aktualisiert {formatTime(updatedAt)}
                        </span>
                    )}
                    <button
                        className="inline-flex items-center gap-2 rounded-xl border border-white/[.08] bg-[#14151b] px-4 py-2.5 text-xs font-bold text-zinc-300 transition hover:border-orange-400/20 hover:text-white disabled:cursor-wait disabled:opacity-60"
                        disabled={refreshing}
                        onClick={() => setRefreshKey((key) => key + 1)}
                        type="button"
                    >
                        <FaArrowRotateRight className={refreshing ? 'animate-spin' : ''} />
                        {refreshing ? 'Aktualisiert …' : 'Neu laden'}
                    </button>
                </div>
            </header>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                {isUserAdministrator(user) && (
                    <>
                        <AdminMetricCard
                            detail="aktive Sitzungen"
                            icon={FaUserGroup}
                            label="Nutzer online"
                            pending={sourceState.users !== 'ready'}
                            pendingText={pendingText(sourceState.users)}
                            pendingTitle={pendingTitle(sourceState.users)}
                            tone="emerald"
                            value={data.users?.onlineUsers ?? 0}
                        />
                        <AdminMetricCard
                            detail="SeriuxMod-Konten"
                            icon={FaUsers}
                            label="Registriert"
                            pending={sourceState.users !== 'ready'}
                            pendingText={pendingText(sourceState.users)}
                            pendingTitle={pendingTitle(sourceState.users)}
                            tone="sky"
                            value={data.users?.registeredUsers ?? 0}
                        />
                    </>
                )}
                {isStoreAdministrator(user) && (
                    <AdminMetricCard
                        detail={`${data.store?.completedPayments ?? 0} bezahlte Käufe`}
                        icon={FaBagShopping}
                        label="Shop-Umsatz"
                        pending={sourceState.store !== 'ready'}
                        pendingText={pendingText(sourceState.store)}
                        pendingTitle={pendingTitle(sourceState.store)}
                        tone="orange"
                        value={formatRevenue(data.store?.revenueByCurrency)}
                    />
                )}
                {isForumAdministrator(user) && (
                    <AdminMetricCard
                        detail={`${data.forum?.nodes ?? 0} sichtbare Bereiche`}
                        icon={FaComments}
                        label="Offene Meldungen"
                        pending={sourceState.forum !== 'ready'}
                        pendingText={pendingText(sourceState.forum)}
                        pendingTitle={pendingTitle(sourceState.forum)}
                        tone="violet"
                        value={data.forum?.reports ?? 0}
                    />
                )}
                <AdminMetricCard
                    detail={
                        serviceProblem
                            ? `${monitoredServices - healthyServices} ${monitoredServices - healthyServices === 1 ? 'Dienst' : 'Dienste'} gestört`
                            : 'überwachte Dienste erreichbar'
                    }
                    icon={serviceProblem ? FaTriangleExclamation : FaCircleCheck}
                    label="Systemzustand"
                    pending={sourceState.status !== 'ready'}
                    pendingText={pendingText(sourceState.status)}
                    pendingTitle={pendingTitle(sourceState.status)}
                    tone={serviceProblem ? 'red' : 'emerald'}
                    value={`${healthyServices}/${monitoredServices}`}
                />
            </section>

            <div className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]">
                <AdminApiWorldMap />
                {isUserAdministrator(user) ? (
                    <OnlineStaff staff={data.users?.onlineStaff ?? []} state={sourceState.users} />
                ) : (
                    <DataSources sourceState={sourceState} />
                )}
            </div>

            <section className="mt-6">
                <div className="mb-4 flex items-end justify-between gap-4">
                    <div>
                        <p className="eyebrow">DIREKTZUGRIFF</p>
                        <h3 className="mt-2 font-display text-xl font-bold">Verwaltungsbereiche</h3>
                    </div>
                    <span className="hidden text-[10px] font-bold uppercase tracking-[.15em] text-zinc-700 sm:block">
                        Berechtigungsbasiert
                    </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {isUserAdministrator(user) && (
                        <QuickLink
                            copy={
                                sourceState.users === 'ready'
                                    ? `${data.users?.registeredUsers ?? 0} Konten verwalten`
                                    : null
                            }
                            icon={FaUsers}
                            pending={sourceState.users !== 'ready'}
                            pendingState={sourceState.users}
                            title="Benutzerverwaltung"
                            to="/admin/players"
                        />
                    )}
                    {isForumAdministrator(user) && (
                        <QuickLink
                            copy={
                                sourceState.forum === 'ready'
                                    ? `${data.forum?.reports ?? 0} offene Meldungen · ${data.forum?.nodes ?? 0} Bereiche`
                                    : null
                            }
                            icon={FaComments}
                            pending={sourceState.forum !== 'ready'}
                            pendingState={sourceState.forum}
                            title="Forumverwaltung"
                            to="/admin/forum/analytics"
                        />
                    )}
                    {isStoreAdministrator(user) && (
                        <QuickLink
                            copy={
                                sourceState.store === 'ready'
                                    ? `${data.store?.orders ?? 0} Bestellungen · ${data.store?.products ?? 0} Produkte`
                                    : null
                            }
                            icon={FaBagShopping}
                            pending={sourceState.store !== 'ready'}
                            pendingState={sourceState.store}
                            title="Shopverwaltung"
                            to="/admin/commerce"
                        />
                    )}
                </div>
            </section>
        </div>
    );
}

function OnlineStaff({ staff, state }) {
    const ready = state === 'ready';

    return (
        <section className="rounded-[28px] border border-white/[.07] bg-[#111218] p-5 shadow-[0_24px_80px_rgba(0,0,0,.14)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="eyebrow">TEAM</p>
                    <h3 className="mt-2 font-display text-2xl font-bold">Staff online</h3>
                    <p className="mt-2 text-xs text-zinc-600">Aktive Teammitglieder und ihre Oberfläche.</p>
                </div>
                {ready && (
                    <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[.06] px-3 py-1.5 text-xs font-bold text-emerald-300">
                        {staff.length}
                    </span>
                )}
            </div>
            <div className="mt-6 space-y-3">
                {!ready ? (
                    <AdminPendingState
                        compact
                        title={state === 'waiting' ? 'User-Service antwortet nicht' : 'Teamstatus wird geladen'}
                        text={
                            state === 'waiting'
                                ? 'Es liegen noch keine Präsenzdaten vor. Über „Neu laden“ kann die Quelle erneut abgefragt werden.'
                                : 'Der User-Service liefert aktuell noch keine Präsenzdaten.'
                        }
                    />
                ) : staff.length ? (
                    staff.map((member) => (
                        <Link
                            className="flex items-center gap-4 rounded-2xl border border-white/[.055] bg-black/15 p-3 transition hover:border-orange-500/15 hover:bg-orange-500/[.025]"
                            key={member.id}
                            to={`/players/${encodeURIComponent(member.id)}`}
                        >
                            <img
                                className="h-11 w-11 rounded-xl [image-rendering:pixelated]"
                                src={playerAvatar(member.id, 96)}
                                alt=""
                            />
                            <div className="min-w-0 flex-1">
                                <b className="block truncate text-sm text-white">{member.username}</b>
                                <p className="mt-1 truncate text-xs text-orange-300">
                                    {(member.groups ?? []).join(' · ')}
                                </p>
                            </div>
                            <div className="flex flex-wrap justify-end gap-1.5">
                                {(member.surfaces ?? []).map((surface) => (
                                    <span
                                        className="rounded-full bg-emerald-500/[.08] px-2 py-1 text-[9px] font-bold text-emerald-300"
                                        key={surface}
                                    >
                                        {surfaceLabel(surface)}
                                    </span>
                                ))}
                            </div>
                        </Link>
                    ))
                ) : (
                    <AdminEmptyState
                        title="Niemand aus dem Team ist online"
                        text="Sobald eine Staff-Sitzung aktiv ist, wird sie hier angezeigt."
                    />
                )}
            </div>
        </section>
    );
}

function DataSources({ sourceState }) {
    const entries = Object.entries(sourceState).filter(([, state]) => state !== 'hidden');
    return (
        <section className="rounded-[28px] border border-white/[.07] bg-[#111218] p-5 sm:p-7">
            <p className="eyebrow">SCHNITTSTELLEN</p>
            <h3 className="mt-2 font-display text-2xl font-bold">Datenquellen</h3>
            <div className="mt-6 space-y-3">
                {entries.map(([source, state]) => (
                    <div
                        className="flex items-center gap-3 rounded-2xl border border-white/[.06] bg-black/15 p-4"
                        key={source}
                    >
                        {state === 'ready' ? (
                            <FaCircleCheck className="text-emerald-300" />
                        ) : (
                            <FaSpinner className="animate-spin text-orange-300" />
                        )}
                        <span className="flex-1 text-sm font-bold capitalize text-zinc-300">{source}</span>
                        <span className="text-[10px] font-bold uppercase tracking-[.12em] text-zinc-600">
                            {state === 'ready' ? 'Verbunden' : 'Wartet'}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
}

function QuickLink({ icon: Icon, title, copy, to, pending = false, pendingState }) {
    return (
        <Link
            className="group flex min-h-24 items-center gap-4 rounded-[24px] border border-white/[.07] bg-[#111218] p-5 transition hover:-translate-y-0.5 hover:border-orange-500/20"
            to={to}
        >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-500/10 text-orange-300">
                <Icon />
            </span>
            <div className="min-w-0 flex-1">
                <b className="block text-sm text-white">{title}</b>
                {pending ? (
                    <span className="mt-2 flex items-center gap-2 text-[11px] text-zinc-600">
                        <FaSpinner className="animate-spin text-orange-300" />
                        {pendingState === 'waiting' ? 'Datenquelle nicht verfügbar' : 'Datenquelle wird geladen'}
                    </span>
                ) : (
                    <p className="mt-1 truncate text-xs text-zinc-600">{copy}</p>
                )}
            </div>
            <FaArrowRight className="text-zinc-700 transition group-hover:translate-x-1 group-hover:text-orange-300" />
        </Link>
    );
}

function surfaceLabel(surface) {
    return { WEBSITE: 'Web', LAUNCHER: 'Launcher', CLIENT: 'Client' }[surface] ?? surface;
}

function formatRevenue(revenueByCurrency) {
    const entries = Object.entries(revenueByCurrency ?? {});
    if (!entries.length) return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(0);
    return entries
        .slice(0, 2)
        .map(([currency, cents]) => new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(cents / 100))
        .join(' · ');
}

function formatTime(value) {
    return new Intl.DateTimeFormat('de-DE', { timeStyle: 'short' }).format(value);
}

function pendingTitle(state) {
    return state === 'waiting' ? 'Datenquelle wartet' : 'Daten werden geladen';
}

function pendingText(state) {
    return state === 'waiting' ? 'Noch keine Daten · Neu laden möglich' : 'Quelle wartet auf eine Antwort';
}

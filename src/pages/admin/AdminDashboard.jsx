import { lazy, Suspense, useEffect, useState } from 'react';
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
    AdminPendingState,
    AdminUnavailableState
} from '../../components/admin/AdminUi';
import {
    fetchAuthenticatedUser,
    getAuthenticatedUser,
    isForumAdministrator,
    isStoreAdministrator,
    isTeamAdministrator,
    isUserAdministrator
} from '../../lib/auth';
import { forumApi } from '../../lib/forumApi';
import { storeApi } from '../../lib/storeApi';
import { teamApi } from '../../lib/teamApi';
import { playerAvatar } from '../../lib/userApi';
import { userAdminApi } from '../../lib/userAdminApi';
import { statusApi } from '../../lib/statusAdminApi.js';
import { statusPresentation } from '../../lib/statusPresentation.js';
import AdminRegionStatus from '../../components/admin/AdminRegionStatus.jsx';

const EMPTY_DATA = { users: null, store: null, forum: null, status: null, team: null };
const AdminOverviewActivityChart = lazy(() => import('../../components/admin/AdminOverviewActivityChart'));

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
        status: 'loading',
        team: 'hidden'
    });

    useEffect(() => {
        let active = true;

        async function loadDashboard() {
            if (refreshKey > 0) setRefreshing(true);

            const profile = await fetchAuthenticatedUser();
            if (!active) return;
            setUser(profile);

            if (!profile) {
                setData(EMPTY_DATA);
                setLoading(false);
                setRefreshing(false);
                return;
            }

            const states = {
                users: isUserAdministrator(profile) ? 'loading' : 'hidden',
                store: isStoreAdministrator(profile) ? 'loading' : 'hidden',
                forum: isForumAdministrator(profile) ? 'loading' : 'hidden',
                status: 'loading',
                team: isTeamAdministrator(profile) ? 'loading' : 'hidden'
            };
            setSourceState(states);

            const tasks = [
                {
                    key: 'status',
                    promise: statusApi.summary()
                }
            ];

            if (isUserAdministrator(profile)) tasks.push({ key: 'users', promise: userAdminApi.overview() });
            if (isStoreAdministrator(profile)) tasks.push({ key: 'store', promise: storeApi.admin.overview() });
            if (isTeamAdministrator(profile)) tasks.push({ key: 'team', promise: teamApi.overview() });
            if (isForumAdministrator(profile)) {
                tasks.push({
                    key: 'forum',
                    promise: Promise.all([forumApi.admin.nodes(), forumApi.admin.reports(0, 1, 'OPEN')]).then(
                        ([nodes, reports]) => ({
                            nodes: nodes.nodes.length,
                            reports: reports.total
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
                    nextStates[key] = 'error';
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
                    Object.entries(current).map(([key, state]) => [key, state === 'hidden' ? state : 'error'])
                )
            );
            setLoading(false);
            setRefreshing(false);
        });

        return () => {
            active = false;
        };
    }, [refreshKey]);

    const monitoredServices = data.status?.monitoredServices;
    const healthyServices = data.status?.healthyServices;
    const statusView = statusPresentation(data.status?.overallStatus);
    const metricState = key => ({ pending: sourceState[key] === 'loading',
        error: sourceState[key] === 'error' ? 'Abfrage fehlgeschlagen · über „Neu laden“ erneut versuchen' : '' });
    const retry = () => setRefreshKey(key => key + 1);

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
                            {...metricState('users')}
                            tone="emerald"
                            value={data.users?.onlineUsers}
                        />
                        <AdminMetricCard
                            detail="SeriuxMod-Konten"
                            icon={FaUsers}
                            label="Registriert"
                            {...metricState('users')}
                            tone="sky"
                            value={data.users?.registeredUsers}
                        />
                    </>
                )}
                {isStoreAdministrator(user) && (
                    <AdminMetricCard
                        detail={data.store ? `${data.store.completedPayments} abgeschlossene Zahlungen` : ''}
                        icon={FaBagShopping}
                        label="Shop-Umsatz"
                        {...metricState('store')}
                        tone="orange"
                        value={formatRevenue(data.store?.revenueByCurrency)}
                    />
                )}
                {isForumAdministrator(user) && (
                    <AdminMetricCard
                        detail={data.forum ? `${data.forum.nodes} verwaltete Bereiche` : ''}
                        icon={FaComments}
                        label="Offene Meldungen"
                        {...metricState('forum')}
                        tone="violet"
                        value={data.forum?.reports}
                    />
                )}
                {isTeamAdministrator(user) && (
                    <AdminMetricCard
                        detail={data.team ? `${data.team.activeTodayCount} heute aktiv` : ''}
                        icon={FaUserGroup}
                        label="Offene Team-Aufgaben"
                        {...metricState('team')}
                        tone="sky"
                        value={data.team?.openTodoCount}
                    />
                )}
                <AdminMetricCard
                    detail={data.status ? `${healthyServices}/${monitoredServices} Dienste erreichbar` : ''}
                    icon={data.status?.overallStatus === 'UP' ? FaCircleCheck : FaTriangleExclamation}
                    label="Systemzustand"
                    {...metricState('status')}
                    tone={statusView.tone}
                    value={statusView.label}
                />
            </section>

            <div className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]">
                <AdminRegionStatus summary={data.status} state={sourceState.status} onRetry={retry} />
                {isUserAdministrator(user) ? (
                    <OnlineStaff staff={data.users?.onlineStaff ?? []} state={sourceState.users} onRetry={retry} />
                ) : (
                    <DataSources sourceState={sourceState} />
                )}
            </div>

            {isTeamAdministrator(user) && (
                <div className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,.55fr)]">
                    <Suspense
                        fallback={
                            <section className="grid min-h-[480px] place-items-center rounded-[28px] border border-white/[.07] bg-[#111218]">
                                <div className="text-center">
                                    <FaSpinner className="mx-auto animate-spin text-xl text-orange-300" />
                                    <p className="mt-3 text-xs font-bold text-zinc-500">Aktivitätschart wird geladen</p>
                                </div>
                            </section>
                        }
                    >
                        <AdminOverviewActivityChart
                            activity={data.team?.activityBuckets ?? []}
                            state={sourceState.team}
                            onRetry={retry}
                        />
                    </Suspense>
                    <TeamActivityFeed events={data.team?.recentActivity ?? []} state={sourceState.team} onRetry={retry} />
                </div>
            )}

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
                    {isTeamAdministrator(user) && (
                        <QuickLink
                            copy={
                                sourceState.team === 'ready'
                                    ? `${data.team?.memberCount ?? 0} Mitglieder · ${data.team?.openTodoCount ?? 0} offene Aufgaben`
                                    : null
                            }
                            icon={FaUserGroup}
                            pending={sourceState.team !== 'ready'}
                            pendingState={sourceState.team}
                            title="Teamorganisation"
                            to="/admin/team"
                        />
                    )}
                </div>
            </section>
        </div>
    );
}

function TeamActivityFeed({ events, state, onRetry }) {
    const ready = state === 'ready';
    return (
        <section className="rounded-[28px] border border-white/[.07] bg-[#111218] p-5 shadow-[0_24px_80px_rgba(0,0,0,.14)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="eyebrow">EREIGNISSE</p>
                    <h3 className="mt-2 font-display text-2xl font-bold">Letzte Teamaktivität</h3>
                    <p className="mt-2 text-xs leading-5 text-zinc-600">
                        Persistierte Kalender-, Aufgaben- und Notizänderungen aus dem User-Service.
                    </p>
                </div>
                {ready && (
                    <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/[.07] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.15em] text-emerald-200">
                        Abgefragt
                    </span>
                )}
            </div>

            {state === 'error' ? <div className="mt-6"><AdminUnavailableState title="Team-Verlauf nicht verfügbar" onRetry={onRetry} /></div> : !ready ? (
                <div className="mt-6">
                    <AdminPendingState
                        compact
                        title="Team-Verlauf wird geladen"
                        text="Die Aktivitätsdaten werden direkt aus dem User-Service geladen."
                    />
                </div>
            ) : events.length ? (
                <div className="relative mt-6 space-y-2 before:absolute before:bottom-6 before:left-[19px] before:top-6 before:w-px before:bg-white/[.06]">
                    {events.map((event) => (
                        <div
                            className="relative flex gap-4 rounded-2xl border border-transparent px-1 py-3 transition hover:border-white/[.055] hover:bg-black/15 sm:px-3"
                            key={event.id}
                        >
                            <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-orange-400/15 bg-[#1b1512] text-xs text-orange-300">
                                <FaCircleCheck />
                            </span>
                            <div className="min-w-0 flex-1">
                                <b className="block truncate text-sm text-zinc-200">{humanize(event.action)}</b>
                                <p className="mt-1 truncate text-[11px] text-zinc-600">
                                    {event.actorUsername || shortId(event.actorId)} ·{' '}
                                    {event.area || humanize(event.entityType)}
                                </p>
                            </div>
                            <time
                                className="shrink-0 pt-0.5 text-[9px] font-bold uppercase tracking-[.1em] text-zinc-700"
                                dateTime={event.occurredAt}
                            >
                                {formatDate(event.occurredAt)}
                            </time>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="mt-6">
                    <AdminEmptyState
                        title="Noch keine Teamaktivität"
                        text="Nach der ersten Änderung im Kalender, in Aufgaben oder Notizen erscheint sie hier."
                    />
                </div>
            )}
        </section>
    );
}

function OnlineStaff({ staff, state, onRetry }) {
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
                {state === 'error' ? <AdminUnavailableState title="Präsenzdaten nicht verfügbar" onRetry={onRetry} /> : !ready ? (
                    <AdminPendingState
                        compact
                        title="Teamstatus wird geladen"
                        text="Die Präsenzdaten werden aus dem User-Service gelesen."
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
                        ) : state === 'error' ? <FaTriangleExclamation className="text-red-300" /> : (
                            <FaSpinner className="animate-spin text-orange-300" />
                        )}
                        <span className="flex-1 text-sm font-bold capitalize text-zinc-300">{source}</span>
                        <span className="text-[10px] font-bold uppercase tracking-[.12em] text-zinc-600">
                            {state === 'ready' ? 'Abgefragt' : state === 'error' ? 'Nicht verfügbar' : 'Wird geladen'}
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
                        {pendingState === 'error' ? <FaTriangleExclamation className="text-red-300" /> : <FaSpinner className="animate-spin text-orange-300" />}
                        {pendingState === 'error' ? 'Datenquelle nicht verfügbar' : 'Datenquelle wird geladen'}
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
    if (!revenueByCurrency) return 'Nicht verfügbar';
    const entries = Object.entries(revenueByCurrency);
    if (!entries.length) return 'Keine Umsätze gemeldet';
    return entries
        .slice(0, 2)
        .map(([currency, cents]) => new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(cents / 100))
        .join(' · ');
}

function formatTime(value) {
    return new Intl.DateTimeFormat('de-DE', { timeStyle: 'short' }).format(value);
}

function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? 'Unbekannt'
        : new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function humanize(value) {
    return String(value || 'Unbekannt')
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shortId(value) {
    const text = String(value || 'Unbekannt');
    return text.length > 12 ? `${text.slice(0, 8)}…` : text;
}

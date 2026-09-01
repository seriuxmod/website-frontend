import { useEffect, useMemo, useState } from 'react';
import {
    FaArrowRight,
    FaBagShopping,
    FaCircleCheck,
    FaClock,
    FaComments,
    FaServer,
    FaTriangleExclamation,
    FaUserGroup,
    FaUsers
} from 'react-icons/fa6';
import { Link } from 'react-router-dom';
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

export default function AdminDashboard() {
    const [user, setUser] = useState(() => getAuthenticatedUser());
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ users: null, store: null, forum: null, status: null });

    useEffect(() => {
        let active = true;
        fetchAuthenticatedUser().then(async (profile) => {
            if (!active) return;
            setUser(profile);
            if (!profile) return setLoading(false);

            const tasks = [
                fetch(STATUS_API, { cache: 'no-store' })
                    .then((response) =>
                        response.ok ? response.json() : Promise.reject(new Error('Status unavailable'))
                    )
                    .then((status) => ({ status }))
            ];
            if (isUserAdministrator(profile)) tasks.push(userAdminApi.overview().then((users) => ({ users })));
            if (isStoreAdministrator(profile)) tasks.push(storeApi.admin.overview().then((store) => ({ store })));
            if (isForumAdministrator(profile)) {
                tasks.push(
                    Promise.all([forumApi.admin.nodes(), forumApi.admin.reports(0, 1, 'OPEN')]).then(
                        ([nodes, reports]) => ({
                            forum: {
                                nodes: nodes?.nodes?.length ?? nodes?.length ?? 0,
                                reports: reports?.totalElements ?? reports?.content?.length ?? 0
                            }
                        })
                    )
                );
            }

            const settled = await Promise.allSettled(tasks);
            if (!active) return;
            setData(
                settled.reduce(
                    (result, entry) => (entry.status === 'fulfilled' ? { ...result, ...entry.value } : result),
                    { users: null, store: null, forum: null, status: null }
                )
            );
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, []);

    const backendServices = useMemo(
        () => (data.status?.services ?? []).filter((service) => service.group === 'API Gateway'),
        [data.status]
    );
    const unavailableBackends = backendServices.filter((service) => service.state !== 'UP');

    if (loading) return <StateCard text="Live-Daten werden geladen …" />;

    return (
        <div>
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="eyebrow">LIVE-ÜBERSICHT</p>
                    <h2 className="mt-2 font-display text-4xl font-bold tracking-[-.04em] sm:text-5xl">Dashboard</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
                        Aktuelle Kennzahlen aus User-, Forum-, Store- und Status-Service.
                    </p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/[.06] px-3 py-2 text-xs font-bold text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" /> Live-Daten
                </span>
            </header>

            <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                <MetricCard icon={FaUserGroup} label="Online" value={data.users?.onlineUsers} suffix="Nutzer" />
                <MetricCard icon={FaUsers} label="Registriert" value={data.users?.registeredUsers} suffix="Konten" />
                <MetricCard
                    icon={FaBagShopping}
                    label="Shop-Umsatz"
                    value={formatRevenue(data.store?.revenueByCurrency)}
                    suffix={`${data.store?.completedPayments ?? 0} bezahlte Käufe`}
                />
                <MetricCard
                    danger={unavailableBackends.length > 0 || !data.status}
                    icon={unavailableBackends.length ? FaTriangleExclamation : FaCircleCheck}
                    label="Backends"
                    value={
                        data.status
                            ? `${backendServices.length - unavailableBackends.length}/${backendServices.length}`
                            : null
                    }
                    suffix={
                        !data.status
                            ? 'Status nicht erreichbar'
                            : unavailableBackends.length
                              ? `${unavailableBackends.length} gestört`
                              : 'erreichbar'
                    }
                />
            </section>

            <div className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)]">
                <OnlineStaff staff={data.users?.onlineStaff ?? []} available={Boolean(data.users)} />
                <BackendHealth
                    services={backendServices}
                    available={Boolean(data.status)}
                    generatedAt={data.status?.generatedAt}
                />
            </div>

            <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {isUserAdministrator(user) && (
                    <QuickLink
                        icon={FaUsers}
                        title="Benutzerverwaltung"
                        copy={`${data.users?.registeredUsers ?? '–'} Konten verwalten`}
                        to="/admin/users"
                    />
                )}
                {isForumAdministrator(user) && (
                    <QuickLink
                        icon={FaComments}
                        title="Forumverwaltung"
                        copy={`${data.forum?.reports ?? '–'} offene Meldungen · ${data.forum?.nodes ?? '–'} Bereiche`}
                        to="/admin/forum"
                    />
                )}
                {isStoreAdministrator(user) && (
                    <QuickLink
                        icon={FaBagShopping}
                        title="Shopverwaltung"
                        copy={`${data.store?.orders ?? '–'} Bestellungen · ${data.store?.products ?? '–'} Produkte`}
                        to="/admin/store"
                    />
                )}
            </section>
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, suffix, danger = false }) {
    return (
        <article className="rounded-3xl border border-white/[.07] bg-[#111218] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[.16em] text-zinc-600">{label}</p>
                    <strong className="mt-3 block font-display text-3xl font-bold text-white">{value ?? '–'}</strong>
                    <span className={`mt-2 block text-xs ${danger ? 'text-red-300' : 'text-zinc-600'}`}>{suffix}</span>
                </div>
                <span
                    className={`grid h-11 w-11 place-items-center rounded-2xl ${danger ? 'bg-red-500/10 text-red-300' : 'bg-orange-500/10 text-orange-300'}`}
                >
                    <Icon />
                </span>
            </div>
        </article>
    );
}

function OnlineStaff({ staff, available }) {
    return (
        <section className="rounded-3xl border border-white/[.07] bg-[#111218] p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="eyebrow">TEAM</p>
                    <h3 className="mt-2 font-display text-2xl font-bold">Staff online</h3>
                </div>
                <span className="rounded-full border border-white/[.07] bg-black/20 px-3 py-1.5 text-xs font-bold text-zinc-500">
                    {staff.length}
                </span>
            </div>
            <div className="mt-6 space-y-3">
                {!available ? (
                    <Empty text="Online-Daten konnten nicht geladen werden." />
                ) : staff.length ? (
                    staff.map((member) => (
                        <Link
                            className="flex items-center gap-4 rounded-2xl border border-white/[.055] bg-black/15 p-3 transition hover:border-orange-500/15"
                            key={member.id}
                            to={`/@${member.username}`}
                        >
                            <img
                                className="h-11 w-11 rounded-xl [image-rendering:pixelated]"
                                src={playerAvatar(member.id, 96)}
                                alt=""
                            />
                            <div className="min-w-0 flex-1">
                                <b className="block truncate text-sm text-white">{member.username}</b>
                                <p className="mt-1 truncate text-xs text-orange-300">{member.groups.join(' · ')}</p>
                            </div>
                            <div className="flex flex-wrap justify-end gap-1.5">
                                {member.surfaces.map((surface) => (
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
                    <Empty text="Aktuell ist kein Staff-Mitglied online." />
                )}
            </div>
        </section>
    );
}

function BackendHealth({ services, available, generatedAt }) {
    return (
        <section className="rounded-3xl border border-white/[.07] bg-[#111218] p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="eyebrow">INFRASTRUKTUR</p>
                    <h3 className="mt-2 font-display text-2xl font-bold">Backend-Status</h3>
                </div>
                <FaServer className="mt-1 text-zinc-700" />
            </div>
            <div className="mt-6 space-y-2">
                {!available ? (
                    <Empty text="Status-Service ist nicht erreichbar." />
                ) : (
                    services.map((service) => {
                        const up = service.state === 'UP';
                        return (
                            <div className="flex items-center gap-3 rounded-xl px-1 py-2" key={service.monitorId}>
                                <span className={`h-2.5 w-2.5 rounded-full ${up ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                <span className="min-w-0 flex-1 truncate text-sm text-zinc-300">
                                    {service.displayName}
                                </span>
                                <span className={`text-[10px] font-bold ${up ? 'text-emerald-300' : 'text-red-300'}`}>
                                    {up ? 'ONLINE' : 'GESTÖRT'}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
            {generatedAt && (
                <p className="mt-5 flex items-center gap-2 border-t border-white/[.05] pt-4 text-[10px] text-zinc-700">
                    <FaClock /> Stand{' '}
                    {new Intl.DateTimeFormat('de-DE', { timeStyle: 'short' }).format(new Date(generatedAt))}
                </p>
            )}
        </section>
    );
}

function QuickLink({ icon: Icon, title, copy, to }) {
    return (
        <Link
            className="group flex items-center gap-4 rounded-3xl border border-white/[.07] bg-[#111218] p-5 transition hover:border-orange-500/20"
            to={to}
        >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-500/10 text-orange-300">
                <Icon />
            </span>
            <div className="min-w-0 flex-1">
                <b className="block text-sm text-white">{title}</b>
                <p className="mt-1 truncate text-xs text-zinc-600">{copy}</p>
            </div>
            <FaArrowRight className="text-zinc-700 transition group-hover:translate-x-1 group-hover:text-orange-300" />
        </Link>
    );
}

function Empty({ text }) {
    return (
        <div className="rounded-2xl border border-dashed border-white/[.07] px-4 py-6 text-center text-xs text-zinc-600">
            {text}
        </div>
    );
}
function StateCard({ text }) {
    return <div className="rounded-3xl border border-white/[.07] bg-[#111218] p-10 text-sm text-zinc-500">{text}</div>;
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

import { useEffect, useMemo, useState } from 'react';
import { FaBagShopping, FaChartLine, FaComments, FaServer, FaUsers, FaXmark } from 'react-icons/fa6';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { AdminPendingState } from './AdminUi';
import {
    fetchAuthenticatedUser,
    getAuthenticatedUser,
    isForumAdministrator,
    isStoreAdministrator,
    isUserAdministrator
} from '../../lib/auth';

export default function AdminLayout() {
    const [user, setUser] = useState(() => getAuthenticatedUser());
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        fetchAuthenticatedUser().then((profile) => {
            setUser(profile);
            setChecking(false);
        });
    }, []);

    const navigationGroups = useMemo(() => {
        const management = [];
        if (isUserAdministrator(user)) management.push({ to: '/admin/users', label: 'Benutzer', icon: FaUsers });
        if (isForumAdministrator(user)) management.push({ to: '/admin/forum', label: 'Forum', icon: FaComments });
        if (isStoreAdministrator(user)) management.push({ to: '/admin/store', label: 'Shop', icon: FaBagShopping });

        return [
            {
                label: 'Allgemein',
                items: [{ to: '/admin', label: 'Übersicht', icon: FaChartLine, end: true }]
            },
            { label: 'Verwaltung', items: management },
            { label: 'System', items: [{ to: '/status', label: 'Systemstatus', icon: FaServer }] }
        ].filter((group) => group.items.length);
    }, [user]);

    const allowed = isUserAdministrator(user) || isForumAdministrator(user) || isStoreAdministrator(user);

    return (
        <main className="min-h-screen bg-[#090a0d] px-4 pb-28 pt-28 text-white sm:px-6 sm:pt-32 xl:px-8">
            <div className="mx-auto grid max-w-[1760px] gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:gap-8">
                <aside className="h-fit self-start overflow-hidden rounded-[28px] border border-white/[.075] bg-[linear-gradient(180deg,#15161d_0%,#101116_100%)] p-3 shadow-[0_24px_80px_rgba(0,0,0,.2)] lg:sticky lg:top-28 lg:flex lg:h-[calc(100vh-9rem)] lg:flex-col">
                    <div className="flex items-center gap-3 px-3 pb-5 pt-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-orange-400/15 bg-orange-400/[.07]">
                            <img className="h-7 w-7 object-contain" src="/logo.png" alt="" />
                        </span>
                        <div className="min-w-0">
                            <p className="eyebrow">TEAMPORTAL</p>
                            <h1 className="mt-1 truncate font-display text-lg font-bold">Administration</h1>
                        </div>
                    </div>
                    <nav
                        className="flex gap-4 overflow-x-auto pb-1 lg:block lg:overflow-visible"
                        aria-label="Administration"
                    >
                        {navigationGroups.map((group) => (
                            <div className="shrink-0 lg:mb-6" key={group.label}>
                                <p className="mb-2 hidden px-3 text-[9px] font-extrabold uppercase tracking-[.2em] text-zinc-700 lg:block">
                                    {group.label}
                                </p>
                                <div className="flex gap-2 lg:flex-col">
                                    {group.items.map(({ to, label, icon: Icon, end }) => (
                                        <NavLink
                                            className={({ isActive }) =>
                                                `group flex shrink-0 items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition ${
                                                    isActive
                                                        ? 'bg-orange-500/10 text-orange-200 ring-1 ring-inset ring-orange-400/15'
                                                        : 'text-zinc-500 hover:bg-white/[.04] hover:text-white'
                                                }`
                                            }
                                            end={end}
                                            key={to}
                                            to={to}
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    <span
                                                        className={`grid h-8 w-8 place-items-center rounded-xl transition ${isActive ? 'bg-orange-400/10 text-orange-300' : 'bg-white/[.035] text-zinc-600 group-hover:text-zinc-300'}`}
                                                    >
                                                        <Icon className="text-sm" />
                                                    </span>
                                                    {label}
                                                </>
                                            )}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>
                    <div className="mt-auto hidden border-t border-white/[.06] px-3 pb-2 pt-5 lg:block">
                        <Link
                            className="flex items-center gap-3 rounded-xl px-2 py-2 text-xs font-bold text-zinc-600 transition hover:bg-white/[.035] hover:text-white"
                            to="/"
                        >
                            <FaXmark /> Teamportal verlassen
                        </Link>
                    </div>
                </aside>
                <section className="min-w-0">
                    {checking ? (
                        <AdminPendingState
                            title="Berechtigungen werden geprüft"
                            text="Die Zugriffsrechte werden sicher aus deinem Benutzerkonto geladen."
                        />
                    ) : allowed ? (
                        <Outlet />
                    ) : (
                        <AdminState text="Dieser Bereich ist ausschließlich für das SeriuxMod-Team freigegeben." />
                    )}
                </section>
            </div>
        </main>
    );
}

function AdminState({ text }) {
    return (
        <div className="rounded-[28px] border border-white/[.07] bg-[#111218] p-10 text-sm text-zinc-500">{text}</div>
    );
}

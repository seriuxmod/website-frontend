import { useEffect, useMemo, useState } from 'react';
import { FaBagShopping, FaChartLine, FaComments, FaServer, FaUsers, FaXmark } from 'react-icons/fa6';
import { Link, NavLink, Outlet } from 'react-router-dom';
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

    const items = useMemo(() => {
        const navigation = [{ to: '/admin', label: 'Übersicht', icon: FaChartLine, end: true }];
        if (isUserAdministrator(user)) navigation.push({ to: '/admin/users', label: 'Benutzer', icon: FaUsers });
        if (isForumAdministrator(user)) navigation.push({ to: '/admin/forum', label: 'Forum', icon: FaComments });
        if (isStoreAdministrator(user)) navigation.push({ to: '/admin/store', label: 'Shop', icon: FaBagShopping });
        navigation.push({ to: '/status', label: 'Systemstatus', icon: FaServer });
        return navigation;
    }, [user]);

    const allowed = isUserAdministrator(user) || isForumAdministrator(user) || isStoreAdministrator(user);

    return (
        <main className="min-h-screen bg-[#090a0d] px-4 pb-28 pt-28 text-white sm:px-6 sm:pt-32 xl:px-8">
            <div className="mx-auto grid max-w-[1720px] gap-7 lg:grid-cols-[260px_minmax(0,1fr)] xl:gap-10">
                <aside className="h-fit rounded-[26px] border border-white/[.07] bg-[#111218] p-3 lg:sticky lg:top-28">
                    <div className="px-3 pb-4 pt-3">
                        <p className="eyebrow">TEAMPORTAL</p>
                        <h1 className="mt-2 font-display text-xl font-bold">Administration</h1>
                        <p className="mt-2 text-xs leading-5 text-zinc-600">SeriuxMod zentral verwalten</p>
                    </div>
                    <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col" aria-label="Administration">
                        {items.map(({ to, label, icon: Icon, end }) => (
                            <NavLink
                                className={({ isActive }) =>
                                    `flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition ${
                                        isActive
                                            ? 'bg-orange-500/10 text-orange-300 ring-1 ring-inset ring-orange-500/15'
                                            : 'text-zinc-500 hover:bg-white/[.035] hover:text-white'
                                    }`
                                }
                                end={end}
                                key={to}
                                to={to}
                            >
                                <Icon className="text-base" />
                                {label}
                            </NavLink>
                        ))}
                    </nav>
                    <div className="mt-3 hidden border-t border-white/[.06] px-3 pt-4 lg:block">
                        <Link
                            className="flex items-center gap-2 text-xs font-bold text-zinc-600 transition hover:text-white"
                            to="/"
                        >
                            <FaXmark /> Teamportal verlassen
                        </Link>
                    </div>
                </aside>
                <section className="min-w-0">
                    {checking ? (
                        <AdminState text="Berechtigungen werden geprüft …" />
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
    return <div className="rounded-3xl border border-white/[.07] bg-[#111218] p-10 text-sm text-zinc-500">{text}</div>;
}

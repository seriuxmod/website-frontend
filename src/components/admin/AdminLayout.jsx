import { useEffect, useMemo, useRef, useState } from 'react';
import { FaChevronDown, FaXmark } from 'react-icons/fa6';
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { adminGroupIsActive, adminNavigationGroups } from '../../config/adminNavigation';
import {
    fetchAuthenticatedUser,
    hasStoredSession,
    isForumAdministrator,
    isStoreAdministrator,
    isUserAdministrator
} from '../../lib/auth';

export default function AdminLayout() {
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(() => hasStoredSession());
    const verificationId = useRef(0);
    const location = useLocation();

    const activeGroup = useMemo(
        () => adminNavigationGroups.find((group) => adminGroupIsActive(location.pathname, group))?.id,
        [location.pathname]
    );
    const [openGroup, setOpenGroup] = useState(activeGroup ?? 'general');

    useEffect(() => {
        const verifyAccess = async () => {
            const requestId = ++verificationId.current;
            setChecking(true);
            const profile = await fetchAuthenticatedUser();
            if (requestId !== verificationId.current) return;
            setUser(profile);
            setChecking(false);
        };

        const handleAuthChange = (event) => {
            if (event.detail?.authenticated === false) {
                verificationId.current += 1;
                setUser(null);
                setChecking(false);
                return;
            }
            verifyAccess();
        };

        if (hasStoredSession()) verifyAccess();
        else setChecking(false);

        window.addEventListener('seriux-auth-changed', handleAuthChange);
        return () => {
            verificationId.current += 1;
            window.removeEventListener('seriux-auth-changed', handleAuthChange);
        };
    }, []);

    useEffect(() => {
        if (activeGroup) setOpenGroup(activeGroup);
    }, [activeGroup]);

    const allowed = isUserAdministrator(user) || isForumAdministrator(user) || isStoreAdministrator(user);

    if (checking) return null;
    if (!allowed) return <Navigate to="/" replace />;

    return (
        <main className="min-h-screen bg-[#090a0d] pb-28 pt-28 text-white sm:pt-32 lg:pl-64">
            <aside className="mx-4 mb-6 overflow-hidden border border-white/[.065] bg-[linear-gradient(180deg,#15161d_0%,#101116_100%)] p-4 shadow-[0_24px_80px_rgba(0,0,0,.24)] sm:mx-6 lg:fixed lg:bottom-0 lg:left-0 lg:top-[108px] lg:z-30 lg:mx-0 lg:mb-0 lg:flex lg:w-64 lg:flex-col lg:border-b-0 lg:border-l-0">
                <div className="flex items-center gap-3 px-3 pb-4 pt-3">
                    <img className="h-9 w-9 shrink-0 object-contain" src="/logo.png" alt="" />
                    <div className="min-w-0">
                        <p className="eyebrow">TEAMPORTAL</p>
                        <h1 className="mt-1 truncate font-display text-lg font-bold">Administration</h1>
                    </div>
                </div>

                <nav className="admin-sidebar-scroll min-h-0 flex-1 overflow-y-auto pr-1" aria-label="Administration">
                    {adminNavigationGroups.map((group) => {
                        const GroupIcon = group.icon;
                        const expanded = openGroup === group.id;
                        const containsActiveItem = group.id === activeGroup;

                        return (
                            <section className="py-1.5" key={group.id}>
                                <button
                                    type="button"
                                    className={`group flex w-full items-center gap-3 px-3 py-2 text-left transition ${
                                        containsActiveItem ? 'text-orange-200' : 'text-zinc-500 hover:text-zinc-200'
                                    }`}
                                    aria-expanded={expanded}
                                    aria-controls={`admin-navigation-${group.id}`}
                                    onClick={() => setOpenGroup((current) => (current === group.id ? null : group.id))}
                                >
                                    <GroupIcon className="text-xs" />
                                    <span className="flex-1 text-[10px] font-extrabold uppercase tracking-[.17em]">
                                        {group.label}
                                    </span>
                                    <FaChevronDown
                                        className={`text-[9px] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                <div
                                    className={`grid transition-[grid-template-rows,opacity] duration-200 ${
                                        expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                    }`}
                                    id={`admin-navigation-${group.id}`}
                                >
                                    <div className="overflow-hidden">
                                        <div className="pb-1 pt-1">
                                            {group.items.map(({ to, label, icon: Icon, end }) => (
                                                <NavLink
                                                    className={({ isActive }) =>
                                                        `group flex items-center gap-3 border-l-2 px-4 py-2.5 text-sm font-bold transition ${
                                                            isActive
                                                                ? 'border-orange-400 text-orange-100'
                                                                : 'border-transparent text-zinc-500 hover:text-white'
                                                        }`
                                                    }
                                                    end={end}
                                                    key={to}
                                                    to={to}
                                                >
                                                    {({ isActive }) => (
                                                        <>
                                                            <Icon
                                                                className={`w-4 shrink-0 text-xs transition ${
                                                                    isActive
                                                                        ? 'text-orange-300'
                                                                        : 'text-zinc-600 group-hover:text-zinc-300'
                                                                }`}
                                                            />
                                                            <span className="truncate">{label}</span>
                                                        </>
                                                    )}
                                                </NavLink>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        );
                    })}
                </nav>

                <div className="mt-3 border-t border-white/[.06] px-2 pb-2 pt-4">
                    <Link
                        className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-zinc-600 transition hover:text-white"
                        to="/"
                    >
                        <FaXmark /> Teamportal verlassen
                    </Link>
                </div>
            </aside>

            <section className="min-w-0 px-4 sm:px-6 lg:px-8 xl:px-10">
                <Outlet />
            </section>
        </main>
    );
}

import { useEffect, useMemo, useState } from 'react';
import {
    FaBagShopping,
    FaBan,
    FaBoxesStacked,
    FaChartColumn,
    FaChartLine,
    FaChevronDown,
    FaCircleNodes,
    FaComments,
    FaCreditCard,
    FaGear,
    FaGift,
    FaLayerGroup,
    FaListCheck,
    FaMoneyCheckDollar,
    FaObjectGroup,
    FaPeopleGroup,
    FaReceipt,
    FaServer,
    FaShieldHalved,
    FaTags,
    FaUserGroup,
    FaUserShield,
    FaUsers,
    FaVolumeXmark,
    FaXmark
} from 'react-icons/fa6';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AdminPendingState } from './AdminUi';
import {
    fetchAuthenticatedUser,
    getAuthenticatedUser,
    isForumAdministrator,
    isStoreAdministrator,
    isUserAdministrator
} from '../../lib/auth';

const NAVIGATION_GROUPS = [
    {
        id: 'general',
        label: 'Allgemein',
        icon: FaChartLine,
        items: [
            { to: '/admin', label: 'Übersicht', icon: FaChartLine, end: true },
            { to: '/admin/system-status', label: 'Systemstatus', icon: FaServer }
        ]
    },
    {
        id: 'management',
        label: 'Verwaltung',
        icon: FaUsers,
        items: [
            { to: '/admin/players', label: 'Spieler', icon: FaUsers },
            { to: '/admin/permissions', label: 'Berechtigungen', icon: FaUserShield },
            { to: '/admin/cosmetics', label: 'Cosmetics', icon: FaGift },
            { to: '/admin/friends', label: 'Freunde', icon: FaUserGroup },
            { to: '/admin/clans', label: 'Clans', icon: FaShieldHalved },
            { to: '/admin/parties', label: 'Parties', icon: FaPeopleGroup }
        ]
    },
    {
        id: 'moderation',
        label: 'Moderation',
        icon: FaShieldHalved,
        items: [
            { to: '/admin/moderation', label: 'Übersicht', icon: FaChartColumn, end: true },
            { to: '/admin/moderation/bans', label: 'Bans', icon: FaBan },
            { to: '/admin/moderation/mutes', label: 'Mutes', icon: FaVolumeXmark },
            { to: '/admin/moderation/settings', label: 'Einstellungen', icon: FaGear }
        ]
    },
    {
        id: 'forum',
        label: 'Forum',
        icon: FaComments,
        items: [
            { to: '/admin/forum/analytics', label: 'Nutzungsstatistik', icon: FaChartColumn },
            { to: '/admin/forum/structure', label: 'Struktur', icon: FaCircleNodes },
            { to: '/admin/forum/permissions', label: 'Gruppenrechte', icon: FaUserShield },
            { to: '/admin/forum/labels', label: 'Labels', icon: FaTags },
            { to: '/admin/forum/reports', label: 'Meldungen', icon: FaBan },
            { to: '/admin/forum/suggestions', label: 'Vorschläge', icon: FaListCheck },
            { to: '/admin/forum/blog', label: 'Blog', icon: FaObjectGroup },
            { to: '/admin/forum/settings', label: 'Einstellungen', icon: FaGear }
        ]
    },
    {
        id: 'commerce',
        label: 'E-Commerce',
        icon: FaBagShopping,
        items: [
            { to: '/admin/commerce', label: 'Übersicht', icon: FaChartColumn, end: true },
            { to: '/admin/commerce/customers', label: 'Kunden', icon: FaUsers },
            { to: '/admin/commerce/catalog', label: 'Katalog', icon: FaBoxesStacked },
            { to: '/admin/commerce/fields', label: 'Produktfelder', icon: FaLayerGroup },
            { to: '/admin/commerce/coupons', label: 'Coupons', icon: FaTags },
            { to: '/admin/commerce/orders', label: 'Bestellungen', icon: FaReceipt },
            { to: '/admin/commerce/payment-methods', label: 'Zahlungsmethoden', icon: FaCreditCard },
            { to: '/admin/commerce/settings', label: 'Einstellungen', icon: FaMoneyCheckDollar }
        ]
    }
];

function itemIsActive(pathname, item) {
    return item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export default function AdminLayout() {
    const [user, setUser] = useState(() => getAuthenticatedUser());
    const [checking, setChecking] = useState(true);
    const location = useLocation();

    const activeGroup = useMemo(
        () => NAVIGATION_GROUPS.find((group) => group.items.some((item) => itemIsActive(location.pathname, item)))?.id,
        [location.pathname]
    );
    const [openGroup, setOpenGroup] = useState(activeGroup ?? 'general');

    useEffect(() => {
        fetchAuthenticatedUser().then((profile) => {
            setUser(profile);
            setChecking(false);
        });
    }, []);

    useEffect(() => {
        if (activeGroup) setOpenGroup(activeGroup);
    }, [activeGroup]);

    const allowed = isUserAdministrator(user) || isForumAdministrator(user) || isStoreAdministrator(user);

    return (
        <main className="min-h-screen bg-[#090a0d] pb-28 pt-28 text-white sm:pt-32 lg:pl-[272px]">
            <aside className="mx-4 mb-6 overflow-hidden rounded-[26px] border border-white/[.075] bg-[linear-gradient(180deg,#15161d_0%,#101116_100%)] p-3 shadow-[0_24px_80px_rgba(0,0,0,.24)] sm:mx-6 lg:fixed lg:bottom-0 lg:left-0 lg:top-[108px] lg:z-30 lg:mx-0 lg:mb-0 lg:flex lg:w-[272px] lg:flex-col lg:rounded-l-none lg:rounded-r-[28px] lg:border-b-0 lg:border-l-0">
                <div className="flex items-center gap-3 px-3 pb-4 pt-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-orange-400/15 bg-orange-400/[.07]">
                        <img className="h-7 w-7 object-contain" src="/logo.png" alt="" />
                    </span>
                    <div className="min-w-0">
                        <p className="eyebrow">TEAMPORTAL</p>
                        <h1 className="mt-1 truncate font-display text-lg font-bold">Administration</h1>
                    </div>
                </div>

                <nav className="admin-sidebar-scroll min-h-0 flex-1 overflow-y-auto pr-1" aria-label="Administration">
                    {NAVIGATION_GROUPS.map((group) => {
                        const GroupIcon = group.icon;
                        const expanded = openGroup === group.id;
                        const containsActiveItem = group.id === activeGroup;

                        return (
                            <section className="border-t border-white/[.055] py-2 first:border-t-0" key={group.id}>
                                <button
                                    type="button"
                                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                                        containsActiveItem
                                            ? 'text-orange-200'
                                            : 'text-zinc-500 hover:bg-white/[.035] hover:text-zinc-200'
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
                                        <div className="space-y-1 pb-1 pt-1">
                                            {group.items.map(({ to, label, icon: Icon, end }) => (
                                                <NavLink
                                                    className={({ isActive }) =>
                                                        `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                                                            isActive
                                                                ? 'bg-orange-500/10 text-orange-100 ring-1 ring-inset ring-orange-400/15'
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
                                                                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${
                                                                    isActive
                                                                        ? 'bg-orange-400/10 text-orange-300'
                                                                        : 'bg-white/[.03] text-zinc-600 group-hover:text-zinc-300'
                                                                }`}
                                                            >
                                                                <Icon className="text-xs" />
                                                            </span>
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
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-zinc-600 transition hover:bg-white/[.035] hover:text-white"
                        to="/"
                    >
                        <FaXmark /> Teamportal verlassen
                    </Link>
                </div>
            </aside>

            <section className="min-w-0 px-4 sm:px-6 lg:px-8 xl:px-10">
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
        </main>
    );
}

function AdminState({ text }) {
    return (
        <div className="rounded-[28px] border border-white/[.07] bg-[#111218] p-10 text-sm text-zinc-500">{text}</div>
    );
}

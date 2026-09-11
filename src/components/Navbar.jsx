import { useEffect, useRef, useState } from 'react';
import {
    FaArrowRightFromBracket,
    FaBagShopping,
    FaBars,
    FaBell,
    FaChevronDown,
    FaCopy,
    FaRightToBracket,
    FaKey,
    FaShieldHalved,
    FaUser,
    FaUsers,
    FaXmark
} from 'react-icons/fa6';
import { Link, useLocation } from 'react-router-dom';
import {
    beginLogin,
    fetchAuthenticatedUser,
    getAuthenticatedUser,
    hasAnyPermission,
    hasStoredSession,
    isAdministrator,
    isForumAdministrator,
    isStoreAdministrator,
    isTeamAdministrator,
    isUserAdministrator,
    logout,
    refreshAuthenticatedSession
} from '../lib/auth';
import { communityItems } from '../config/community';
import { adminGroupIsActive, adminItemIsActive, adminNavigationGroups } from '../config/adminNavigation';
import NavbarNotifications from './NavbarNotifications';
import PlayerSearch from './PlayerSearch';

function adminNavigationFor(user) {
    return adminNavigationGroups
        .filter((group) => {
            if (group.id === 'forum') return isForumAdministrator(user);
            if (group.id === 'commerce') return isStoreAdministrator(user);
            if (group.id === 'team') return isTeamAdministrator(user);
            if (group.id === 'management' || group.id === 'moderation') return isUserAdministrator(user);
            return true;
        })
        .map((group) => ({
            ...group,
            items: group.items.filter(
                (item) => !item.permissions?.length || hasAnyPermission(user, ...item.permissions)
            )
        }))
        .filter((group) => group.items.length > 0);
}

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [communityOpen, setCommunityOpen] = useState(false);
    const [adminMenuOpen, setAdminMenuOpen] = useState(null);
    const [mobileAdminGroup, setMobileAdminGroup] = useState(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const [user, setUser] = useState(() => getAuthenticatedUser());
    const [logoutPending, setLogoutPending] = useState(false);
    const [logoutNotice, setLogoutNotice] = useState('');
    const [unreadForumNotifications, setUnreadForumNotifications] = useState(0);
    const [profileContext, setProfileContext] = useState(null);
    const location = useLocation();
    const searchRef = useRef(null);
    const communityRef = useRef(null);
    const adminNavigationRef = useRef(null);
    const adminMenuCloseTimerRef = useRef(null);
    const profileRef = useRef(null);
    const logoutNoticeTimerRef = useRef(null);

    useEffect(() => {
        let active = true;
        setMobileOpen(false);
        setCommunityOpen(false);
        setAdminMenuOpen(null);
        setMobileAdminGroup(
            adminNavigationGroups.find((group) => adminGroupIsActive(location.pathname, group))?.id ?? null
        );
        setProfileOpen(false);
        const tokenUser = getAuthenticatedUser();
        if (tokenUser || !hasStoredSession()) setUser(tokenUser);
        fetchAuthenticatedUser().then((profile) => {
            if (active && (profile || !hasStoredSession())) setUser(profile);
        });
        return () => {
            active = false;
        };
    }, [location.pathname]);

    useEffect(() => {
        let active = true;
        const synchronizeSession = async () => {
            const profile = await refreshAuthenticatedSession();
            if (!active) return;
            if (profile || !hasStoredSession()) setUser(profile);
        };
        const synchronizeVisibleSession = () => {
            if (document.visibilityState === 'visible') void synchronizeSession();
        };

        const refreshTimer = window.setInterval(synchronizeVisibleSession, 60_000);
        document.addEventListener('visibilitychange', synchronizeVisibleSession);
        window.addEventListener('focus', synchronizeSession);
        window.addEventListener('online', synchronizeSession);
        return () => {
            active = false;
            window.clearInterval(refreshTimer);
            document.removeEventListener('visibilitychange', synchronizeVisibleSession);
            window.removeEventListener('focus', synchronizeSession);
            window.removeEventListener('online', synchronizeSession);
        };
    }, []);

    useEffect(() => {
        setProfileContext(null);
        const updateProfileContext = (event) => setProfileContext(event.detail);
        window.addEventListener('seriux-profile-context', updateProfileContext);
        return () => window.removeEventListener('seriux-profile-context', updateProfileContext);
    }, [location.pathname]);

    useEffect(() => {
        const onPointerDown = (event) => {
            if (!communityRef.current?.contains(event.target)) setCommunityOpen(false);
            if (!adminNavigationRef.current?.contains(event.target)) {
                window.clearTimeout(adminMenuCloseTimerRef.current);
                setAdminMenuOpen(null);
            }
            if (!profileRef.current?.contains(event.target)) setProfileOpen(false);
        };
        const onKeyDown = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                searchRef.current?.focus();
            }
            if (event.key === 'Escape') {
                setCommunityOpen(false);
                window.clearTimeout(adminMenuCloseTimerRef.current);
                setAdminMenuOpen(null);
                setProfileOpen(false);
                setMobileOpen(false);
            }
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
            window.clearTimeout(adminMenuCloseTimerRef.current);
        };
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileOpen]);

    useEffect(() => {
        const onAuthChanged = (event) => {
            if (event.detail?.authenticated !== false) return;
            setUser(null);
            setUnreadForumNotifications(0);
            setProfileOpen(false);
            window.clearTimeout(adminMenuCloseTimerRef.current);
            setAdminMenuOpen(null);
            setMobileOpen(false);
            setLogoutNotice(
                event.detail.reason === 'session_expired'
                    ? 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.'
                    : event.detail.authServerSessionEnded
                      ? 'Du wurdest erfolgreich abgemeldet.'
                      : 'Du bist lokal abgemeldet. Die Authserver-Sitzung konnte nicht beendet werden.'
            );
            window.clearTimeout(logoutNoticeTimerRef.current);
            logoutNoticeTimerRef.current = window.setTimeout(() => setLogoutNotice(''), 5000);
        };
        window.addEventListener('seriux-auth-changed', onAuthChanged);
        return () => {
            window.removeEventListener('seriux-auth-changed', onAuthChanged);
            window.clearTimeout(logoutNoticeTimerRef.current);
        };
    }, []);

    const signOut = async () => {
        if (logoutPending) return;
        setProfileOpen(false);
        setLogoutPending(true);
        await logout();
        setLogoutPending(false);
    };

    const cancelAdminMenuClose = () => {
        window.clearTimeout(adminMenuCloseTimerRef.current);
        adminMenuCloseTimerRef.current = null;
    };

    const scheduleAdminMenuClose = () => {
        cancelAdminMenuClose();
        adminMenuCloseTimerRef.current = window.setTimeout(() => setAdminMenuOpen(null), 450);
    };

    const isAdminArea = location.pathname === '/admin' || location.pathname.startsWith('/admin/');
    const showAdminNavigation = isAdminArea && isAdministrator(user);
    const visibleAdminNavigationGroups = adminNavigationFor(user);

    return (
        <header
            className={`pointer-events-none fixed inset-x-0 top-0 z-50 px-3 sm:px-6 ${profileContext?.visible ? 'pt-1 sm:pt-1' : 'pt-3 sm:pt-5'}`}
        >
            <nav
                className={`liquid-nav pointer-events-auto mx-auto flex h-[74px] max-w-[1500px] items-center gap-3 px-4 sm:px-5 ${profileContext?.visible ? 'profile-nav-expanded' : ''}`}
                aria-label="Hauptnavigation"
            >
                <Link to="/" className="flex min-w-0 shrink-0 items-center" aria-label="SeriuxMod Startseite">
                    <img
                        className="h-11 w-[166px] object-contain object-left sm:w-[190px]"
                        src="/seriuxmod-wordmark.png"
                        alt="SeriuxMod"
                    />
                </Link>

                {showAdminNavigation ? (
                    <div
                        ref={adminNavigationRef}
                        className="ml-auto hidden items-center gap-0.5 lg:flex"
                        onBlur={(event) => {
                            if (!event.currentTarget.contains(event.relatedTarget)) scheduleAdminMenuClose();
                        }}
                        onMouseEnter={cancelAdminMenuClose}
                        onMouseLeave={scheduleAdminMenuClose}
                    >
                        {visibleAdminNavigationGroups.map((group) => {
                            const GroupIcon = group.icon;
                            const active = adminGroupIsActive(location.pathname, group);
                            const expanded = adminMenuOpen === group.id;

                            return (
                                <div
                                    className="static"
                                    key={group.id}
                                    onMouseEnter={() => {
                                        cancelAdminMenuClose();
                                        setAdminMenuOpen(group.id);
                                    }}
                                >
                                    <button
                                        type="button"
                                        className={`nav-item flex items-center gap-2 px-3 ${active || expanded ? 'nav-item-active' : ''}`}
                                        aria-expanded={expanded}
                                        onClick={() =>
                                            setAdminMenuOpen((current) => (current === group.id ? null : group.id))
                                        }
                                        onFocus={() => setAdminMenuOpen(group.id)}
                                    >
                                        {group.label}
                                        <FaChevronDown
                                            className={`text-[9px] transition ${expanded ? 'rotate-180' : ''}`}
                                        />
                                    </button>

                                    {expanded && (
                                        <div
                                            className="absolute left-1/2 top-full w-[min(940px,calc(100vw-3rem))] -translate-x-1/2 pt-4"
                                            onMouseEnter={cancelAdminMenuClose}
                                            onMouseLeave={scheduleAdminMenuClose}
                                        >
                                            <div className="liquid-menu grid max-h-[min(640px,calc(100vh-120px))] overflow-hidden rounded-[24px] lg:grid-cols-[250px_minmax(0,1fr)]">
                                                <div className="flex flex-col bg-[linear-gradient(145deg,#f04400,#a92b00)] p-6 text-white">
                                                    <GroupIcon className="text-2xl" />
                                                    <p className="mt-7 text-[10px] font-black uppercase tracking-[.2em] text-white/60">
                                                        Teamportal
                                                    </p>
                                                    <h2 className="mt-2 font-display text-2xl font-bold">
                                                        {group.label}
                                                    </h2>
                                                    <p className="mt-3 text-xs leading-5 text-white/70">
                                                        {group.description}
                                                    </p>
                                                    <Link
                                                        className="mt-auto pt-8 text-xs font-extrabold text-white"
                                                        onClick={() => setAdminMenuOpen(null)}
                                                        to={group.items[0].to}
                                                    >
                                                        Bereich öffnen <span aria-hidden="true">→</span>
                                                    </Link>
                                                </div>

                                                <div className="overflow-y-auto p-5 sm:p-6">
                                                    <div className="flex items-center justify-between border-b border-white/[.06] pb-4">
                                                        <div>
                                                            <p className="eyebrow">{group.label}</p>
                                                            <b className="mt-1 block text-sm text-white">
                                                                Ziel auswählen
                                                            </b>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-zinc-600">
                                                            {group.items.length} Bereiche
                                                        </span>
                                                    </div>
                                                    <div className="mt-3 grid gap-x-6 sm:grid-cols-2">
                                                        {group.items.map((item) => {
                                                            const ItemIcon = item.icon;
                                                            const itemActive = adminItemIsActive(
                                                                location.pathname,
                                                                item
                                                            );
                                                            return (
                                                                <Link
                                                                    className={`group flex gap-3 border-b border-white/[.045] py-4 transition ${
                                                                        itemActive
                                                                            ? 'text-orange-200'
                                                                            : 'text-zinc-300 hover:text-white'
                                                                    }`}
                                                                    key={item.to}
                                                                    onClick={() => setAdminMenuOpen(null)}
                                                                    to={item.to}
                                                                >
                                                                    <ItemIcon
                                                                        className={`mt-0.5 w-4 shrink-0 text-sm ${
                                                                            itemActive
                                                                                ? 'text-orange-300'
                                                                                : 'text-zinc-600 group-hover:text-orange-300'
                                                                        }`}
                                                                    />
                                                                    <span className="min-w-0">
                                                                        <b className="block text-sm">{item.label}</b>
                                                                        <small className="mt-1 block text-[10px] leading-4 text-zinc-600">
                                                                            {item.description}
                                                                        </small>
                                                                    </span>
                                                                </Link>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : !isAdminArea ? (
                    <div className="ml-auto hidden items-center gap-1 lg:flex">
                        <Link to="/" className={`nav-item ${location.pathname === '/' ? 'nav-item-active' : ''}`}>
                            SeriuxMod
                        </Link>
                        <Link
                            to="/forum"
                            className={`nav-item ${location.pathname.startsWith('/forum') ? 'nav-item-active' : ''}`}
                        >
                            Forum
                        </Link>
                        <Link
                            to="/store"
                            className={`nav-item ${location.pathname.startsWith('/store') ? 'nav-item-active' : ''}`}
                        >
                            Shop
                        </Link>
                        <div ref={communityRef} className="relative">
                            <button
                                type="button"
                                className={`nav-item flex items-center gap-2 ${communityOpen || location.pathname.startsWith('/community/') ? 'nav-item-active' : ''}`}
                                onClick={() => setCommunityOpen((current) => !current)}
                                aria-expanded={communityOpen}
                            >
                                Community{' '}
                                <FaChevronDown
                                    className={`text-[10px] transition ${communityOpen ? 'rotate-180' : ''}`}
                                />
                            </button>
                            {communityOpen && (
                                <div className="liquid-menu absolute left-1/2 top-full mt-3 w-[570px] -translate-x-1/2 rounded-2xl p-3">
                                    <div className="px-3 pb-3 pt-1">
                                        <b className="block text-sm text-white">Community</b>
                                        <span className="mt-1 block text-[11px] text-zinc-500">
                                            Spieler verbinden & entdecken
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1">
                                        {communityItems.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <Link
                                                    key={item.slug}
                                                    to={item.to || `/community/${item.slug}`}
                                                    className="community-dropdown-item"
                                                >
                                                    <span className="community-nav-icon">
                                                        <Icon />
                                                    </span>
                                                    <span className="min-w-0">
                                                        <b className="block">{item.label}</b>
                                                        <small>{item.description}</small>
                                                    </span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}

                <PlayerSearch
                    ref={searchRef}
                    className="ml-auto hidden min-w-0 flex-1 lg:block lg:max-w-[300px] xl:max-w-[390px]"
                />

                <NavbarNotifications user={user} onUnreadChange={setUnreadForumNotifications} />

                {user ? (
                    <div ref={profileRef} className="relative ml-1 hidden sm:block">
                        <button
                            type="button"
                            onClick={() => setProfileOpen((current) => !current)}
                            className="profile-trigger flex h-12 items-center gap-3 rounded-2xl px-2.5 pr-4"
                            aria-expanded={profileOpen}
                        >
                            <img
                                className="h-8 w-8 rounded-lg bg-zinc-900 object-cover [image-rendering:pixelated]"
                                src={user.avatarUrl}
                                alt=""
                            />
                            <span className="max-w-32 truncate text-sm font-bold text-white">{user.username}</span>
                            <FaChevronDown
                                className={`text-[10px] text-zinc-500 transition ${profileOpen ? 'rotate-180' : ''}`}
                            />
                        </button>
                        {profileOpen && (
                            <div className="liquid-menu absolute right-0 top-full mt-3 w-56 rounded-2xl p-2">
                                <Link
                                    to={`/players/${encodeURIComponent(user.playerId || user.username)}`}
                                    className="profile-menu-item"
                                >
                                    <FaUser /> Mein Profil
                                </Link>
                                <Link to="/forum/account" className="profile-menu-item">
                                    <FaBell />
                                    <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                                        Mein Forum
                                        {unreadForumNotifications > 0 && (
                                            <b className="grid min-w-5 place-items-center rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] text-white">
                                                {unreadForumNotifications > 99 ? '99+' : unreadForumNotifications}
                                            </b>
                                        )}
                                    </span>
                                </Link>
                                <Link to="/store/account" className="profile-menu-item">
                                    <FaBagShopping /> Meine Käufe
                                </Link>
                                <Link to="/friends" className="profile-menu-item">
                                    <FaUsers /> Freunde &amp; Partys
                                </Link>
                                <Link to="/account/security" className="profile-menu-item">
                                    <FaKey /> Sicherheit
                                </Link>
                                {isAdministrator(user) && (
                                    <Link to="/admin" className="profile-menu-item">
                                        <FaShieldHalved /> Administration
                                    </Link>
                                )}
                                <button
                                    type="button"
                                    onClick={signOut}
                                    disabled={logoutPending}
                                    className="profile-menu-item w-full text-red-300 hover:text-red-200"
                                >
                                    <FaArrowRightFromBracket /> {logoutPending ? 'Wird abgemeldet …' : 'Abmelden'}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => beginLogin(location.pathname)}
                        className="login-button ml-1 hidden h-12 items-center gap-2 rounded-2xl px-5 text-sm font-extrabold sm:flex"
                    >
                        <FaRightToBracket className="text-base" /> Login
                    </button>
                )}

                <button
                    type="button"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[.05] text-lg text-white lg:hidden"
                    onClick={() => setMobileOpen((current) => !current)}
                    aria-expanded={mobileOpen}
                    aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
                >
                    {mobileOpen ? <FaXmark /> : <FaBars />}
                </button>
            </nav>

            {logoutNotice && (
                <div
                    className="pointer-events-auto fixed left-1/2 top-28 -translate-x-1/2 rounded-2xl border border-emerald-400/20 bg-[#101713]/95 px-5 py-3 text-sm font-bold text-emerald-200 shadow-2xl backdrop-blur-xl"
                    role="status"
                    aria-live="polite"
                >
                    {logoutNotice}
                </div>
            )}

            {profileContext?.visible && (
                <div className="profile-context-bar pointer-events-auto mx-auto max-w-[1500px]">
                    <div className="flex min-w-0 items-center gap-3">
                        <img
                            className="h-9 w-9 rounded-lg bg-black/30 [image-rendering:pixelated]"
                            src={profileContext.avatarUrl}
                            alt=""
                        />
                        <b className="truncate font-display text-base text-white">{profileContext.username}</b>
                        <button
                            type="button"
                            className="profile-context-uuid hidden sm:inline-flex"
                            onClick={() => navigator.clipboard.writeText(profileContext.playerId)}
                            title="UUID kopieren"
                        >
                            <span>{profileContext.playerId}</span>
                            <FaCopy />
                        </button>
                    </div>
                    <span className="profile-context-rank">{profileContext.rank}</span>
                </div>
            )}

            <div
                className={`pointer-events-auto fixed inset-0 z-[-1] overflow-y-auto bg-[#06070a]/75 px-3 pb-6 pt-[98px] backdrop-blur-xl transition duration-300 lg:hidden ${mobileOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}
                onClick={() => setMobileOpen(false)}
            >
                <div
                    className={`liquid-menu mx-auto max-w-lg rounded-[26px] p-3 transition duration-300 ${mobileOpen ? 'translate-y-0 scale-100' : '-translate-y-3 scale-95'}`}
                    onClick={(event) => event.stopPropagation()}
                >
                    <PlayerSearch mobile className="mb-3" />
                    <div className="grid gap-1">
                        {showAdminNavigation ? (
                            <>
                                <p className="px-4 pb-2 pt-1 text-[10px] font-extrabold uppercase tracking-[.2em] text-orange-400">
                                    Administration
                                </p>
                                {visibleAdminNavigationGroups.map((group) => {
                                    const GroupIcon = group.icon;
                                    const expanded = mobileAdminGroup === group.id;
                                    const active = adminGroupIsActive(location.pathname, group);
                                    return (
                                        <section
                                            className="border-t border-white/[.055] py-1 first:border-t-0"
                                            key={group.id}
                                        >
                                            <button
                                                className={`mobile-nav-item flex w-full items-center gap-3 text-left ${active ? 'text-orange-200' : ''}`}
                                                type="button"
                                                aria-expanded={expanded}
                                                onClick={() =>
                                                    setMobileAdminGroup((current) =>
                                                        current === group.id ? null : group.id
                                                    )
                                                }
                                            >
                                                <GroupIcon className="w-4 text-xs" />
                                                <b className="flex-1 text-sm">{group.label}</b>
                                                <FaChevronDown
                                                    className={`text-[9px] transition ${expanded ? 'rotate-180' : ''}`}
                                                />
                                            </button>
                                            {expanded && (
                                                <div className="pb-2 pl-7">
                                                    {group.items.map((item) => {
                                                        const ItemIcon = item.icon;
                                                        const itemActive = adminItemIsActive(location.pathname, item);
                                                        return (
                                                            <Link
                                                                className={`mobile-nav-item flex items-center gap-3 border-l-2 py-2.5 ${
                                                                    itemActive
                                                                        ? 'border-orange-400 text-orange-100'
                                                                        : 'border-transparent'
                                                                }`}
                                                                key={item.to}
                                                                to={item.to}
                                                            >
                                                                <ItemIcon className="w-4 text-xs text-zinc-600" />
                                                                {item.label}
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </section>
                                    );
                                })}
                            </>
                        ) : !isAdminArea ? (
                            <>
                                <Link className="mobile-nav-item" to="/">
                                    SeriuxMod
                                </Link>
                                <Link className="mobile-nav-item" to="/forum">
                                    Forum
                                </Link>
                                <Link className="mobile-nav-item" to="/store">
                                    Shop
                                </Link>
                                <p className="px-4 pb-1 pt-4 text-[10px] font-extrabold uppercase tracking-[.2em] text-orange-400">
                                    Community
                                </p>
                                {communityItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            className="mobile-nav-item flex items-center gap-3"
                                            to={item.to || `/community/${item.slug}`}
                                            key={item.slug}
                                        >
                                            <span className="community-nav-icon">
                                                <Icon />
                                            </span>
                                            <span>
                                                <b className="block text-sm">{item.label}</b>
                                                <small className="block text-[10px] font-normal text-zinc-600">
                                                    {item.description}
                                                </small>
                                            </span>
                                        </Link>
                                    );
                                })}
                            </>
                        ) : null}
                    </div>
                    {user ? (
                        <div className="mt-3 border-t border-white/[.07] pt-3">
                            <div className="mb-2 flex items-center gap-3 px-3 py-2">
                                <img
                                    className="h-9 w-9 rounded-lg [image-rendering:pixelated]"
                                    src={user.avatarUrl}
                                    alt=""
                                />
                                <b>{user.username}</b>
                            </div>
                            <Link
                                className="mobile-nav-item"
                                to={`/players/${encodeURIComponent(user.playerId || user.username)}`}
                            >
                                Mein Profil
                            </Link>
                            <Link className="mobile-nav-item flex items-center justify-between" to="/forum/account">
                                Mein Forum
                                {unreadForumNotifications > 0 && (
                                    <b className="rounded-full bg-orange-500 px-2 py-0.5 text-xs text-white">
                                        {unreadForumNotifications}
                                    </b>
                                )}
                            </Link>
                            <Link className="mobile-nav-item" to="/store/account">
                                Meine Käufe
                            </Link>
                            <Link className="mobile-nav-item" to="/friends">
                                Freunde &amp; Partys
                            </Link>
                            <Link className="mobile-nav-item" to="/account/security">
                                Sicherheit
                            </Link>
                            {isAdministrator(user) && (
                                <Link className="mobile-nav-item" to="/admin">
                                    Administration
                                </Link>
                            )}
                            <button
                                type="button"
                                onClick={signOut}
                                disabled={logoutPending}
                                className="mobile-nav-item w-full text-left text-red-300"
                            >
                                {logoutPending ? 'Wird abgemeldet …' : 'Abmelden'}
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => beginLogin(location.pathname)}
                            className="login-button mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-extrabold"
                        >
                            <FaRightToBracket /> Login
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}

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
    FaXmark
} from 'react-icons/fa6';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    beginLogin,
    fetchAuthenticatedUser,
    getAuthenticatedUser,
    isForumAdministrator,
    isStoreAdministrator,
    logout
} from '../lib/auth';
import { forumApi } from '../lib/forumApi';
import { communityItems } from '../config/community';
import PlayerSearch from './PlayerSearch';

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [communityOpen, setCommunityOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [user, setUser] = useState(() => getAuthenticatedUser());
    const [unreadForumNotifications, setUnreadForumNotifications] = useState(0);
    const [profileContext, setProfileContext] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const searchRef = useRef(null);
    const communityRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        let active = true;
        setMobileOpen(false);
        setCommunityOpen(false);
        setProfileOpen(false);
        const tokenUser = getAuthenticatedUser();
        setUser(tokenUser);
        fetchAuthenticatedUser().then((profile) => {
            if (active) setUser(profile);
        });
        return () => {
            active = false;
        };
    }, [location.pathname]);

    useEffect(() => {
        setProfileContext(null);
        const updateProfileContext = (event) => setProfileContext(event.detail);
        window.addEventListener('seriux-profile-context', updateProfileContext);
        return () => window.removeEventListener('seriux-profile-context', updateProfileContext);
    }, [location.pathname]);

    useEffect(() => {
        let active = true;
        if (!user) {
            setUnreadForumNotifications(0);
            return undefined;
        }
        forumApi
            .unreadCount()
            .then((result) => active && setUnreadForumNotifications(result.unread ?? 0))
            .catch(() => active && setUnreadForumNotifications(0));
        return () => {
            active = false;
        };
    }, [location.pathname, user?.playerId]);

    useEffect(() => {
        const onPointerDown = (event) => {
            if (!communityRef.current?.contains(event.target)) setCommunityOpen(false);
            if (!profileRef.current?.contains(event.target)) setProfileOpen(false);
        };
        const onKeyDown = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                searchRef.current?.focus();
            }
            if (event.key === 'Escape') {
                setCommunityOpen(false);
                setProfileOpen(false);
                setMobileOpen(false);
            }
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileOpen]);

    const signOut = () => {
        logout();
        setUser(null);
        setProfileOpen(false);
        navigate('/');
    };

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
                            <FaChevronDown className={`text-[10px] transition ${communityOpen ? 'rotate-180' : ''}`} />
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
                                                to={`/community/${item.slug}`}
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

                <PlayerSearch
                    ref={searchRef}
                    className="ml-auto hidden min-w-0 flex-1 lg:block lg:max-w-[300px] xl:max-w-[390px]"
                />

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
                                <Link to={`/@${encodeURIComponent(user.username)}`} className="profile-menu-item">
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
                                <Link to="/account/security" className="profile-menu-item">
                                    <FaKey /> Sicherheit
                                </Link>
                                {(isForumAdministrator(user) || isStoreAdministrator(user)) && (
                                    <Link to="/admin" className="profile-menu-item">
                                        <FaShieldHalved /> Administration
                                    </Link>
                                )}
                                <button
                                    type="button"
                                    onClick={signOut}
                                    className="profile-menu-item w-full text-red-300 hover:text-red-200"
                                >
                                    <FaArrowRightFromBracket /> Abmelden
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
                                    to={`/community/${item.slug}`}
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
                            <Link className="mobile-nav-item" to={`/@${encodeURIComponent(user.username)}`}>
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
                            <Link className="mobile-nav-item" to="/account/security">
                                Sicherheit
                            </Link>
                            {(isForumAdministrator(user) || isStoreAdministrator(user)) && (
                                <Link className="mobile-nav-item" to="/admin">
                                    Administration
                                </Link>
                            )}
                            <button
                                type="button"
                                onClick={signOut}
                                className="mobile-nav-item w-full text-left text-red-300"
                            >
                                Abmelden
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

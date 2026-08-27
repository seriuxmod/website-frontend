import { useEffect, useRef, useState } from 'react';
import {
    FaArrowRightFromBracket,
    FaBars,
    FaChevronDown,
    FaMagnifyingGlass,
    FaRightToBracket,
    FaShieldHalved,
    FaUser,
    FaXmark
} from 'react-icons/fa6';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { beginLogin, fetchAuthenticatedUser, getAuthenticatedUser, isForumAdministrator, logout } from '../lib/auth';

const communityItems = [
    { label: 'Clans', description: 'Finde und verwalte deine Community', to: '/clans' },
    {
        label: 'Serverstatus',
        description: 'Live-Status aller SeriuxMod-Dienste',
        to: 'https://api.seriuxmod.net/api/v1/status/summary',
        external: true
    }
];

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [communityOpen, setCommunityOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [user, setUser] = useState(() => getAuthenticatedUser());
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

    const submitSearch = (event) => {
        event.preventDefault();
        const query = search.trim();
        if (query) navigate(`/forum?search=${encodeURIComponent(query)}`);
    };

    const signOut = () => {
        logout();
        setUser(null);
        setProfileOpen(false);
        navigate('/');
    };

    return (
        <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
            <nav
                className="liquid-nav pointer-events-auto mx-auto flex h-[74px] max-w-[1500px] items-center gap-3 px-4 sm:px-5"
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
                    <Link to="/store" className={`nav-item ${location.pathname === '/store' ? 'nav-item-active' : ''}`}>
                        Shop
                    </Link>
                    <div ref={communityRef} className="relative">
                        <button
                            type="button"
                            className={`nav-item flex items-center gap-2 ${communityOpen || location.pathname === '/clans' ? 'nav-item-active' : ''}`}
                            onClick={() => setCommunityOpen((current) => !current)}
                            aria-expanded={communityOpen}
                        >
                            Community{' '}
                            <FaChevronDown className={`text-[10px] transition ${communityOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {communityOpen && (
                            <div className="liquid-menu absolute left-1/2 top-full mt-3 w-72 -translate-x-1/2 rounded-2xl p-2">
                                {communityItems.map((item) =>
                                    item.external ? (
                                        <a
                                            key={item.label}
                                            href={item.to}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="nav-dropdown-item"
                                        >
                                            <b>{item.label}</b>
                                            <span>{item.description}</span>
                                        </a>
                                    ) : (
                                        <Link key={item.label} to={item.to} className="nav-dropdown-item">
                                            <b>{item.label}</b>
                                            <span>{item.description}</span>
                                        </Link>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <form
                    onSubmit={submitSearch}
                    className="ml-auto hidden h-12 min-w-0 flex-1 items-center rounded-2xl border border-white/[.09] bg-[#090b11]/90 px-4 xl:flex xl:max-w-[390px]"
                >
                    <FaMagnifyingGlass className="shrink-0 text-base text-zinc-500" />
                    <input
                        ref={searchRef}
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="min-w-0 flex-1 bg-transparent px-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                        placeholder="Spieler, Clans oder Beiträge suchen..."
                        aria-label="SeriuxMod durchsuchen"
                    />
                    <kbd className="rounded-lg border border-white/10 bg-white/[.04] px-2 py-1 font-sans text-[10px] text-zinc-500">
                        Ctrl K
                    </kbd>
                </form>

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
                                <Link to="/profile" className="profile-menu-item">
                                    <FaUser /> Mein Profil
                                </Link>
                                {isForumAdministrator(user) && (
                                    <Link to="/admin/forum" className="profile-menu-item">
                                        <FaShieldHalved /> Forum verwalten
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

            <div
                className={`pointer-events-auto fixed inset-0 z-[-1] bg-[#06070a]/75 px-3 pt-[98px] backdrop-blur-xl transition duration-300 lg:hidden ${mobileOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}
                onClick={() => setMobileOpen(false)}
            >
                <div
                    className={`liquid-menu mx-auto max-w-lg rounded-[26px] p-3 transition duration-300 ${mobileOpen ? 'translate-y-0 scale-100' : '-translate-y-3 scale-95'}`}
                    onClick={(event) => event.stopPropagation()}
                >
                    <form
                        onSubmit={submitSearch}
                        className="mb-3 flex h-12 items-center rounded-2xl border border-white/[.09] bg-black/30 px-4"
                    >
                        <FaMagnifyingGlass className="text-zinc-500" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-600"
                            placeholder="SeriuxMod durchsuchen..."
                        />
                    </form>
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
                        <Link className="mobile-nav-item" to="/clans">
                            Clans
                        </Link>
                        <a
                            className="mobile-nav-item"
                            href="https://api.seriuxmod.net/api/v1/status/summary"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Serverstatus
                        </a>
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
                            <Link className="mobile-nav-item" to="/profile">
                                Mein Profil
                            </Link>
                            {isForumAdministrator(user) && (
                                <Link className="mobile-nav-item" to="/admin/forum">
                                    Forum verwalten
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

import { forwardRef, useEffect, useRef, useState } from 'react';
import { FaMagnifyingGlass, FaSpinner, FaUser } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import { playerDirectoryApi } from '../lib/playerDirectoryApi';
import { playerAvatar } from '../lib/userApi';

const PlayerSearch = forwardRef(function PlayerSearch({ className = '', mobile = false }, forwardedRef) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef(null);
    const localInputRef = useRef(null);
    const navigate = useNavigate();

    const setInputRef = (node) => {
        localInputRef.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
    };

    useEffect(() => {
        const normalized = query.trim();
        if (normalized.length < 2) {
            setResults([]);
            setLoading(false);
            return undefined;
        }

        const controller = new AbortController();
        const timeout = window.setTimeout(() => {
            setLoading(true);
            playerDirectoryApi
                .search(normalized, controller.signal)
                .then((profiles) => {
                    setResults(profiles);
                    setActiveIndex(0);
                    setOpen(true);
                })
                .catch((error) => {
                    if (error.name !== 'AbortError') setResults([]);
                })
                .finally(() => {
                    if (!controller.signal.aborted) setLoading(false);
                });
        }, 220);

        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [query]);

    useEffect(() => {
        const close = (event) => {
            if (!containerRef.current?.contains(event.target)) setOpen(false);
        };
        document.addEventListener('pointerdown', close);
        return () => document.removeEventListener('pointerdown', close);
    }, []);

    const openProfile = (profile) => {
        if (!profile?.username) return;
        setOpen(false);
        setQuery('');
        navigate(`/@${encodeURIComponent(profile.username)}`);
    };

    const submit = (event) => {
        event.preventDefault();
        openProfile(results[activeIndex] || results[0]);
    };

    const onKeyDown = (event) => {
        if (!open || results.length === 0) return;
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((current) => (current + 1) % results.length);
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((current) => (current - 1 + results.length) % results.length);
        }
        if (event.key === 'Escape') setOpen(false);
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <form
                onSubmit={submit}
                className={`flex h-12 items-center rounded-2xl border border-white/[.09] bg-[#090b11]/90 ${mobile ? 'px-4' : 'px-4'}`}
            >
                {loading ? (
                    <FaSpinner className="shrink-0 animate-spin text-sm text-orange-400" />
                ) : (
                    <FaMagnifyingGlass className="shrink-0 text-base text-zinc-500" />
                )}
                <input
                    ref={setInputRef}
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => query.trim().length >= 2 && setOpen(true)}
                    onKeyDown={onKeyDown}
                    className="min-w-0 flex-1 bg-transparent px-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                    placeholder="Spieler suchen..."
                    aria-label="Spieler suchen"
                    autoComplete="off"
                />
                {!mobile && (
                    <kbd className="rounded-lg border border-white/10 bg-white/[.04] px-2 py-1 font-sans text-[10px] text-zinc-500">
                        Ctrl K
                    </kbd>
                )}
            </form>

            {open && query.trim().length >= 2 && (
                <div className="liquid-menu absolute inset-x-0 top-full z-50 mt-3 overflow-hidden rounded-2xl p-2">
                    <p className="px-3 pb-2 pt-1 text-[10px] font-extrabold uppercase tracking-[.18em] text-zinc-600">
                        Minecraft-Spieler
                    </p>
                    {!loading && results.length === 0 ? (
                        <div className="flex items-center gap-3 rounded-xl px-3 py-4 text-sm text-zinc-500">
                            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[.04]">
                                <FaUser />
                            </span>
                            Kein Minecraft-Spieler gefunden
                        </div>
                    ) : (
                        results.map((profile, index) => (
                            <button
                                key={profile.uuid}
                                type="button"
                                onPointerMove={() => setActiveIndex(index)}
                                onClick={() => openProfile(profile)}
                                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${activeIndex === index ? 'bg-white/[.07]' : 'hover:bg-white/[.05]'}`}
                            >
                                <img
                                    className="h-10 w-10 rounded-xl bg-black/30 [image-rendering:pixelated]"
                                    src={playerAvatar(profile.uuid, 64)}
                                    alt=""
                                />
                                <span className="min-w-0 flex-1">
                                    <b className="block truncate text-sm text-white">{profile.username}</b>
                                    <small className="mt-0.5 block truncate text-[10px] text-zinc-600">
                                        Minecraft-Profil · {profile.rendering?.model === 'slim' ? 'Slim' : 'Wide'}
                                    </small>
                                </span>
                                <FaUser className="text-xs text-zinc-600" />
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
});

export default PlayerSearch;

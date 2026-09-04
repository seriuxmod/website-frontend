import { forwardRef, useEffect, useRef, useState } from 'react';
import { FaClockRotateLeft, FaMagnifyingGlass, FaSpinner, FaUser } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import { playerDirectoryApi } from '../lib/playerDirectoryApi';
import { playerAvatar } from '../lib/userApi';

const USERNAME_PATTERN = /^[A-Za-z0-9_]{1,16}$/;

const PlayerSearch = forwardRef(function PlayerSearch({ className = '', mobile = false }, forwardedRef) {
    const [query, setQuery] = useState('');
    const [searchedQuery, setSearchedQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef(null);
    const localInputRef = useRef(null);
    const requestRef = useRef(null);
    const navigate = useNavigate();

    const setInputRef = (node) => {
        localInputRef.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
    };

    useEffect(
        () => () => {
            requestRef.current?.abort();
        },
        []
    );

    useEffect(() => {
        const close = (event) => {
            if (!containerRef.current?.contains(event.target)) setOpen(false);
        };
        document.addEventListener('pointerdown', close);
        return () => document.removeEventListener('pointerdown', close);
    }, []);

    const openProfile = (profile) => {
        if (!profile?.uuid) return;
        requestRef.current?.abort();
        setLoading(false);
        setOpen(false);
        setQuery('');
        setResults([]);
        navigate(`/players/${encodeURIComponent(profile.uuid)}`);
    };

    const runSearch = async (normalized) => {
        requestRef.current?.abort();
        const controller = new AbortController();
        requestRef.current = controller;
        setLoading(true);
        setMessage('');
        setResults([]);
        setSearchedQuery(normalized);
        setOpen(true);

        try {
            const result = await playerDirectoryApi.searchByName(normalized, controller.signal);
            if (controller.signal.aborted) return;
            const seen = new Set();
            const profiles = [result.currentOwner, ...result.previousOwners].filter((profile) => {
                if (!profile || seen.has(profile.uuid)) return false;
                seen.add(profile.uuid);
                return true;
            });
            setResults(profiles);
            setActiveIndex(0);
            if (profiles.length === 0) setMessage('Kein aktueller oder früherer Besitzer dieses Namens gefunden.');
            if (profiles.length === 1) openProfile(profiles[0]);
        } catch (error) {
            if (error.name !== 'AbortError') {
                const retryHint = error.retryAfter ? ` Erneut möglich in etwa ${error.retryAfter} Sekunden.` : '';
                setMessage(`${error.message}${retryHint}`);
            }
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    };

    const submit = (event) => {
        event.preventDefault();
        const normalized = query.trim();
        if (loading || !normalized) return;
        if (!USERNAME_PATTERN.test(normalized)) {
            setSearchedQuery(normalized);
            setResults([]);
            setMessage('Minecraft-Namen bestehen aus 1 bis 16 Buchstaben, Zahlen oder Unterstrichen.');
            setOpen(true);
            return;
        }
        if (searchedQuery.toLowerCase() === normalized.toLowerCase() && results.length > 0) {
            openProfile(results[activeIndex] || results[0]);
            return;
        }
        runSearch(normalized);
    };

    const onKeyDown = (event) => {
        if (event.key === 'Escape') {
            setOpen(false);
            return;
        }
        if (!open || results.length === 0) return;
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((current) => (current + 1) % results.length);
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((current) => (current - 1 + results.length) % results.length);
        }
    };

    const changeQuery = (event) => {
        requestRef.current?.abort();
        const value = event.target.value;
        setQuery(value);
        setResults([]);
        setSearchedQuery('');
        setMessage('');
        setLoading(false);
        setOpen(Boolean(value.trim()));
    };

    const hasSubmittedCurrentQuery = searchedQuery && searchedQuery.toLowerCase() === query.trim().toLowerCase();

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <form
                onSubmit={submit}
                className={`flex h-12 items-center rounded-2xl border border-white/[.09] bg-[#090b11]/90 ${mobile ? 'px-3' : 'px-3'}`}
            >
                <button
                    type="submit"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-500 transition hover:bg-white/[.05] hover:text-orange-400"
                    aria-label="Spieler suchen"
                >
                    {loading ? <FaSpinner className="animate-spin text-sm text-orange-400" /> : <FaMagnifyingGlass />}
                </button>
                <input
                    ref={setInputRef}
                    value={query}
                    onChange={changeQuery}
                    onFocus={() => query.trim() && setOpen(true)}
                    onKeyDown={onKeyDown}
                    className="min-w-0 flex-1 bg-transparent px-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                    placeholder="Minecraft-Spieler suchen..."
                    aria-label="Minecraft-Spieler suchen"
                    autoComplete="off"
                    maxLength={16}
                />
                {!mobile && (
                    <kbd className="rounded-lg border border-white/10 bg-white/[.04] px-2 py-1 font-sans text-[10px] text-zinc-500">
                        Ctrl K
                    </kbd>
                )}
            </form>

            {open && query.trim() && (
                <div className="liquid-menu absolute inset-x-0 top-full z-50 mt-3 overflow-hidden rounded-2xl p-2">
                    <p className="px-3 pb-2 pt-1 text-[10px] font-extrabold uppercase tracking-[.18em] text-zinc-600">
                        Minecraft-Spieler
                    </p>
                    {!hasSubmittedCurrentQuery && !loading && (
                        <div className="flex items-center gap-3 rounded-xl px-3 py-4 text-sm leading-5 text-zinc-500">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[.04]">
                                <FaMagnifyingGlass />
                            </span>
                            Vollständigen Minecraft-Namen eingeben und mit Enter suchen.
                        </div>
                    )}
                    {loading && (
                        <div className="flex items-center gap-3 rounded-xl px-3 py-4 text-sm text-zinc-500">
                            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[.04]">
                                <FaSpinner className="animate-spin text-orange-400" />
                            </span>
                            Aktuelle und frühere Besitzer werden gesucht …
                        </div>
                    )}
                    {!loading && hasSubmittedCurrentQuery && message && results.length === 0 && (
                        <div className="flex items-center gap-3 rounded-xl px-3 py-4 text-sm leading-5 text-zinc-500">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[.04]">
                                <FaUser />
                            </span>
                            {message}
                        </div>
                    )}
                    {!loading &&
                        hasSubmittedCurrentQuery &&
                        results.map((profile, index) => {
                            const historical = profile.matchType === 'historical';
                            return (
                                <button
                                    key={`${profile.uuid}-${profile.matchType}`}
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
                                        <b className="block truncate text-sm text-white">
                                            {profile.username || searchedQuery}
                                        </b>
                                        <small
                                            className={`mt-0.5 flex items-center gap-1.5 truncate text-[10px] ${historical ? 'text-amber-400/75' : 'text-zinc-600'}`}
                                        >
                                            {historical && <FaClockRotateLeft />}
                                            {historical
                                                ? `Früherer Besitzer von „${searchedQuery}“`
                                                : 'Aktueller Besitzer'}
                                        </small>
                                    </span>
                                    {historical ? (
                                        <FaClockRotateLeft className="text-xs text-amber-500/60" />
                                    ) : (
                                        <FaUser className="text-xs text-zinc-600" />
                                    )}
                                </button>
                            );
                        })}
                </div>
            )}
        </div>
    );
});

export default PlayerSearch;

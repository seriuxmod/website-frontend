import { useCallback, useEffect, useRef, useState } from 'react';
import { FaArrowRotateRight, FaCircleExclamation } from 'react-icons/fa6';
import { AdminPendingState } from '../AdminUi';
export {
    columnHelper,
    LiveDataTable,
    ForumPanel as CommercePanel,
    StatusPill,
    formatDate,
    formatNumber,
    shortId
} from '../forum/AdminForumShared';

export function useCommerceResource(loader, dependencies = []) {
    const [state, setState] = useState({ data: null, loading: true, error: '' });
    const requestId = useRef(0);

    const load = useCallback(async () => {
        const currentRequest = ++requestId.current;
        setState((current) => ({ ...current, loading: true, error: '' }));
        try {
            const data = await loader();
            if (currentRequest !== requestId.current) return null;
            setState({ data, loading: false, error: '' });
            return data;
        } catch (error) {
            if (currentRequest !== requestId.current) return null;
            setState({ data: null, loading: false, error: error?.message || 'Die Store-Daten sind nicht erreichbar.' });
            return null;
        }
        // The caller owns loader identity and the explicit dependency list.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);

    useEffect(() => {
        load();
        return () => {
            requestId.current += 1;
        };
    }, [load]);

    return {
        ...state,
        reload: load,
        setData: (data) => setState({ data, loading: false, error: '' })
    };
}

export function CommerceAdminPage({ eyebrow, title, description, icon: Icon, loading, error, onRetry, actions, children }) {
    const backendState = error
        ? { label: 'Store-Backend nicht erreichbar', style: 'border-red-400/20 bg-red-400/[.07] text-red-300' }
        : loading
          ? { label: 'Store-Backend wird abgefragt', style: 'border-amber-400/20 bg-amber-400/[.07] text-amber-200' }
          : { label: 'Store-Backend verbunden', style: 'border-emerald-400/20 bg-emerald-400/[.07] text-emerald-300' };

    return (
        <div>
            <header className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <p className="eyebrow">E-COMMERCE · {eyebrow}</p>
                        <span className={'rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.14em] ' + backendState.style}>
                            {backendState.label}
                        </span>
                    </div>
                    <h2 className="mt-3 flex items-center gap-4 font-display text-3xl font-bold tracking-[-.04em] sm:text-4xl">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-400/[.09] text-lg text-orange-300">
                            <Icon />
                        </span>
                        {title}
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500">{description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {actions}
                    {onRetry && (
                        <button className="admin-forum-secondary" disabled={loading} onClick={onRetry} type="button">
                            <FaArrowRotateRight className={loading ? 'animate-spin' : ''} /> Aktualisieren
                        </button>
                    )}
                </div>
            </header>
            {error ? <CommerceError message={error} retry={onRetry} /> : children}
        </div>
    );
}

export function CommerceError({ message, retry }) {
    const denied = /berechtigung|zugriff|forbidden|unauthorized/i.test(message);
    return (
        <div className="flex min-h-56 items-center justify-center rounded-[26px] border border-red-400/15 bg-red-400/[.035] px-6 py-10 text-center">
            <div>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-400/10 text-red-300">
                    <FaCircleExclamation />
                </span>
                <b className="mt-4 block text-base text-zinc-100">
                    {denied ? 'Zugriff nicht freigegeben' : 'Store-Daten nicht verfügbar'}
                </b>
                <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-zinc-500">{message}</p>
                {retry && (
                    <button className="admin-forum-secondary mt-5" onClick={retry} type="button">
                        <FaArrowRotateRight /> Erneut versuchen
                    </button>
                )}
            </div>
        </div>
    );
}

export function CommerceLoading({ title = 'Store-Daten werden geladen', text }) {
    return <AdminPendingState title={title} text={text || 'Das Store-Backend stellt die aktuelle Ansicht zusammen.'} />;
}

export function CommerceEmpty({ title, text }) {
    return (
        <div className="px-5 py-6 sm:px-6">
            <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-white/[.07] bg-black/10 px-5 py-8 text-center">
                <div>
                    <FaCircleExclamation className="mx-auto text-zinc-700" />
                    <b className="mt-3 block text-sm text-zinc-300">{title}</b>
                    {text && <p className="mt-1 text-xs leading-5 text-zinc-600">{text}</p>}
                </div>
            </div>
        </div>
    );
}

export function CommercePagination({ page = 0, size = 25, total = 0, onPage }) {
    const pages = Math.max(1, Math.ceil(Number(total || 0) / Number(size || 25)));
    if (pages <= 1) return null;
    return (
        <div className="flex items-center justify-between gap-4 border-t border-white/[.055] px-5 py-4 text-xs sm:px-6">
            <button
                className="admin-forum-secondary"
                disabled={page <= 0}
                onClick={() => onPage(page - 1)}
                type="button"
            >
                Zurück
            </button>
            <span className="font-bold text-zinc-500">
                Seite {page + 1} von {pages}
            </span>
            <button
                className="admin-forum-secondary"
                disabled={page + 1 >= pages}
                onClick={() => onPage(page + 1)}
                type="button"
            >
                Weiter
            </button>
        </div>
    );
}

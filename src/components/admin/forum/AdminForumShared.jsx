import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import { useHotkey } from '@tanstack/react-hotkeys';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { FaArrowRotateRight, FaCircleExclamation, FaMagnifyingGlass, FaSpinner } from 'react-icons/fa6';
import { AdminEmptyState, AdminPendingState } from '../AdminUi';

const TABLE_FEATURES = tableFeatures({});
export const columnHelper = createColumnHelper();

export function useForumResource(loader, dependencies = []) {
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
            setState({ data: null, loading: false, error: error?.message || 'Die Forum-Daten sind nicht erreichbar.' });
            return null;
        }
        // The caller controls loader identity and explicit reload dependencies.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);

    useEffect(() => {
        load();
        return () => {
            requestId.current += 1;
        };
    }, [load]);

    return { ...state, reload: load, setData: (data) => setState({ data, loading: false, error: '' }) };
}

export function ForumAdminPage({
    eyebrow,
    title,
    description,
    icon: Icon,
    loading = false,
    error = '',
    onRetry,
    actions,
    children
}) {
    const backendState = error
        ? {
              label: 'Forum-Backend nicht erreichbar',
              style: 'border-red-400/20 bg-red-400/[.07] text-red-300'
          }
        : loading
          ? {
                label: 'Forum-Backend wird abgefragt',
                style: 'border-amber-400/20 bg-amber-400/[.07] text-amber-200'
            }
          : {
                label: 'Forum-Backend verbunden',
                style: 'border-emerald-400/20 bg-emerald-400/[.07] text-emerald-300'
            };

    return (
        <div>
            <header className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <p className="eyebrow">FORUM · {eyebrow}</p>
                        <span
                            className={`rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.14em] ${backendState.style}`}
                        >
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

            {error ? <ForumAdminError message={error} retry={onRetry} /> : children}
        </div>
    );
}

export function ForumAdminError({ message, retry }) {
    const denied = /berechtigung|zugriff|forbidden|unauthorized/i.test(message);
    return (
        <div className="flex min-h-56 items-center justify-center rounded-[26px] border border-red-400/15 bg-red-400/[.035] px-6 py-10 text-center">
            <div>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-400/10 text-red-300">
                    <FaCircleExclamation />
                </span>
                <b className="mt-4 block text-base text-zinc-100">
                    {denied ? 'Zugriff nicht freigegeben' : 'Forum-Daten nicht verfügbar'}
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

export function ForumPanel({ eyebrow, title, description, actions, className = '', children }) {
    return (
        <section className={`overflow-hidden rounded-[26px] border border-white/[.07] bg-[#111218] ${className}`}>
            {(eyebrow || title || actions) && (
                <header className="flex flex-col gap-4 border-b border-white/[.055] p-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
                        {title && <h3 className="mt-2 font-display text-xl font-bold">{title}</h3>}
                        {description && <p className="mt-2 max-w-2xl text-xs leading-5 text-zinc-600">{description}</p>}
                    </div>
                    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
                </header>
            )}
            {children}
        </section>
    );
}

export function ForumLoading({ title = 'Forum-Daten werden geladen', text }) {
    return <AdminPendingState title={title} text={text || 'Das Forum-Backend stellt die aktuelle Ansicht zusammen.'} />;
}

export function LiveDataTable({
    rows,
    columns,
    emptyTitle = 'Keine Einträge vorhanden',
    emptyText,
    searchPlaceholder = 'Datensätze durchsuchen …',
    searchLabel = 'Datensätze durchsuchen',
    getSearchValue = (row) => Object.values(row).join(' '),
    toolbar,
    compact = false
}) {
    const [search, setSearch] = useState('');
    const searchRef = useRef(null);
    const [debouncedSearch, debouncer] = useDebouncedValue(search, { wait: 220 }, (state) => ({
        isPending: state.isPending
    }));

    useHotkey('Mod+Shift+F', () => searchRef.current?.focus(), { preventDefault: true });

    const filteredRows = useMemo(() => {
        const query = debouncedSearch.trim().toLocaleLowerCase('de-DE');
        if (!query) return rows;
        return rows.filter((row) => String(getSearchValue(row)).toLocaleLowerCase('de-DE').includes(query));
    }, [debouncedSearch, getSearchValue, rows]);

    const table = useTable({ features: TABLE_FEATURES, columns, data: filteredRows });

    return (
        <>
            <div className="flex flex-col gap-3 border-b border-white/[.05] px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-[9px] font-extrabold uppercase tracking-[.13em] text-zinc-600">
                    <span>{filteredRows.length} sichtbar</span>
                    {debouncer.state.isPending && (
                        <span className="inline-flex items-center gap-2 text-orange-300">
                            <FaSpinner className="animate-spin" /> Suche läuft
                        </span>
                    )}
                    {toolbar}
                </div>
                <label className="relative block w-full lg:w-[min(360px,36vw)]">
                    <span className="sr-only">{searchLabel}</span>
                    <FaMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-zinc-600" />
                    <input
                        ref={searchRef}
                        className="h-11 w-full rounded-xl border border-white/[.075] bg-[#0b0c10] pl-10 pr-20 text-xs text-zinc-200 outline-none transition placeholder:text-zinc-700 focus:border-orange-400/35"
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={searchPlaceholder}
                        type="search"
                        value={search}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-white/[.06] px-2 py-1 text-[8px] font-bold text-zinc-700">
                        Ctrl ⇧ F
                    </span>
                </label>
            </div>
            {rows.length === 0 ? (
                <div className="p-5 sm:p-6">
                    <AdminEmptyState title={emptyTitle} text={emptyText} />
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table
                        className={`w-full border-collapse text-left ${compact ? 'min-w-[720px]' : 'min-w-[900px]'}`}
                    >
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr className="border-b border-white/[.055]" key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            className="px-5 py-3 text-[9px] font-extrabold uppercase tracking-[.14em] text-zinc-600 first:pl-6"
                                            key={header.id}
                                        >
                                            {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <tr
                                        className="border-b border-white/[.045] transition last:border-b-0 hover:bg-white/[.018]"
                                        key={row.id}
                                    >
                                        {row.getAllCells().map((cell) => (
                                            <td className="px-5 py-4 first:pl-6" key={cell.id}>
                                                <table.FlexRender cell={cell} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        className="px-6 py-16 text-center text-sm text-zinc-600"
                                        colSpan={columns.length}
                                    >
                                        Kein Eintrag entspricht „{debouncedSearch}“.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}

export function StatusPill({ value, tone }) {
    const normalized = String(value || '').toLocaleLowerCase('de-DE');
    const style =
        tone ||
        (/open|offen|pending|neu|review|prüfung|draft|entwurf/.test(normalized)
            ? 'border-amber-400/15 bg-amber-400/[.07] text-amber-200'
            : /resolved|erledigt|published|veröffentlicht|aktiv/.test(normalized)
              ? 'border-emerald-400/15 bg-emerald-400/[.07] text-emerald-300'
              : /reject|abgelehnt|deleted|gelöscht|gesperrt/.test(normalized)
                ? 'border-red-400/15 bg-red-400/[.07] text-red-300'
                : 'border-white/[.08] bg-white/[.03] text-zinc-400');
    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider ${style}`}
        >
            {value || 'Unbekannt'}
        </span>
    );
}

export function formatNumber(value) {
    return Number.isFinite(Number(value)) ? new Intl.NumberFormat('de-DE').format(Number(value)) : '—';
}

export function formatDate(value, withTime = true) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(
        'de-DE',
        withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }
    ).format(date);
}

export function shortId(value) {
    if (!value) return '—';
    return value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value;
}

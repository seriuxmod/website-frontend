import { useCallback, useEffect, useRef, useState } from 'react';
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import { FaArrowRotateRight, FaCircleExclamation } from 'react-icons/fa6';
import { AdminPendingState } from '../AdminUi';

export const teamColumnHelper = createColumnHelper();
const TEAM_TABLE_FEATURES = tableFeatures({});

export function useTeamResource(loader, dependencies = []) {
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
            setState({ data: null, loading: false, error: error?.message || 'Die Team-Daten sind nicht erreichbar.' });
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

export function TeamAdminPage({
    eyebrow,
    title,
    description,
    icon: Icon,
    loading,
    error,
    onRetry,
    actions,
    preserveChildrenOnError = false,
    children
}) {
    const backendState = error
        ? { label: 'Team-Backend nicht erreichbar', style: 'border-red-400/20 bg-red-400/[.07] text-red-300' }
        : loading
          ? { label: 'Team-Backend wird abgefragt', style: 'border-amber-400/20 bg-amber-400/[.07] text-amber-200' }
          : { label: 'Team-Backend verbunden', style: 'border-emerald-400/20 bg-emerald-400/[.07] text-emerald-300' };
    return (
        <div>
            <header className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <p className="eyebrow">TEAM · {eyebrow}</p>
                        <span
                            className={
                                'rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.14em] ' +
                                backendState.style
                            }
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
            {error && (
                <div className={preserveChildrenOnError ? 'mb-6' : ''}>
                    <TeamError message={error} retry={onRetry} />
                </div>
            )}
            {(!error || preserveChildrenOnError) && children}
        </div>
    );
}

export function TeamPanel({ eyebrow, title, description, actions, className = '', children }) {
    return (
        <section
            className={
                'overflow-hidden rounded-[26px] border border-white/[.065] bg-[#111218] shadow-[0_24px_80px_rgba(0,0,0,.16)] ' +
                className
            }
        >
            {(eyebrow || title || description || actions) && (
                <header className="flex flex-col gap-4 border-b border-white/[.055] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="min-w-0">
                        {eyebrow && (
                            <p className="text-[8px] font-extrabold uppercase tracking-[.2em] text-orange-300/70">
                                {eyebrow}
                            </p>
                        )}
                        {title && (
                            <h3 className="mt-1 font-display text-lg font-bold tracking-[-.02em] text-zinc-100">
                                {title}
                            </h3>
                        )}
                        {description && <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-600">{description}</p>}
                    </div>
                    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
                </header>
            )}
            {children}
        </section>
    );
}

export function TeamError({ message, retry }) {
    const denied = /berechtigung|zugriff|access denied|forbidden|unauthorized/i.test(message);
    return (
        <div
            className="flex min-h-56 items-center justify-center rounded-[26px] border border-red-400/15 bg-red-400/[.035] px-6 py-10 text-center"
            role="alert"
        >
            <div>
                <FaCircleExclamation className="mx-auto text-2xl text-red-300" />
                <b className="mt-4 block text-base text-zinc-100">
                    {denied ? 'Zugriff nicht freigegeben' : 'Team-Daten nicht verfügbar'}
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

export function TeamLoading({ title = 'Team-Daten werden geladen', text }) {
    return (
        <AdminPendingState title={title} text={text || 'Der User-Service stellt die aktuelle Teamansicht zusammen.'} />
    );
}

export function TeamEmpty({ title, text }) {
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

export function TeamTable({ columns, rows, emptyTitle, emptyText, caption }) {
    const table = useTable({ data: rows, columns, features: TEAM_TABLE_FEATURES });
    if (!rows.length) return <TeamEmpty title={emptyTitle} text={emptyText} />;
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
                {caption && <caption className="sr-only">{caption}</caption>}
                <thead className="bg-black/15 text-[9px] font-extrabold uppercase tracking-wider text-zinc-600">
                    {table.getHeaderGroups().map((group) => (
                        <tr key={group.id}>
                            {group.headers.map((header) => (
                                <th className="px-5 py-3" key={header.id}>
                                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody className="divide-y divide-white/[.05]">
                    {table.getRowModel().rows.map((row) => (
                        <tr className="transition hover:bg-white/[.018]" key={row.id}>
                            {row.getAllCells().map((cell) => (
                                <td className="px-5 py-4 align-top text-xs text-zinc-400" key={cell.id}>
                                    <table.FlexRender cell={cell} />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function TeamPagination({ page = 0, totalPages = 0, onPage }) {
    if (totalPages <= 1) return null;
    return (
        <nav
            aria-label="Seitennavigation"
            className="flex items-center justify-between gap-4 border-t border-white/[.055] px-5 py-4 text-xs sm:px-6"
        >
            <button
                className="admin-forum-secondary"
                disabled={page <= 0}
                onClick={() => onPage(page - 1)}
                type="button"
            >
                Zurück
            </button>
            <span className="font-bold text-zinc-500">
                Seite {page + 1} von {totalPages}
            </span>
            <button
                className="admin-forum-secondary"
                disabled={page + 1 >= totalPages}
                onClick={() => onPage(page + 1)}
                type="button"
            >
                Weiter
            </button>
        </nav>
    );
}

export function TeamTextField({
    form,
    name,
    label,
    type = 'text',
    required = false,
    min,
    max,
    step,
    placeholder,
    autoComplete
}) {
    const textLike = ['text', 'search', 'email', 'url', 'password'].includes(type);
    return (
        <form.Field name={name}>
            {(field) => (
                <label className="admin-forum-field">
                    <span>{label}</span>
                    <input
                        autoComplete={autoComplete}
                        className="admin-forum-input"
                        max={textLike ? undefined : max}
                        maxLength={textLike ? max : undefined}
                        min={min}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder={placeholder}
                        required={required}
                        step={step}
                        type={type}
                        value={field.state.value ?? ''}
                    />
                </label>
            )}
        </form.Field>
    );
}

export function TeamAreaField({ form, name, label, required = false, rows = 4, maxLength }) {
    return (
        <form.Field name={name}>
            {(field) => (
                <label className="admin-forum-field">
                    <span>{label}</span>
                    <textarea
                        className="admin-forum-input resize-y py-3"
                        maxLength={maxLength}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        required={required}
                        rows={rows}
                        value={field.state.value ?? ''}
                    />
                </label>
            )}
        </form.Field>
    );
}

export function TeamSelectField({ form, name, label, options, placeholder, required = false }) {
    return (
        <form.Field name={name}>
            {(field) => (
                <label className="admin-forum-field">
                    <span>{label}</span>
                    <select
                        className="admin-forum-input"
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        required={required}
                        value={field.state.value ?? ''}
                    >
                        {placeholder !== undefined && <option value="">{placeholder}</option>}
                        {options.map(([value, text]) => (
                            <option key={value} value={value}>
                                {text}
                            </option>
                        ))}
                    </select>
                </label>
            )}
        </form.Field>
    );
}

export function TeamCheckField({ form, name, label }) {
    return (
        <form.Field name={name}>
            {(field) => (
                <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-white/[.06] bg-black/15 px-4 py-3 text-xs font-bold text-zinc-400">
                    <input
                        checked={Boolean(field.state.value)}
                        className="h-4 w-4 accent-orange-500"
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.checked)}
                        type="checkbox"
                    />
                    {label}
                </label>
            )}
        </form.Field>
    );
}

export function TeamFormActions({
    form,
    canWrite = true,
    message,
    submitLabel = 'Speichern',
    onCancel,
    pendingLabel = 'Wird gespeichert …'
}) {
    return (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/[.05] pt-5">
            <span aria-live="polite" className={'text-[10px] ' + (message ? 'text-red-300' : 'text-zinc-600')}>
                {message || (canWrite ? 'Änderungen werden im Team-Verlauf protokolliert.' : 'Nur Leseberechtigung')}
            </span>
            <div className="flex items-center gap-2">
                {onCancel && (
                    <button className="admin-forum-secondary" onClick={onCancel} type="button">
                        Abbrechen
                    </button>
                )}
                {canWrite && (
                    <form.Subscribe
                        selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
                    >
                        {({ canSubmit, isSubmitting }) => (
                            <button className="admin-forum-primary" disabled={!canSubmit || isSubmitting} type="submit">
                                {isSubmitting ? pendingLabel : submitLabel}
                            </button>
                        )}
                    </form.Subscribe>
                )}
            </div>
        </div>
    );
}

export function submitTeamForm(form) {
    return (event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
    };
}

export function formatTeamDate(value, options = {}) {
    if (!value) return 'Nicht verfügbar';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short', ...options }).format(date);
}

export function formatTeamNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? new Intl.NumberFormat('de-DE').format(number) : 'Nicht verfügbar';
}

export function humanizeTeamValue(value) {
    return String(value || 'Nicht verfügbar')
        .toLowerCase()
        .replaceAll('_', ' ')
        .replace(/(^|\s)\p{L}/gu, (letter) => letter.toUpperCase());
}

export function shortTeamId(value) {
    const text = String(value || '');
    return text ? (text.length > 12 ? `${text.slice(0, 8)}…` : text) : 'Nicht verfügbar';
}

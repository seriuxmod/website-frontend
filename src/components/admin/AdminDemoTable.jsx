import { useMemo, useRef, useState } from 'react';
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import { useHotkey } from '@tanstack/react-hotkeys';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { FaArrowRight, FaMagnifyingGlass, FaSpinner } from 'react-icons/fa6';
import { COLUMN_LABELS } from '../../data/adminModuleFixtures';
import { TestBadge } from './AdminDemoChart';

const TABLE_FEATURES = tableFeatures({});
const COLUMN_HELPER = createColumnHelper();

export default function AdminDemoTable({
    rows,
    title,
    description = 'Datensätze durchsuchen und für die spätere Bearbeitung auswählen.'
}) {
    const [search, setSearch] = useState('');
    const searchRef = useRef(null);
    const [debouncedSearch, debouncer] = useDebouncedValue(search, { wait: 240 }, (state) => ({
        isPending: state.isPending
    }));

    useHotkey(
        'Mod+Shift+F',
        () => {
            searchRef.current?.focus();
        },
        { preventDefault: true }
    );

    const filteredRows = useMemo(() => {
        const query = debouncedSearch.trim().toLocaleLowerCase('de-DE');
        if (!query) return rows;
        return rows.filter((row) =>
            Object.values(row).some((value) => String(value).toLocaleLowerCase('de-DE').includes(query))
        );
    }, [debouncedSearch, rows]);

    const columns = useMemo(() => {
        const keys = Object.keys(rows[0] ?? {});
        return COLUMN_HELPER.columns([
            ...keys.map((key) =>
                COLUMN_HELPER.accessor(key, {
                    header: COLUMN_LABELS[key] ?? key,
                    cell: (context) => <CellValue column={key} value={context.getValue()} />
                })
            ),
            COLUMN_HELPER.display({
                id: 'actions',
                header: '',
                cell: () => (
                    <button
                        aria-label="Testdatensatz öffnen"
                        className="grid h-9 w-9 cursor-not-allowed place-items-center rounded-xl border border-white/[.07] text-zinc-700"
                        disabled
                        type="button"
                    >
                        <FaArrowRight />
                    </button>
                )
            })
        ]);
    }, [rows]);

    const table = useTable({ features: TABLE_FEATURES, columns, data: filteredRows });

    return (
        <section className="overflow-hidden rounded-[26px] border border-white/[.07] bg-[#111218]">
            <div className="flex flex-col gap-5 border-b border-white/[.06] p-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <p className="eyebrow">DATENANSICHT</p>
                        <TestBadge />
                    </div>
                    <h3 className="mt-2 font-display text-xl font-bold">{title}</h3>
                    <p className="mt-2 text-xs leading-5 text-zinc-600">{description}</p>
                </div>
                <label className="relative block w-full lg:w-[min(360px,34vw)]">
                    <span className="sr-only">Testdatensätze durchsuchen</span>
                    <FaMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-zinc-600" />
                    <input
                        ref={searchRef}
                        className="h-11 w-full rounded-xl border border-white/[.075] bg-[#0b0c10] pl-10 pr-24 text-xs text-zinc-200 outline-none transition placeholder:text-zinc-700 focus:border-orange-400/30"
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Datensätze suchen …"
                        type="search"
                        value={search}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-white/[.06] bg-white/[.025] px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-zinc-600">
                        Ctrl ⇧ F
                    </span>
                </label>
            </div>

            <div className="flex items-center justify-between gap-4 border-b border-white/[.05] px-5 py-3 text-[10px] font-bold uppercase tracking-[.12em] text-zinc-600 sm:px-6">
                <span>{filteredRows.length} sichtbare Testdatensätze</span>
                {debouncer.state.isPending ? (
                    <span className="inline-flex items-center gap-2 text-orange-300">
                        <FaSpinner className="animate-spin" /> Suche wird verzögert
                    </span>
                ) : (
                    <span>TanStack Table · Pacer · Hotkeys</span>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] border-collapse text-left">
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr className="border-b border-white/[.055]" key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        className="px-5 py-3 text-[9px] font-extrabold uppercase tracking-[.14em] text-zinc-600 first:pl-6 last:w-16"
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
                                <td className="px-6 py-16 text-center text-sm text-zinc-600" colSpan={columns.length}>
                                    Kein Testdatensatz entspricht „{debouncedSearch}“.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function CellValue({ column, value }) {
    if (column === 'status' || column === 'priority') {
        return (
            <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider ${statusTone(value)}`}
            >
                {value}
            </span>
        );
    }
    return <span className="whitespace-nowrap text-xs font-semibold text-zinc-300">{value}</span>;
}

function statusTone(value) {
    const normalized = String(value).toLocaleLowerCase('de-DE');
    if (
        /aktiv|online|operational|bezahlt|ausgeliefert|erledigt|freigegeben|angenommen|veröffentlicht/.test(normalized)
    ) {
        return 'border-emerald-400/15 bg-emerald-400/[.06] text-emerald-300';
    }
    if (/hoch|kritisch|gesperrt|eskaliert/.test(normalized)) {
        return 'border-red-400/15 bg-red-400/[.06] text-red-300';
    }
    if (/prüfung|prüfen|offen|arbeit|geplant|entwurf|neu/.test(normalized)) {
        return 'border-amber-400/15 bg-amber-400/[.06] text-amber-200';
    }
    return 'border-white/[.07] bg-white/[.025] text-zinc-500';
}

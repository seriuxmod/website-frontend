import { useMemo, useRef } from 'react';
import { areaY, barY, defineChart, lineY } from '@tanstack/charts';
import { Chart } from '@tanstack/charts/react/tooltip';
import { scaleBand } from '@tanstack/charts/scales/band';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { scalePoint } from '@tanstack/charts/scales/point';
import { tooltip as chartTooltip } from '@tanstack/charts/tooltip';
import { useHotkey } from '@tanstack/react-hotkeys';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { FaChartLine, FaMagnifyingGlass, FaSpinner } from 'react-icons/fa6';
import { AdminManagementEmpty, AdminPanel } from './AdminManagementShared';

export function pageRows(payload) {
    return Array.isArray(payload?.content) ? payload.content : [];
}

export function pageTotal(payload) {
    return Number(payload?.totalElements) || 0;
}

export function metric(value) {
    if (value === null || value === undefined || value === '') return '—';
    return Number.isFinite(Number(value)) ? new Intl.NumberFormat('de-DE').format(Number(value)) : '—';
}

export function humanize(value) {
    return String(value || 'Unbekannt')
        .replaceAll('_', ' ')
        .toLocaleLowerCase('de-DE')
        .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

export function compactId(value) {
    const normalized = String(value || '');
    return normalized.length > 18 ? `${normalized.slice(0, 8)}…${normalized.slice(-6)}` : normalized || '—';
}

export function durationLabel(seconds, permanent = false) {
    if (permanent) return 'Permanent';
    const value = Number(seconds);
    if (!Number.isFinite(value) || value <= 0) return 'Keine Vorgabe';
    if (value % 86400 === 0) return `${value / 86400} Tage`;
    if (value % 3600 === 0) return `${value / 3600} Stunden`;
    if (value % 60 === 0) return `${value / 60} Minuten`;
    return `${value} Sekunden`;
}

export function rgbHex(value) {
    const number = Math.min(0xffffff, Math.max(0, Number(value) || 0));
    return `#${number.toString(16).padStart(6, '0')}`;
}

export function useServerSearch(value, wait = 350) {
    return useDebouncedValue(value, { wait }, (state) => ({ isPending: state.isPending }));
}

export function AdminServerSearch({ value, onChange, pending, placeholder = 'Serverseitig durchsuchen …' }) {
    const ref = useRef(null);
    useHotkey('Mod+Shift+S', () => ref.current?.focus(), { preventDefault: true });
    return (
        <label className="relative block w-full">
            <span className="sr-only">Datensätze serverseitig durchsuchen</span>
            <FaMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-zinc-600" />
            <input
                ref={ref}
                className="h-11 w-full rounded-xl border border-white/[.075] bg-[#0b0c10] pl-10 pr-24 text-xs text-zinc-200 outline-none transition placeholder:text-zinc-700 focus:border-orange-400/35"
                maxLength={100}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                type="search"
                value={value}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-2 text-[8px] font-bold text-zinc-700">
                {pending && <FaSpinner className="animate-spin text-orange-300" />} Ctrl ⇧ S
            </span>
        </label>
    );
}

function createTimelineChart(rows, series, chartId) {
    const marks = [];
    series.forEach((item, index) => {
        if (item.area && index === 0) {
            marks.push(
                areaY(rows, {
                    id: `${chartId}-${item.key}-area`,
                    x: 'label',
                    y: item.key,
                    fill: `url(#${chartId}-${item.key}-gradient)`,
                    fillOpacity: 0.8
                })
            );
        }
        marks.push(
            lineY(rows, {
                id: `${chartId}-${item.key}-line`,
                x: 'label',
                y: item.key,
                stroke: item.color,
                strokeWidth: 2.4,
                points: true
            })
        );
    });
    return defineChart(
        {
            marks,
            scales: {
                x: { scale: () => scalePoint().padding(0.18) },
                y: { scale: scaleLinear, nice: true, grid: true }
            },
            gradients: series
                .filter((item) => item.area)
                .map((item) => ({
                    id: `${chartId}-${item.key}-gradient`,
                    x1: 0,
                    y1: 1,
                    x2: 0,
                    y2: 0,
                    stops: [
                        { offset: 0, color: item.color, opacity: 0.01 },
                        { offset: 1, color: item.color, opacity: 0.34 }
                    ]
                })),
            clip: true,
            theme: chartTheme(series.map((item) => item.color))
        },
        {
            keyboard: true,
            tooltip: {
                use: chartTooltip,
                format: ({ datum }) =>
                    `${datum.label} · ${series.map((item) => `${item.label}: ${metric(datum[item.key])}`).join(' · ')}`
            }
        }
    );
}

function createBars(rows, chartId, color) {
    return defineChart(
        {
            marks: [barY(rows, { id: `${chartId}-bars`, x: 'label', y: 'value', fill: color, rx: 6 })],
            scales: {
                x: { scale: () => scaleBand().padding(0.26) },
                y: { scale: scaleLinear, nice: true, grid: true }
            },
            clip: true,
            theme: chartTheme([color])
        },
        {
            keyboard: true,
            tooltip: { use: chartTooltip, format: ({ datum }) => `${datum.label} · ${metric(datum.value)}` }
        }
    );
}

function chartTheme(palette) {
    return {
        foreground: '#d4d4d8',
        muted: '#62636d',
        grid: '#24262d',
        background: 'transparent',
        palette
    };
}

export function AdminTimelineChart({ title, description, rows = [], series, id = 'admin-timeline' }) {
    const normalized = useMemo(
        () =>
            rows.map((row) => ({
                ...row,
                label: formatChartDate(row.date || row.label)
            })),
        [rows]
    );
    const chart = useMemo(
        () => (normalized.length ? createTimelineChart(normalized, series, id) : null),
        [id, normalized, series]
    );
    return (
        <AdminPanel description={description} eyebrow="VERLAUF" title={title}>
            {series.length > 1 && (
                <div className="flex flex-wrap gap-4 border-b border-white/[.05] px-6 py-3">
                    {series.map((item) => (
                        <span
                            className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-zinc-500"
                            key={item.key}
                        >
                            <i className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} /> {item.label}
                        </span>
                    ))}
                </div>
            )}
            {chart ? (
                <div className="min-h-[310px] px-3 pb-4 pt-5 [--tanstack-chart-tooltip-background:#15171d] sm:px-6">
                    <Chart ariaLabel={title} definition={chart} height={280} />
                </div>
            ) : (
                <AdminManagementEmpty
                    title="Noch keine Verlaufsdaten"
                    text="Der User-Service hat für den Zeitraum keine Messpunkte geliefert."
                />
            )}
        </AdminPanel>
    );
}

export function AdminBarChart({ title, description, rows = [], id = 'admin-bars', color = '#ff7417' }) {
    const normalized = useMemo(
        () => rows.map((row) => ({ label: String(row.label || '—'), value: Number(row.value) || 0 })),
        [rows]
    );
    const chart = useMemo(
        () => (normalized.length ? createBars(normalized, id, color) : null),
        [color, id, normalized]
    );
    return (
        <AdminPanel description={description} eyebrow="VERTEILUNG" title={title}>
            {chart ? (
                <div className="min-h-[310px] px-3 pb-4 pt-5 sm:px-6">
                    <Chart ariaLabel={title} definition={chart} height={280} />
                </div>
            ) : (
                <AdminManagementEmpty
                    title="Keine Vergleichsdaten"
                    text="Sobald Datensätze existieren, erscheint hier die Verteilung."
                />
            )}
        </AdminPanel>
    );
}

export function ChartIcon() {
    return <FaChartLine />;
}

function formatChartDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? String(value)
        : new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' }).format(date);
}

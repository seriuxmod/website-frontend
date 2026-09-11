import { useMemo } from 'react';
import { Chart } from '@tanstack/charts/react/tooltip';
import { areaY, defineChart, lineY } from '@tanstack/charts';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { scalePoint } from '@tanstack/charts/scales/point';
import { tooltip as chartTooltip } from '@tanstack/charts/tooltip';
import { FaArrowTrendUp, FaBolt, FaClock } from 'react-icons/fa6';
import { AdminEmptyState, AdminPendingState } from './AdminUi';

function createActivityChart(rows) {
    return defineChart(
        {
            marks: [
                areaY(rows, {
                    id: 'overview-team-activity-area',
                    x: 'label',
                    y: 'actions',
                    fill: 'url(#overview-team-activity-fill)',
                    fillOpacity: 0.82
                }),
                lineY(rows, {
                    id: 'overview-team-activity-line',
                    x: 'label',
                    y: 'actions',
                    stroke: '#ff7417',
                    strokeWidth: 2.5,
                    points: true
                })
            ],
            scales: {
                x: {
                    scale: () => scalePoint().padding(0.18),
                    axis: { label: 'Zeitraum' }
                },
                y: {
                    scale: scaleLinear,
                    nice: true,
                    grid: true,
                    axis: { label: 'Teamaktionen' }
                }
            },
            gradients: [
                {
                    id: 'overview-team-activity-fill',
                    x1: 0,
                    y1: 1,
                    x2: 0,
                    y2: 0,
                    stops: [
                        { offset: 0, color: '#ff5a0a', opacity: 0.02 },
                        { offset: 1, color: '#ff7417', opacity: 0.38 }
                    ]
                }
            ],
            clip: true,
            theme: {
                foreground: '#d4d4d8',
                muted: '#5f6069',
                grid: '#24262d',
                background: 'transparent',
                palette: ['#ff7417']
            }
        },
        {
            keyboard: true,
            tooltip: {
                use: chartTooltip,
                format: ({ datum }) => `${datum.label} · ${datum.actions} Teamaktionen`
            }
        }
    );
}

export default function AdminOverviewActivityChart({ activity = [], state = 'loading' }) {
    const rows = useMemo(
        () =>
            activity.map((entry) => ({
                label: formatBucket(entry.startsAt),
                actions: Number(entry.count) || 0,
                startsAt: entry.startsAt
            })),
        [activity]
    );
    const chartDefinition = useMemo(() => (rows.length ? createActivityChart(rows) : null), [rows]);
    const total = rows.reduce((sum, row) => sum + row.actions, 0);
    const peak = rows.reduce((value, row) => Math.max(value, row.actions), 0);
    const ready = state === 'ready';

    return (
        <section className="overflow-hidden rounded-[28px] border border-white/[.07] bg-[#111218] shadow-[0_24px_80px_rgba(0,0,0,.14)]">
            <div className="flex flex-wrap items-start justify-between gap-4 px-5 pb-2 pt-5 sm:px-7 sm:pt-7">
                <div>
                    <p className="eyebrow">TEAM-AKTIVITÄT</p>
                    <h3 className="mt-2 font-display text-2xl font-bold">Aktionen im Zeitverlauf</h3>
                    <p className="mt-2 text-xs leading-5 text-zinc-600">
                        Persistierte Änderungen aus Kalender, Aufgaben und internen Notizen.
                    </p>
                </div>
                {ready && (
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[.07] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.15em] text-emerald-200">
                        Live
                    </span>
                )}
            </div>

            {ready && rows.length > 0 && (
                <div className="grid gap-px border-y border-white/[.055] bg-white/[.055] sm:grid-cols-3">
                    <ActivitySummary icon={FaBolt} label="Spitzenwert" value={`${peak} Aktionen`} />
                    <ActivitySummary icon={FaArrowTrendUp} label="Gesamt" value={`${total} Aktionen`} />
                    <ActivitySummary icon={FaClock} label="Datenpunkte" value={String(rows.length)} />
                </div>
            )}

            {!ready ? (
                <div className="p-6 sm:p-7">
                    <AdminPendingState
                        title={state === 'waiting' ? 'Teamaktivität nicht erreichbar' : 'Teamaktivität wird geladen'}
                        text="Der Verlauf wird direkt aus dem User-Service gelesen."
                    />
                </div>
            ) : chartDefinition ? (
                <div className="min-h-[320px] px-2 pb-4 pt-5 text-zinc-300 [--ts-chart-tooltip-background:#15171d] [--ts-chart-tooltip-border-radius:14px] [--ts-chart-tooltip-border:1px_solid_rgba(255,116,23,.24)] [--ts-chart-tooltip-color:#fafafa] sm:px-5">
                    <Chart ariaLabel="Teamaktionen im Zeitverlauf" definition={chartDefinition} height={300} />
                </div>
            ) : (
                <div className="p-6 sm:p-7">
                    <AdminEmptyState
                        title="Noch keine Teamaktivität"
                        text="Nach der ersten Änderung liefert der User-Service den Verlauf automatisch."
                    />
                </div>
            )}
        </section>
    );
}

function ActivitySummary({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-3 bg-[#0e1015] px-5 py-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orange-500/10 text-sm text-orange-300">
                <Icon />
            </span>
            <div>
                <b className="block font-display text-base text-white">{value}</b>
                <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[.13em] text-zinc-600">
                    {label}
                </span>
            </div>
        </div>
    );
}

function formatBucket(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? String(value || '')
        : new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' }).format(date);
}

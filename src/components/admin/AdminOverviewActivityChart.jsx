import { useMemo } from 'react';
import { Chart } from '@tanstack/charts/react/tooltip';
import { areaY, defineChart, lineY } from '@tanstack/charts';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { scalePoint } from '@tanstack/charts/scales/point';
import { tooltip as chartTooltip } from '@tanstack/charts/tooltip';
import { FaArrowTrendUp, FaBolt, FaClock } from 'react-icons/fa6';

const ACTIVITY_DATA = [
    { time: '00:00', requests: 18 },
    { time: '02:00', requests: 24 },
    { time: '04:00', requests: 16 },
    { time: '06:00', requests: 31 },
    { time: '08:00', requests: 48 },
    { time: '10:00', requests: 64 },
    { time: '12:00', requests: 57 },
    { time: '14:00', requests: 72 },
    { time: '16:00', requests: 81 },
    { time: '18:00', requests: 69 },
    { time: '20:00', requests: 88 },
    { time: '22:00', requests: 61 }
];

function createActivityChart() {
    return defineChart(
        {
            marks: [
                areaY(ACTIVITY_DATA, {
                    id: 'overview-request-area',
                    x: 'time',
                    y: 'requests',
                    fill: 'url(#overview-request-fill)',
                    fillOpacity: 0.82
                }),
                lineY(ACTIVITY_DATA, {
                    id: 'overview-request-line',
                    x: 'time',
                    y: 'requests',
                    stroke: '#ff7417',
                    strokeWidth: 2.5,
                    points: true
                })
            ],
            scales: {
                x: {
                    scale: () => scalePoint().padding(0.18),
                    axis: { label: 'Uhrzeit' }
                },
                y: {
                    scale: scaleLinear,
                    nice: true,
                    grid: true,
                    axis: { label: 'Anfragen / Minute' }
                }
            },
            gradients: [
                {
                    id: 'overview-request-fill',
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
                format: ({ datum }) => `${datum.time} Uhr · ${datum.requests} Test-Anfragen/min`
            }
        }
    );
}

export default function AdminOverviewActivityChart() {
    const chartDefinition = useMemo(createActivityChart, []);

    return (
        <section className="overflow-hidden rounded-[28px] border border-white/[.07] bg-[#111218] shadow-[0_24px_80px_rgba(0,0,0,.14)]">
            <div className="flex flex-wrap items-start justify-between gap-4 px-5 pb-2 pt-5 sm:px-7 sm:pt-7">
                <div>
                    <p className="eyebrow">PLATTFORM-AKTIVITÄT</p>
                    <h3 className="mt-2 font-display text-2xl font-bold">Anfragen im Tagesverlauf</h3>
                    <p className="mt-2 text-xs leading-5 text-zinc-600">
                        Layoutvorschau für die spätere zentrale Traffic-Auswertung aller SeriuxMod-Dienste.
                    </p>
                </div>
                <span className="rounded-full border border-amber-400/20 bg-amber-400/[.07] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.15em] text-amber-200">
                    Testdatensatz
                </span>
            </div>

            <div className="grid gap-px border-y border-white/[.055] bg-white/[.055] sm:grid-cols-3">
                <ActivitySummary icon={FaBolt} label="Spitzenwert" value="88 / min" />
                <ActivitySummary icon={FaArrowTrendUp} label="Tendenz" value="+14,2 %" />
                <ActivitySummary icon={FaClock} label="Zeitraum" value="24 Stunden" />
            </div>

            <div className="min-h-[320px] px-2 pb-4 pt-5 text-zinc-300 [--ts-chart-tooltip-background:#15171d] [--ts-chart-tooltip-border-radius:14px] [--ts-chart-tooltip-border:1px_solid_rgba(255,116,23,.24)] [--ts-chart-tooltip-color:#fafafa] sm:px-5">
                <Chart
                    ariaLabel="Simulierter Verlauf eingehender API-Anfragen über 24 Stunden"
                    definition={chartDefinition}
                    height={300}
                />
            </div>
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
                    {label} · Test
                </span>
            </div>
        </div>
    );
}

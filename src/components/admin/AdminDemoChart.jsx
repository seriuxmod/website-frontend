import { useMemo } from 'react';
import { Chart } from '@tanstack/charts/react/tooltip';
import { areaY, defineChart, lineY } from '@tanstack/charts';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { scalePoint } from '@tanstack/charts/scales/point';
import { tooltip as chartTooltip } from '@tanstack/charts/tooltip';

const TIMES = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00'
];

function createDefinition(config) {
    const rows = config.data.map((value, index) => ({ time: TIMES[index], value }));

    return defineChart(
        {
            marks: [
                areaY(rows, {
                    id: 'admin-demo-area',
                    x: 'time',
                    y: 'value',
                    fill: 'url(#admin-demo-fill)',
                    fillOpacity: 0.78
                }),
                lineY(rows, {
                    id: 'admin-demo-line',
                    x: 'time',
                    y: 'value',
                    stroke: '#ff721b',
                    strokeWidth: 2.5,
                    points: true
                })
            ],
            scales: {
                x: { scale: () => scalePoint().padding(0.18), axis: { label: 'Tagesverlauf' } },
                y: { scale: scaleLinear, nice: true, grid: true, axis: { label: config.label } }
            },
            gradients: [
                {
                    id: 'admin-demo-fill',
                    x1: 0,
                    y1: 1,
                    x2: 0,
                    y2: 0,
                    stops: [
                        { offset: 0, color: '#ff5a0a', opacity: 0.015 },
                        { offset: 1, color: '#ff8a3d', opacity: 0.4 }
                    ]
                }
            ],
            clip: true,
            theme: {
                foreground: '#d4d4d8',
                muted: '#5f6069',
                grid: '#272931',
                background: 'transparent',
                palette: ['#ff721b']
            }
        },
        {
            keyboard: true,
            tooltip: {
                use: chartTooltip,
                format: ({ datum }) =>
                    `${datum.time} · ${datum.value}${config.suffix ? ` ${config.suffix}` : ''} · Test`
            }
        }
    );
}

export default function AdminDemoChart({ config }) {
    const definition = useMemo(() => createDefinition(config), [config]);

    return (
        <section className="overflow-hidden rounded-[26px] border border-white/[.07] bg-[#111218]">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[.055] px-5 py-5 sm:px-6">
                <div>
                    <p className="eyebrow">AUSWERTUNG</p>
                    <h3 className="mt-2 font-display text-xl font-bold">{config.title}</h3>
                    <p className="mt-2 text-xs text-zinc-600">
                        Demonstrative Zeitreihe für die spätere Live-Auswertung.
                    </p>
                </div>
                <TestBadge />
            </div>
            <div className="min-h-[340px] px-2 pb-4 pt-5 text-zinc-300 [--ts-chart-tooltip-background:#15171d] [--ts-chart-tooltip-border-radius:14px] [--ts-chart-tooltip-border:1px_solid_rgba(255,116,23,.24)] [--ts-chart-tooltip-color:#fafafa] sm:px-5">
                <Chart ariaLabel={`${config.title}, Testdatensatz`} definition={definition} height={315} />
            </div>
        </section>
    );
}

export function TestBadge({ children = 'Testdatensatz' }) {
    return (
        <span className="inline-flex w-fit items-center rounded-full border border-amber-400/20 bg-amber-400/[.07] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.15em] text-amber-200">
            {children}
        </span>
    );
}

import { useMemo, useState } from 'react';
import { areaX, defineChart, text } from '@tanstack/charts';
import { pie, polar, radialArc, radialBarAngle, radialText } from '@tanstack/charts/polar';
import { Chart } from '@tanstack/charts/react/tooltip';
import { scaleBand, scaleLinear } from 'd3-scale';
import {
    FaBell,
    FaCloud,
    FaCreditCard,
    FaDatabase,
    FaHeartCrack,
    FaNetworkWired,
    FaSeedling,
    FaServer,
    FaSpinner
} from 'react-icons/fa6';
import { STATUS_FLOW_SERVICES, STATUS_LOAD_FACTORS, STATUS_STACKS } from '../../data/adminModuleFixtures';
import { TestBadge } from './AdminDemoChart';

const STATUS_VISUALS = {
    operational: {
        label: 'Bereit',
        icon: FaSeedling,
        accent: 'text-emerald-300',
        border: 'border-emerald-400/20',
        background: 'bg-emerald-400/[.055]',
        pulse: 'fill-emerald-300'
    },
    degraded: {
        label: 'Verzögert',
        icon: FaSpinner,
        accent: 'text-amber-300',
        border: 'border-amber-400/25',
        background: 'bg-amber-400/[.055]',
        pulse: 'fill-amber-300'
    },
    offline: {
        label: 'Offline',
        icon: FaHeartCrack,
        accent: 'text-red-300',
        border: 'border-red-400/25',
        background: 'bg-red-400/[.055]',
        pulse: 'fill-red-300'
    }
};

const FLOW_ICONS = [FaNetworkWired, FaServer, FaCloud, FaDatabase, FaCreditCard, FaBell];

const STACK_STATUS = {
    ready: { label: 'Bereit', className: 'border-emerald-400/15 bg-emerald-400/[.06] text-emerald-300' },
    delayed: { label: 'Verzögert', className: 'border-amber-400/15 bg-amber-400/[.06] text-amber-200' },
    offline: { label: 'Offline', className: 'border-red-400/15 bg-red-400/[.06] text-red-300' }
};

export default function AdminSystemStatusView() {
    const readiness = useMemo(
        () =>
            STATUS_STACKS.reduce((result, stack) => ({ ...result, [stack.status]: result[stack.status] + 1 }), {
                ready: 0,
                delayed: 0,
                offline: 0
            }),
        []
    );

    return (
        <div className="space-y-6">
            <StatusFlow />
            <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,.65fr)]">
                <StackList />
                <ReadinessCard readiness={readiness} />
            </section>
            <LoadFunnel />
        </div>
    );
}

function StatusFlow() {
    return (
        <section className="overflow-hidden rounded-[28px] border border-white/[.07] bg-[#111218]">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[.055] p-5 sm:px-6">
                <div>
                    <p className="eyebrow">SERVICE FLOW</p>
                    <h3 className="mt-2 font-display text-xl font-bold">Verbindung durch die Infrastruktur</h3>
                    <p className="mt-2 text-xs leading-5 text-zinc-600">
                        Die öffentlich überwachten Dienstgruppen in ihrer aktuellen Reihenfolge von links nach rechts.
                    </p>
                </div>
                <TestBadge />
            </div>

            <div className="overflow-x-auto p-5 [scrollbar-color:#3f3f46_transparent] sm:p-6">
                <div className="flex min-w-[1240px] items-center justify-between rounded-[24px] border border-white/[.05] bg-black/15 px-5 py-10">
                    {STATUS_FLOW_SERVICES.map((service, index) => (
                        <div className="contents" key={service.name}>
                            <FlowNode index={index} service={service} />
                            {index < STATUS_FLOW_SERVICES.length - 1 && (
                                <FlowConnector index={index} status={STATUS_FLOW_SERVICES[index + 1].status} />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function FlowNode({ index, service }) {
    const visual = STATUS_VISUALS[service.status];
    const Icon = FLOW_ICONS[index];
    const StatusIcon = visual.icon;

    return (
        <article
            className={`relative flex h-[190px] w-[170px] shrink-0 flex-col items-center justify-center rounded-[22px] border ${visual.border} ${visual.background} px-4 text-center`}
        >
            <span
                className={`grid h-12 w-12 place-items-center rounded-2xl border ${visual.border} bg-black/20 ${visual.accent}`}
            >
                <Icon />
            </span>
            <h4 className="mt-4 min-h-9 text-xs font-bold leading-4 text-zinc-100">{service.name}</h4>
            <div
                className={`mt-3 flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[.12em] ${visual.accent}`}
            >
                <StatusIcon className={service.status === 'degraded' ? 'animate-spin [animation-duration:1.8s]' : ''} />
                {visual.label}
            </div>
            <span className="mt-2 text-[10px] font-semibold text-zinc-600">
                {service.latency ? `${service.latency} ms` : 'Keine Antwort'}
            </span>
        </article>
    );
}

function FlowConnector({ index, status }) {
    const visual = STATUS_VISUALS[status];
    return (
        <svg
            aria-hidden="true"
            className={`h-8 w-11 shrink-0 ${visual.accent}`}
            preserveAspectRatio="none"
            viewBox="0 0 44 24"
        >
            <path className="status-flow-line" d="M 1 12 H 43" />
            <path d="m 37 7 6 5-6 5" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <circle className={visual.pulse} r="2.8">
                <animateMotion
                    begin={`${index * -0.45}s`}
                    dur={status === 'offline' ? '3.8s' : '2.2s'}
                    path="M 2 12 H 41"
                    repeatCount="indefinite"
                />
            </circle>
        </svg>
    );
}

function StackList() {
    return (
        <section className="overflow-hidden rounded-[28px] border border-white/[.07] bg-[#111218]">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[.055] p-5 sm:px-6">
                <div>
                    <p className="eyebrow">DOCKER SWARM</p>
                    <h3 className="mt-2 font-display text-xl font-bold">Stacks und Replikate</h3>
                    <p className="mt-2 text-xs leading-5 text-zinc-600">
                        Geplanter Detailblick auf jeden überwachten Swarm-Service.
                    </p>
                </div>
                <TestBadge />
            </div>
            <div className="max-h-[640px] overflow-auto [scrollbar-color:#3f3f46_transparent]">
                <div className="min-w-[760px]">
                    <div className="grid grid-cols-[minmax(220px,1.35fr)_minmax(170px,1fr)_90px_100px_110px] gap-4 border-b border-white/[.05] bg-black/10 px-6 py-3 text-[9px] font-extrabold uppercase tracking-[.13em] text-zinc-700">
                        <span>Docker-Stack / Service</span>
                        <span>Dienst</span>
                        <span>Replikate</span>
                        <span>Ping</span>
                        <span>Status</span>
                    </div>
                    {STATUS_STACKS.map((stack) => {
                        const status = STACK_STATUS[stack.status];
                        return (
                            <div
                                className="grid grid-cols-[minmax(220px,1.35fr)_minmax(170px,1fr)_90px_100px_110px] items-center gap-4 border-b border-white/[.045] px-6 py-3.5 last:border-b-0 hover:bg-white/[.018]"
                                key={stack.stack}
                            >
                                <code className="truncate text-[11px] font-bold text-zinc-300">{stack.stack}</code>
                                <span className="text-xs font-semibold text-zinc-500">{stack.service}</span>
                                <span className="font-display text-sm font-bold text-zinc-300">{stack.replicas}</span>
                                <span className="text-xs font-semibold text-zinc-500">{stack.latency}</span>
                                <span
                                    className={`w-fit rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider ${status.className}`}
                                >
                                    {status.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function ReadinessCard({ readiness }) {
    const total = STATUS_STACKS.length;
    const definition = useMemo(() => createReadinessDefinition(readiness.ready, total), [readiness.ready, total]);
    const breakdown = [
        ['Bereit', readiness.ready, 'bg-emerald-400', 'text-emerald-300'],
        ['Verzögert', readiness.delayed, 'bg-amber-400', 'text-amber-200'],
        ['Offline', readiness.offline, 'bg-red-400', 'text-red-300']
    ];

    return (
        <section className="overflow-hidden rounded-[28px] border border-white/[.07] bg-[#111218]">
            <div className="flex items-start justify-between gap-4 border-b border-white/[.055] p-5 sm:px-6">
                <div>
                    <p className="eyebrow">BEREITSCHAFT</p>
                    <h3 className="mt-2 font-display text-xl font-bold">Service Readiness</h3>
                    <p className="mt-2 text-xs text-zinc-600">Ping-Grenzwert für Verzögerungen: 500 ms.</p>
                </div>
                <TestBadge />
            </div>
            <div className="px-5 pb-6 pt-5 sm:px-6">
                <div className="mx-auto h-[270px] max-w-[300px]">
                    <Chart
                        ariaLabel={`${readiness.ready} von ${total} Services bereit, Testdatensatz`}
                        definition={definition}
                        height={270}
                    />
                </div>
                <div className="mt-2 space-y-3">
                    {breakdown.map(([label, value, bar, textColor]) => (
                        <div className="rounded-2xl border border-white/[.055] bg-black/15 p-3.5" key={label}>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-xs font-semibold text-zinc-500">{label}</span>
                                <strong className={`font-display text-sm ${textColor}`}>{value}</strong>
                            </div>
                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[.045]">
                                <div
                                    className={`h-full rounded-full ${bar}`}
                                    style={{ width: `${(value / total) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function createReadinessDefinition(ready, total) {
    const background = pie([{ id: 'background', value: 1 }], { value: 'value' });
    const progress = [{ id: 'ready', value: ready, ring: 'readiness' }];
    const endDegrees = Math.max(8, (ready / total) * 360);

    return defineChart({
        scales: { x: null, y: null },
        marks: [
            polar({
                marks: [
                    radialArc(background, {
                        id: 'readiness-background',
                        key: 'id',
                        innerRadius: 82,
                        outerRadius: 96,
                        fill: '#272930'
                    })
                ],
                scales: { angle: null, radius: null }
            }),
            polar({
                startAngle: radialAngle(0),
                endAngle: radialAngle(endDegrees),
                scales: {
                    angle: { scale: scaleLinear().domain([0, ready || 1]) },
                    radius: { scale: scaleBand().domain(['readiness']), range: [82, 96] }
                },
                marks: [
                    radialBarAngle(progress, {
                        id: 'readiness-value',
                        angle: 'value',
                        radius: 'ring',
                        key: 'id',
                        fill: '#34d399',
                        cornerRadius: 10
                    })
                ]
            }),
            polar({
                scales: {
                    angle: { scale: scaleLinear().domain([0, 1]) },
                    radius: { scale: scaleLinear().domain([0, 1]) }
                },
                marks: [
                    radialText([{ id: 'total', angle: 0, radius: 0, text: `${ready}/${total}` }], {
                        id: 'readiness-total',
                        angle: 'angle',
                        radius: 'radius',
                        key: 'id',
                        text: 'text',
                        dy: -3,
                        fill: '#fafafa',
                        fontSize: 34,
                        fontWeight: 800
                    }),
                    radialText([{ id: 'label', angle: 0, radius: 0, text: 'bereit' }], {
                        id: 'readiness-label',
                        angle: 'angle',
                        radius: 'radius',
                        key: 'id',
                        text: 'text',
                        dy: 27,
                        fill: '#71717a',
                        fontSize: 12,
                        fontWeight: 700
                    })
                ]
            })
        ],
        margin: 0,
        theme: {
            foreground: '#d4d4d8',
            muted: '#52525b',
            background: 'transparent',
            palette: ['#34d399']
        }
    });
}

function radialAngle(degrees) {
    return ((90 - degrees) * Math.PI) / 180;
}

function LoadFunnel() {
    const [factor, setFactor] = useState('networking');
    const config = STATUS_LOAD_FACTORS[factor];
    const rows = useMemo(() => [...config.rows].sort((left, right) => right.value - left.value), [config.rows]);
    const definition = useMemo(() => createFunnelDefinition(rows, config.unit), [rows, config.unit]);
    const highest = rows[0];

    return (
        <section className="overflow-hidden rounded-[28px] border border-white/[.07] bg-[#111218]">
            <div className="flex flex-col gap-5 border-b border-white/[.055] p-5 sm:px-6 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <p className="eyebrow">STACK-AUSLASTUNG</p>
                        <TestBadge />
                    </div>
                    <h3 className="mt-2 font-display text-xl font-bold">Auslastung nach Docker-Stack</h3>
                    <p className="mt-2 text-xs leading-5 text-zinc-600">
                        Absteigend sortierte Ressourcenlast. Der größte Verbraucher steht an erster Stelle.
                    </p>
                </div>
                <div
                    className="flex w-fit rounded-xl border border-white/[.07] bg-black/20 p-1"
                    aria-label="Auslastungsfaktor wählen"
                >
                    {Object.entries(STATUS_LOAD_FACTORS).map(([key, option]) => (
                        <button
                            className={`rounded-lg px-4 py-2 text-[10px] font-extrabold uppercase tracking-[.11em] transition ${factor === key ? 'bg-orange-500 text-white shadow-[0_8px_24px_rgba(249,115,22,.18)]' : 'text-zinc-600 hover:text-zinc-300'}`}
                            key={key}
                            onClick={() => setFactor(key)}
                            type="button"
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="grid gap-0 2xl:grid-cols-[minmax(0,1.5fr)_360px]">
                <div className="min-h-[470px] border-b border-white/[.055] p-4 sm:p-6 2xl:border-b-0 2xl:border-r">
                    <Chart
                        ariaLabel={`Stack-Auslastung nach ${config.label}, Testdatensatz`}
                        definition={definition}
                        height={420}
                    />
                </div>
                <aside className="p-5 sm:p-6">
                    <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-zinc-700">
                        Höchste Auslastung
                    </p>
                    <strong className="mt-3 block font-display text-2xl font-bold text-white">{highest.label}</strong>
                    <span className="mt-2 block font-display text-4xl font-black tracking-[-.05em] text-orange-300">
                        {formatMetric(highest.value)} <small className="text-sm text-zinc-600">{config.unit}</small>
                    </span>
                    <div className="mt-6 space-y-3 border-t border-white/[.055] pt-5">
                        {rows.map((row, index) => (
                            <div className="flex items-center gap-3" key={row.id}>
                                <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-500/[.07] text-[10px] font-black text-orange-300">
                                    {index + 1}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-zinc-500">
                                    {row.label}
                                </span>
                                <span className="text-xs font-bold text-zinc-300">
                                    {formatMetric(row.value)} {config.unit}
                                </span>
                            </div>
                        ))}
                    </div>
                    <p className="mt-6 rounded-2xl border border-dashed border-white/[.07] bg-black/15 p-4 text-[10px] leading-5 text-zinc-600">
                        Die Umschaltung verändert ausschließlich den lokalen Testdatensatz. Die spätere Quelle wird eine
                        Infrastruktur-Metrik des Status-Backends.
                    </p>
                </aside>
            </div>
        </section>
    );
}

function createFunnelDefinition(rows, unit) {
    const maximum = Math.max(...rows.map((row) => row.value), 1);
    const points = rows.flatMap((row, index) => {
        const startWidth = Math.max(0.24, row.value / maximum);
        const nextValue = rows[index + 1]?.value ?? row.value * 0.72;
        const endWidth = Math.max(0.18, nextValue / maximum);
        return [
            { ...row, boundary: 'start', y: index + 0.04, x1: -startWidth, x2: startWidth },
            { ...row, boundary: 'end', y: index + 0.96, x1: -endWidth, x2: endWidth }
        ];
    });
    const labels = rows.map((row, index) => ({
        ...row,
        x: 0,
        y: index + 0.5,
        text: `${row.label} · ${formatMetric(row.value)} ${unit}`
    }));

    return defineChart({
        marks: [
            areaX(points, {
                id: 'stack-load-funnel',
                x1: 'x1',
                x2: 'x2',
                y: 'y',
                z: 'id',
                color: 'id',
                key: (point) => `${point.id}:${point.boundary}`,
                fillOpacity: 0.96
            }),
            text(labels, {
                id: 'stack-load-labels',
                x: 'x',
                y: 'y',
                text: 'text',
                key: 'id',
                anchor: 'middle',
                fill: '#fff7ed',
                fontSize: 12,
                fontWeight: 700
            })
        ],
        scales: {
            x: { scale: scaleLinear().domain([-1.08, 1.08]), axis: false },
            y: { scale: scaleLinear().domain([rows.length, 0]), axis: false }
        },
        color: {
            domain: rows.map((row) => row.id),
            range: ['#c2410c', '#ea580c', '#f97316', '#fb923c', '#fdba74']
        },
        margin: 12,
        theme: {
            foreground: '#fafafa',
            muted: '#71717a',
            background: 'transparent',
            palette: ['#c2410c', '#ea580c', '#f97316', '#fb923c', '#fdba74']
        }
    });
}

function formatMetric(value) {
    return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(value);
}

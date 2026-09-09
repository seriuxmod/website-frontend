import { useCallback, useEffect, useMemo, useState } from 'react';
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
    FaRotate,
    FaSeedling,
    FaServer,
    FaSpinner
} from 'react-icons/fa6';
import { statusAdminApi } from '../../lib/statusAdminApi';
import { AdminEmptyState, AdminPendingState } from './AdminUi';

const REFRESH_INTERVAL_MS = 15_000;

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

const GROUP_DEFINITIONS = [
    { name: 'DNS Auflösung', aliases: ['DNS Auflösung', 'API Services'], icon: FaNetworkWired },
    { name: 'API Gateway', aliases: ['API Gateway', 'seriuxmod'], icon: FaServer },
    { name: 'CDN', aliases: ['CDN'], icon: FaCloud },
    { name: 'Database', aliases: ['Database', 'Databases & Cache'], icon: FaDatabase },
    { name: 'Payment Gateway', aliases: ['Payment Gateway', 'Payments'], icon: FaCreditCard },
    { name: 'Notification Service', aliases: ['Notification Service', 'Notifications'], icon: FaBell }
];

const STACK_STATUS = {
    ready: { label: 'Bereit', className: 'border-emerald-400/15 bg-emerald-400/[.06] text-emerald-300' },
    delayed: { label: 'Verzögert', className: 'border-amber-400/15 bg-amber-400/[.06] text-amber-200' },
    offline: { label: 'Offline', className: 'border-red-400/15 bg-red-400/[.06] text-red-300' }
};

const LOAD_FACTORS = {
    networking: {
        label: 'Networking',
        unit: 'kbit/s',
        available: 'networkMetricsAvailable',
        value: (service) => (Number(service.networkBytesPerSecond) * 8) / 1000
    },
    cpu: {
        label: 'CPU',
        unit: '%',
        available: 'cpuMetricsAvailable',
        value: (service) => Number(service.cpuUsagePercent)
    },
    ram: {
        label: 'RAM',
        unit: 'MiB',
        available: 'memoryMetricsAvailable',
        value: (service) => Number(service.memoryUsageBytes) / 1024 / 1024
    }
};

export default function AdminSystemStatusView() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async (background = false, signal) => {
        if (background) setRefreshing(true);
        else setLoading(true);
        try {
            const nextData = await statusAdminApi.summary(signal);
            setData(nextData);
            setError(null);
        } catch (nextError) {
            if (nextError.name !== 'AbortError') setError(nextError);
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        load(false, controller.signal);
        const interval = window.setInterval(() => load(true, controller.signal), REFRESH_INTERVAL_MS);
        return () => {
            controller.abort();
            window.clearInterval(interval);
        };
    }, [load]);

    const flowGroups = useMemo(() => normalizeFlowGroups(data?.groups ?? []), [data?.groups]);

    if (loading && !data) {
        return <AdminPendingState title="Live-Status wird geladen" text="Der geschützte Status-Snapshot wird abgerufen." />;
    }

    if (error && !data) {
        return (
            <StatusError
                error={error}
                onRetry={() => {
                    setError(null);
                    load(false);
                }}
            />
        );
    }

    return (
        <div className="space-y-6">
            <LiveStatusBar data={data} error={error} onRefresh={() => load(true)} refreshing={refreshing} />
            <StatusFlow groups={flowGroups} />
            <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,.65fr)]">
                <StackList services={data?.swarmServices ?? []} />
                <ReadinessCard
                    readiness={data?.readiness ?? { total: 0, ready: 0, delayed: 0, offline: 0 }}
                    threshold={data?.degradedResponseTimeMs}
                />
            </section>
            <LoadFunnel services={data?.swarmServices ?? []} />
        </div>
    );
}

function LiveStatusBar({ data, error, onRefresh, refreshing }) {
    const status = normalizeVisualState(data?.overallStatus);
    const visual = STATUS_VISUALS[status];
    const Icon = visual.icon;
    return (
        <div className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border ${visual.border} ${visual.background} px-4 py-3`}>
            <div className="flex min-w-0 items-center gap-3">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-black/20 ${visual.accent}`}>
                    <Icon className={status === 'degraded' ? 'animate-spin [animation-duration:1.8s]' : ''} />
                </span>
                <div className="min-w-0">
                    <b className="block text-xs text-zinc-200">Status-Backend · {visual.label}</b>
                    <span className="block truncate text-[10px] text-zinc-600">
                        {error
                            ? `Letzte Aktualisierung bleibt sichtbar · ${error.message}`
                            : `Stand ${formatDateTime(data?.generatedAt)} · automatische Aktualisierung alle 15 Sekunden`}
                    </span>
                </div>
            </div>
            <button
                className="flex items-center gap-2 rounded-xl border border-white/[.07] bg-black/15 px-3 py-2 text-[10px] font-bold text-zinc-400 transition hover:border-orange-400/20 hover:text-orange-200 disabled:opacity-60"
                disabled={refreshing}
                onClick={onRefresh}
                type="button"
            >
                <FaRotate className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Aktualisiere …' : 'Neu laden'}
            </button>
        </div>
    );
}

function StatusError({ error, onRetry }) {
    return (
        <section className="rounded-[28px] border border-red-400/20 bg-red-400/[.045] p-6">
            <AdminEmptyState
                title="Status-Backend nicht erreichbar"
                text={error?.status === 403 ? 'Für diesen Status-Snapshot fehlt die Administratorberechtigung.' : error?.message}
            />
            <button className="mx-auto mt-4 block rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white" onClick={onRetry} type="button">
                Erneut versuchen
            </button>
        </section>
    );
}

function StatusFlow({ groups }) {
    return (
        <section className="overflow-hidden rounded-[28px] border border-white/[.07] bg-[#111218]">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[.055] p-5 sm:px-6">
                <div>
                    <p className="eyebrow">SERVICE FLOW</p>
                    <h3 className="mt-2 font-display text-xl font-bold">Verbindung durch die Infrastruktur</h3>
                    <p className="mt-2 text-xs leading-5 text-zinc-600">Live aggregierte Dienstgruppen in ihrer tatsächlichen Verbindungsreihenfolge.</p>
                </div>
                <LiveBadge />
            </div>

            {groups.length ? (
                <div className="overflow-x-auto p-5 [scrollbar-color:#3f3f46_transparent] sm:p-6">
                    <div className="flex min-w-[1240px] items-center justify-between rounded-[24px] border border-white/[.05] bg-black/15 px-5 py-10">
                        {groups.map((service, index) => (
                            <div className="contents" key={service.name}>
                                <FlowNode service={service} />
                                {index < groups.length - 1 && <FlowConnector index={index} status={groups[index + 1].status} />}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="p-5 sm:p-6"><AdminEmptyState title="Keine Dienstgruppen gemeldet" text="Der Status-Snapshot enthält aktuell keine Flow-Gruppen." /></div>
            )}
        </section>
    );
}

function FlowNode({ service }) {
    const visual = STATUS_VISUALS[service.status];
    const Icon = service.icon;
    const StatusIcon = visual.icon;

    return (
        <article className={`relative flex h-[190px] w-[170px] shrink-0 flex-col items-center justify-center rounded-[22px] border ${visual.border} ${visual.background} px-4 text-center`}>
            <span className={`grid h-12 w-12 place-items-center rounded-2xl border ${visual.border} bg-black/20 ${visual.accent}`}><Icon /></span>
            <h4 className="mt-4 min-h-9 text-xs font-bold leading-4 text-zinc-100">{service.name}</h4>
            <div className={`mt-3 flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[.12em] ${visual.accent}`}>
                <StatusIcon className={service.status === 'degraded' ? 'animate-spin [animation-duration:1.8s]' : ''} />
                {visual.label}
            </div>
            <span className="mt-2 text-[10px] font-semibold text-zinc-600">
                {service.hasResponse ? `${service.latency} ms · ${service.healthy}/${service.total}` : `Keine Antwort · ${service.healthy}/${service.total}`}
            </span>
        </article>
    );
}

function FlowConnector({ index, status }) {
    const visual = STATUS_VISUALS[status];
    return (
        <svg aria-hidden="true" className={`h-8 w-11 shrink-0 ${visual.accent}`} preserveAspectRatio="none" viewBox="0 0 44 24">
            <path className="status-flow-line" d="M 1 12 H 43" />
            <path d="m 37 7 6 5-6 5" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <circle className={visual.pulse} r="2.8"><animateMotion begin={`${index * -0.45}s`} dur={status === 'offline' ? '3.8s' : '2.2s'} path="M 2 12 H 41" repeatCount="indefinite" /></circle>
        </svg>
    );
}

function StackList({ services }) {
    return (
        <section className="overflow-hidden rounded-[28px] border border-white/[.07] bg-[#111218]">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[.055] p-5 sm:px-6">
                <div>
                    <p className="eyebrow">DOCKER SWARM</p>
                    <h3 className="mt-2 font-display text-xl font-bold">Stacks und Replikate</h3>
                    <p className="mt-2 text-xs leading-5 text-zinc-600">Aktuell ausgeführte Swarm-Services direkt aus der Docker Engine API.</p>
                </div>
                <LiveBadge />
            </div>
            {services.length ? (
                <div className="max-h-[640px] overflow-auto [scrollbar-color:#3f3f46_transparent]">
                    <div className="min-w-[760px]">
                        <div className="grid grid-cols-[minmax(220px,1.35fr)_minmax(170px,1fr)_90px_100px_110px] gap-4 border-b border-white/[.05] bg-black/10 px-6 py-3 text-[9px] font-extrabold uppercase tracking-[.13em] text-zinc-700">
                            <span>Docker-Stack / Service</span><span>Dienst</span><span>Replikate</span><span>Ping</span><span>Status</span>
                        </div>
                        {services.map((service) => {
                            const status = STACK_STATUS[normalizeStackState(service.state)];
                            return (
                                <div className="grid grid-cols-[minmax(220px,1.35fr)_minmax(170px,1fr)_90px_100px_110px] items-center gap-4 border-b border-white/[.045] px-6 py-3.5 last:border-b-0 hover:bg-white/[.018]" key={service.serviceName}>
                                    <div className="min-w-0"><code className="block truncate text-[11px] font-bold text-zinc-300">{service.stackName || 'Ohne Stack'}</code><span className="mt-1 block truncate text-[9px] text-zinc-700">{service.serviceName}</span></div>
                                    <span className="text-xs font-semibold text-zinc-500">{service.displayName}</span>
                                    <span className="font-display text-sm font-bold text-zinc-300">{service.runningReplicas}/{service.desiredReplicas}</span>
                                    <span className="text-xs font-semibold text-zinc-500">{service.responseTimeMs == null ? 'nicht überwacht' : `${service.responseTimeMs} ms`}</span>
                                    <span className={`w-fit rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider ${status.className}`}>{status.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="p-5 sm:p-6"><AdminEmptyState title="Kein Docker-Inventar" text="Die Docker Engine API hat noch keine Swarm-Services geliefert." /></div>
            )}
        </section>
    );
}

function ReadinessCard({ readiness, threshold }) {
    const total = Number(readiness.total) || 0;
    const ready = Number(readiness.ready) || 0;
    const definition = useMemo(() => createReadinessDefinition(ready, total), [ready, total]);
    const breakdown = [
        ['Bereit', Number(readiness.ready) || 0, 'bg-emerald-400', 'text-emerald-300'],
        ['Verzögert', Number(readiness.delayed) || 0, 'bg-amber-400', 'text-amber-200'],
        ['Offline', Number(readiness.offline) || 0, 'bg-red-400', 'text-red-300']
    ];

    return (
        <section className="overflow-hidden rounded-[28px] border border-white/[.07] bg-[#111218]">
            <div className="flex items-start justify-between gap-4 border-b border-white/[.055] p-5 sm:px-6">
                <div><p className="eyebrow">BEREITSCHAFT</p><h3 className="mt-2 font-display text-xl font-bold">Service Readiness</h3><p className="mt-2 text-xs text-zinc-600">Ping-Grenzwert für Verzögerungen: {threshold ?? '–'} ms.</p></div>
                <LiveBadge />
            </div>
            {total ? (
                <div className="px-5 pb-6 pt-5 sm:px-6">
                    <div className="mx-auto h-[270px] max-w-[300px]"><Chart ariaLabel={`${ready} von ${total} Services bereit`} definition={definition} height={270} /></div>
                    <div className="mt-2 space-y-3">
                        {breakdown.map(([label, value, bar, textColor]) => (
                            <div className="rounded-2xl border border-white/[.055] bg-black/15 p-3.5" key={label}>
                                <div className="flex items-center justify-between gap-4"><span className="text-xs font-semibold text-zinc-500">{label}</span><strong className={`font-display text-sm ${textColor}`}>{value}</strong></div>
                                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[.045]"><div className={`h-full rounded-full ${bar}`} style={{ width: `${(value / total) * 100}%` }} /></div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="p-5 sm:p-6"><AdminEmptyState title="Keine Readiness-Daten" text="Ohne Docker-Inventar kann keine Bereitschaft berechnet werden." /></div>
            )}
        </section>
    );
}

function createReadinessDefinition(ready, total) {
    const background = pie([{ id: 'background', value: 1 }], { value: 'value' });
    const progress = [{ id: 'ready', value: ready, ring: 'readiness' }];
    const endDegrees = ready > 0 && total > 0 ? Math.max(8, (ready / total) * 360) : 0;
    return defineChart({
        scales: { x: null, y: null },
        marks: [
            polar({ marks: [radialArc(background, { id: 'readiness-background', key: 'id', innerRadius: 82, outerRadius: 96, fill: '#272930' })], scales: { angle: null, radius: null } }),
            polar({ startAngle: radialAngle(0), endAngle: radialAngle(endDegrees), scales: { angle: { scale: scaleLinear().domain([0, ready || 1]) }, radius: { scale: scaleBand().domain(['readiness']), range: [82, 96] } }, marks: [radialBarAngle(progress, { id: 'readiness-value', angle: 'value', radius: 'ring', key: 'id', fill: '#34d399', cornerRadius: 10 })] }),
            polar({ scales: { angle: { scale: scaleLinear().domain([0, 1]) }, radius: { scale: scaleLinear().domain([0, 1]) } }, marks: [
                radialText([{ id: 'total', angle: 0, radius: 0, text: `${ready}/${total}` }], { id: 'readiness-total', angle: 'angle', radius: 'radius', key: 'id', text: 'text', dy: -3, fill: '#fafafa', fontSize: 34, fontWeight: 800 }),
                radialText([{ id: 'label', angle: 0, radius: 0, text: 'bereit' }], { id: 'readiness-label', angle: 'angle', radius: 'radius', key: 'id', text: 'text', dy: 27, fill: '#71717a', fontSize: 12, fontWeight: 700 })
            ] })
        ],
        margin: 0,
        theme: { foreground: '#d4d4d8', muted: '#52525b', background: 'transparent', palette: ['#34d399'] }
    });
}

function radialAngle(degrees) {
    return ((90 - degrees) * Math.PI) / 180;
}

function LoadFunnel({ services }) {
    const [factor, setFactor] = useState('networking');
    const config = LOAD_FACTORS[factor];
    const rows = useMemo(() => aggregateStackLoad(services, config), [services, config]);
    const definition = useMemo(() => (rows.length ? createFunnelDefinition(rows, config.unit) : null), [rows, config.unit]);
    const highest = rows[0];

    return (
        <section className="overflow-hidden rounded-[28px] border border-white/[.07] bg-[#111218]">
            <div className="flex flex-col gap-5 border-b border-white/[.055] p-5 sm:px-6 xl:flex-row xl:items-start xl:justify-between">
                <div><div className="flex flex-wrap items-center gap-3"><p className="eyebrow">STACK-AUSLASTUNG</p><LiveBadge /></div><h3 className="mt-2 font-display text-xl font-bold">Auslastung nach Docker-Stack</h3><p className="mt-2 text-xs leading-5 text-zinc-600">Live-Ressourcenwerte der laufenden Container, absteigend nach Stack sortiert.</p></div>
                <div className="flex w-fit rounded-xl border border-white/[.07] bg-black/20 p-1" aria-label="Auslastungsfaktor wählen">
                    {Object.entries(LOAD_FACTORS).map(([key, option]) => (
                        <button className={`rounded-lg px-4 py-2 text-[10px] font-extrabold uppercase tracking-[.11em] transition ${factor === key ? 'bg-orange-500 text-white shadow-[0_8px_24px_rgba(249,115,22,.18)]' : 'text-zinc-600 hover:text-zinc-300'}`} key={key} onClick={() => setFactor(key)} type="button">{option.label}</button>
                    ))}
                </div>
            </div>
            {definition && highest ? (
                <div className="grid gap-0 2xl:grid-cols-[minmax(0,1.5fr)_360px]">
                    <div className="min-h-[470px] border-b border-white/[.055] p-4 sm:p-6 2xl:border-b-0 2xl:border-r"><Chart ariaLabel={`Stack-Auslastung nach ${config.label}`} definition={definition} height={420} /></div>
                    <aside className="p-5 sm:p-6">
                        <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-zinc-700">Höchste Auslastung</p>
                        <strong className="mt-3 block font-display text-2xl font-bold text-white">{highest.label}</strong>
                        <span className="mt-2 block font-display text-4xl font-black tracking-[-.05em] text-orange-300">{formatMetric(highest.value)} <small className="text-sm text-zinc-600">{config.unit}</small></span>
                        <div className="mt-6 space-y-3 border-t border-white/[.055] pt-5">
                            {rows.map((row, index) => (
                                <div className="flex items-center gap-3" key={row.id}><span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-500/[.07] text-[10px] font-black text-orange-300">{index + 1}</span><span className="min-w-0 flex-1 truncate text-xs font-semibold text-zinc-500">{row.label}</span><span className="text-xs font-bold text-zinc-300">{formatMetric(row.value)} {config.unit}</span></div>
                            ))}
                        </div>
                        <p className="mt-6 rounded-2xl border border-white/[.06] bg-black/15 p-4 text-[10px] leading-5 text-zinc-600">Quelle: nicht-streamender Docker-Stats-Snapshot. Netzwerk zeigt die seit dem vorherigen Backend-Poll gemessene Übertragungsrate.</p>
                    </aside>
                </div>
            ) : (
                <div className="p-5 sm:p-6"><AdminPendingState compact title={`${config.label}-Metrik wird ermittelt`} text={factor === 'networking' ? 'Für die Übertragungsrate werden zwei aufeinanderfolgende Docker-Snapshots benötigt.' : 'Die Docker Engine hat für diesen Faktor noch keine Messwerte geliefert.'} /></div>
            )}
        </section>
    );
}

function aggregateStackLoad(services, config) {
    const stacks = new Map();
    services.forEach((service) => {
        if (!service?.[config.available]) return;
        const stackName = service.stackName || 'Ohne Stack';
        const value = config.value(service);
        if (!Number.isFinite(value)) return;
        stacks.set(stackName, (stacks.get(stackName) || 0) + value);
    });
    return [...stacks.entries()]
        .map(([label, value]) => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'), label, value }))
        .sort((left, right) => right.value - left.value)
        .slice(0, 6);
}

function createFunnelDefinition(rows, unit) {
    const maximum = Math.max(...rows.map((row) => row.value), 1);
    const points = rows.flatMap((row, index) => {
        const startWidth = Math.max(0.24, row.value / maximum);
        const nextValue = rows[index + 1]?.value ?? row.value * 0.72;
        const endWidth = Math.max(0.18, nextValue / maximum);
        return [{ ...row, boundary: 'start', y: index + 0.04, x1: -startWidth, x2: startWidth }, { ...row, boundary: 'end', y: index + 0.96, x1: -endWidth, x2: endWidth }];
    });
    const labels = rows.map((row, index) => ({ ...row, x: 0, y: index + 0.5, text: `${row.label} · ${formatMetric(row.value)} ${unit}` }));
    return defineChart({
        marks: [
            areaX(points, { id: 'stack-load-funnel', x1: 'x1', x2: 'x2', y: 'y', z: 'id', color: 'id', key: (point) => `${point.id}:${point.boundary}`, fillOpacity: 0.96 }),
            text(labels, { id: 'stack-load-labels', x: 'x', y: 'y', text: 'text', key: 'id', anchor: 'middle', fill: '#fff7ed', fontSize: 12, fontWeight: 700 })
        ],
        scales: { x: { scale: scaleLinear().domain([-1.08, 1.08]), axis: false }, y: { scale: scaleLinear().domain([rows.length, 0]), axis: false } },
        color: { domain: rows.map((row) => row.id), range: ['#9a3412', '#c2410c', '#ea580c', '#f97316', '#fb923c', '#fdba74'] },
        margin: 12,
        theme: { foreground: '#fafafa', muted: '#71717a', background: 'transparent', palette: ['#c2410c', '#ea580c', '#f97316', '#fb923c', '#fdba74'] }
    });
}

function normalizeFlowGroups(groups) {
    return GROUP_DEFINITIONS.map((definition) => {
        const matches = groups.filter((group) => definition.aliases.some((alias) => alias.toLowerCase() === String(group.name).toLowerCase()));
        if (!matches.length) return null;
        const total = matches.reduce((sum, group) => sum + Number(group.monitoredServices || 0), 0);
        const healthy = matches.reduce((sum, group) => sum + Number(group.healthyServices || 0), 0);
        const responseSamples = matches.filter((group) => Number.isFinite(Number(group.averageResponseTimeMs)));
        const latency = responseSamples.length ? Math.round(responseSamples.reduce((sum, group) => sum + Number(group.averageResponseTimeMs), 0) / responseSamples.length) : 0;
        const states = matches.map((group) => normalizeVisualState(group.state));
        const status = states.every((state) => state === 'operational') ? 'operational' : states.every((state) => state === 'offline') ? 'offline' : 'degraded';
        return { ...definition, total, healthy, latency, hasResponse: healthy > 0 || latency > 0, status };
    }).filter(Boolean);
}

function normalizeVisualState(state) {
    if (String(state).toUpperCase() === 'UP') return 'operational';
    if (String(state).toUpperCase() === 'DEGRADED') return 'degraded';
    return 'offline';
}

function normalizeStackState(state) {
    const normalized = String(state).toUpperCase();
    if (normalized === 'UP') return 'ready';
    if (normalized === 'DEGRADED') return 'delayed';
    return 'offline';
}

function LiveBadge() {
    return <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[.07] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.14em] text-emerald-300">Live-Daten</span>;
}

function formatMetric(value) {
    return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(value);
}

function formatDateTime(value) {
    if (!value) return 'unbekannt';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'unbekannt';
    return new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'medium' }).format(date);
}

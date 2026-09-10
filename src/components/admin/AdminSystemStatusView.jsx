import { useCallback, useEffect, useMemo, useState } from 'react';
import { areaY, defineChart, deviation, dot, lineY, link, rollingWindow, text } from '@tanstack/charts';
import { pie, polar, radialArc } from '@tanstack/charts/polar';
import { Chart } from '@tanstack/charts/react/tooltip';
import {
    forceCenter,
    forceCollide,
    forceLink as d3ForceLink,
    forceManyBody,
    forceSimulation,
    forceX,
    forceY
} from 'd3-force';
import { scaleLinear, scaleUtc } from 'd3-scale';
import {
    FaBell,
    FaBox,
    FaChevronDown,
    FaCloud,
    FaCodeBranch,
    FaCreditCard,
    FaDatabase,
    FaHardDrive,
    FaHeartCrack,
    FaMemory,
    FaMicrochip,
    FaMinus,
    FaNetworkWired,
    FaPlus,
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

const SERVICE_STATES = {
    ready: { label: 'Bereit', className: 'border-emerald-400/15 bg-emerald-400/[.06] text-emerald-300' },
    delayed: { label: 'Verzögert', className: 'border-amber-400/15 bg-amber-400/[.06] text-amber-200' },
    offline: { label: 'Offline', className: 'border-red-400/15 bg-red-400/[.06] text-red-300' }
};

const IMAGE_STATES = {
    CURRENT: { label: 'Rollout aktuell', className: 'text-emerald-300', dot: 'bg-emerald-400' },
    UPDATING: { label: 'Image-Rollout läuft', className: 'text-amber-300', dot: 'bg-amber-400' },
    MISMATCH: { label: 'Image abweichend', className: 'text-red-300', dot: 'bg-red-400' },
    UNKNOWN: { label: 'Image-Stand unbekannt', className: 'text-zinc-500', dot: 'bg-zinc-600' }
};

const CAPACITY_METRICS = {
    cpu: { label: 'CPU-Auslastung', field: 'cpuUsagePercent', color: '#f97316' },
    memory: { label: 'RAM-Auslastung', field: 'memoryUsagePercent', color: '#38bdf8' },
    disk: { label: 'Datenträgerbelegung', field: 'diskUsagePercent', color: '#a78bfa' }
};

const LOAD_FACTORS = {
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
    },
    networking: {
        label: 'Networking',
        unit: 'kbit/s',
        available: 'networkMetricsAvailable',
        value: (service) => (Number(service.networkBytesPerSecond) * 8) / 1000
    }
};

const DONUT_COLORS = ['#c2410c', '#ea580c', '#f97316', '#fb923c', '#fdba74', '#38bdf8', '#a78bfa', '#34d399'];

export default function AdminSystemStatusView() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [scaleOperation, setScaleOperation] = useState({ serviceName: null, error: null });

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

    const handleScale = useCallback(
        async (service, replicas) => {
            const plural = replicas === 1 ? '' : 'e';
            if (!window.confirm(`${service.displayName} wirklich auf ${replicas} Replikat${plural} skalieren?`)) return;
            setScaleOperation({ serviceName: service.serviceName, error: null });
            try {
                await statusAdminApi.scaleService(service.serviceName, replicas);
                await new Promise((resolve) => window.setTimeout(resolve, 1200));
                await load(true);
                setScaleOperation({ serviceName: null, error: null });
            } catch (scaleError) {
                setScaleOperation({ serviceName: service.serviceName, error: scaleError.message });
            }
        },
        [load]
    );

    const flowGroups = useMemo(() => normalizeFlowGroups(data?.groups ?? []), [data?.groups]);

    if (loading && !data) {
        return (
            <AdminPendingState
                title="Live-Status wird geladen"
                text="Docker-Kapazitäten und SeriuxMod-Services werden abgerufen."
            />
        );
    }

    if (error && !data) {
        return <StatusError error={error} onRetry={() => load(false)} />;
    }

    return (
        <div className="space-y-6">
            <LiveStatusBar data={data} error={error} onRefresh={() => load(true)} refreshing={refreshing} />
            <PlatformCapacity platform={data?.platform} />
            <StatusFlow groups={flowGroups} />
            <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,.6fr)]">
                <TopologyCard topology={data?.topology} generatedAt={data?.generatedAt} />
                <ServiceLoadDonut services={data?.swarmServices ?? []} />
            </section>
            <ServiceInventory
                services={data?.swarmServices ?? []}
                stackName={data?.stackName ?? 'seriuxmod'}
                onScale={handleScale}
                scaleOperation={scaleOperation}
            />
        </div>
    );
}

function LiveStatusBar({ data, error, onRefresh, refreshing }) {
    const status = normalizeVisualState(data?.overallStatus);
    const visual = STATUS_VISUALS[status];
    const Icon = visual.icon;
    const readiness = data?.readiness ?? {};
    return (
        <div
            className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border ${visual.border} ${visual.background} px-4 py-3`}
        >
            <div className="flex min-w-0 items-center gap-3">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-black/20 ${visual.accent}`}>
                    <Icon className={status === 'degraded' ? 'animate-spin [animation-duration:1.8s]' : ''} />
                </span>
                <div className="min-w-0">
                    <b className="block text-xs text-zinc-200">
                        Stack {data?.stackName ?? 'seriuxmod'} · {readiness.ready ?? 0}/{readiness.total ?? 0} Services
                        bereit
                    </b>
                    <span className="block truncate text-[10px] text-zinc-600">
                        {error
                            ? `Letzte Live-Daten bleiben sichtbar · ${error.message}`
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
                text={
                    error?.status === 403
                        ? 'Für diesen Status-Snapshot fehlt die Administratorberechtigung.'
                        : error?.message
                }
            />
            <button
                className="mx-auto mt-4 block rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white"
                onClick={onRetry}
                type="button"
            >
                Erneut versuchen
            </button>
        </section>
    );
}

function PlatformCapacity({ platform }) {
    const [metricKey, setMetricKey] = useState('cpu');
    const metric = CAPACITY_METRICS[metricKey];
    const history = platform?.history ?? [];
    const definition = useMemo(
        () => (history.length >= 2 ? createCapacityDefinition(history, metric) : null),
        [history, metric]
    );

    if (!platform?.cpuCores) {
        return (
            <AdminPendingState
                title="Docker-Kapazität wird ermittelt"
                text="Die Docker Engine hat noch keine Host- und Node-Ressourcen geliefert."
            />
        );
    }

    const cards = [
        {
            label: 'CPU-Kapazität',
            value: `${platform.cpuCores} Cores`,
            detail: `${formatMetric(platform.cpuUsagePercent)} % durch Docker-Workloads`,
            icon: FaMicrochip,
            color: 'text-orange-300'
        },
        {
            label: 'Arbeitsspeicher',
            value: formatBytes(platform.memoryTotalBytes),
            detail: `${formatBytes(platform.memoryUsageBytes)} aktuell belegt`,
            icon: FaMemory,
            color: 'text-sky-300'
        },
        {
            label: 'Datenträger',
            value: formatBytes(platform.diskTotalBytes),
            detail: `${formatBytes(platform.diskAvailableBytes)} verfügbar`,
            icon: FaHardDrive,
            color: 'text-violet-300'
        },
        {
            label: 'Swarm Nodes',
            value: String(platform.nodeCount),
            detail: `${platform.managerCount} Manager · ${platform.engineName || 'Docker Engine'}`,
            icon: FaServer,
            color: 'text-emerald-300'
        }
    ];

    return (
        <section className="overflow-hidden rounded-[28px] border border-white/[.07] bg-[#111218]">
            <div className="flex flex-col gap-5 border-b border-white/[.055] p-5 sm:px-6 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <p className="eyebrow">DOCKER ENGINE</p>
                        <LiveBadge />
                    </div>
                    <h3 className="mt-2 font-display text-xl font-bold">Kapazität und Ressourcenverlauf</h3>
                    <p className="mt-2 text-xs leading-5 text-zinc-600">
                        Live-Werte aller Docker-Workloads auf {platform.operatingSystem || 'dem Host'} · Engine{' '}
                        {platform.engineVersion || 'unbekannt'}.
                    </p>
                </div>
                <MetricTabs options={CAPACITY_METRICS} selected={metricKey} onSelect={setMetricKey} />
            </div>

            <div className="grid gap-px bg-white/[.045] sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <article className="bg-[#111218] p-5 sm:px-6" key={card.label}>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-zinc-700">
                                        {card.label}
                                    </p>
                                    <strong className="mt-3 block font-display text-2xl font-black text-zinc-100">
                                        {card.value}
                                    </strong>
                                </div>
                                <span
                                    className={`grid h-10 w-10 place-items-center rounded-xl border border-white/[.06] bg-black/20 ${card.color}`}
                                >
                                    <Icon />
                                </span>
                            </div>
                            <p className="mt-2 text-[10px] font-semibold text-zinc-600">{card.detail}</p>
                        </article>
                    );
                })}
            </div>

            <div className="grid 2xl:grid-cols-[minmax(0,1fr)_300px]">
                <div className="min-h-[350px] border-b border-white/[.055] p-4 sm:p-6 2xl:border-b-0 2xl:border-r">
                    {definition ? (
                        <Chart
                            ariaLabel={`${metric.label} mit gleitendem Streuungsband`}
                            definition={definition}
                            height={310}
                        />
                    ) : (
                        <AdminPendingState
                            compact
                            title="Messhistorie wird aufgebaut"
                            text="Für das Streuungsband werden mindestens zwei Live-Snapshots benötigt."
                        />
                    )}
                </div>
                <aside className="p-5 sm:p-6">
                    <p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-zinc-700">
                        Aktueller Messpunkt
                    </p>
                    <strong className="mt-3 block font-display text-4xl font-black tracking-[-.05em] text-white">
                        {formatMetric(platform[metric.field])}
                        <small className="ml-1 text-sm text-zinc-600">%</small>
                    </strong>
                    <p className="mt-3 text-[10px] leading-5 text-zinc-600">
                        Die Fläche zeigt das gleitende Abweichungsband, die kräftige Linie den realen Messwert.
                    </p>
                    <div className="mt-6 space-y-3 border-t border-white/[.055] pt-5 text-[10px]">
                        <MetricLine label="Docker-Daten" value={formatBytes(platform.dockerDataUsedBytes)} />
                        <MetricLine label="Architektur" value={platform.architecture || 'Unbekannt'} />
                        <MetricLine label="Kernel" value={platform.kernelVersion || 'Unbekannt'} />
                        <MetricLine label="Swarm" value={platform.swarmState || 'Unbekannt'} />
                    </div>
                </aside>
            </div>
        </section>
    );
}

function MetricTabs({ options, selected, onSelect }) {
    return (
        <div className="flex w-fit rounded-xl border border-white/[.07] bg-black/20 p-1" aria-label="Metrik auswählen">
            {Object.entries(options).map(([key, option]) => (
                <button
                    className={`rounded-lg px-3 py-2 text-[9px] font-extrabold uppercase tracking-[.11em] transition ${selected === key ? 'bg-orange-500 text-white shadow-[0_8px_24px_rgba(249,115,22,.18)]' : 'text-zinc-600 hover:text-zinc-300'}`}
                    key={key}
                    onClick={() => onSelect(key)}
                    type="button"
                >
                    {option.label.replace('-Auslastung', '')}
                </button>
            ))}
        </div>
    );
}

function MetricLine({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-600">{label}</span>
            <b className="max-w-[170px] truncate text-right text-zinc-300" title={value}>
                {value}
            </b>
        </div>
    );
}

function createCapacityDefinition(history, metric) {
    const rows = history
        .map((point) => ({ recordedAt: new Date(point.recordedAt), value: Number(point[metric.field]) || 0 }))
        .filter((point) => Number.isFinite(point.recordedAt.getTime()))
        .sort((left, right) => left.recordedAt - right.recordedAt);
    const windowSize = Math.min(12, Math.max(2, rows.length));
    const bands = rollingWindow(rows, {
        size: windowSize,
        orderBy: 'recordedAt',
        anchor: 'end',
        partial: true,
        outputs: {
            meanValue: { value: 'value', reduce: 'mean' },
            valueDeviation: { value: 'value', reduce: deviation }
        }
    });

    return defineChart({
        marks: [
            areaY(bands, {
                id: `capacity-band-${metric.field}`,
                x: 'recordedAt',
                y1: (row) => Math.max(0, row.meanValue - (Number(row.valueDeviation) || 0) * 2),
                y2: (row) => Math.min(100, row.meanValue + (Number(row.valueDeviation) || 0) * 2),
                fill: metric.color,
                fillOpacity: 0.14
            }),
            lineY(bands, {
                id: `capacity-mean-${metric.field}`,
                x: 'recordedAt',
                y: 'meanValue',
                stroke: metric.color,
                strokeOpacity: 0.48,
                strokeWidth: 1.5
            }),
            lineY(rows, {
                id: `capacity-live-${metric.field}`,
                x: 'recordedAt',
                y: 'value',
                stroke: metric.color,
                strokeWidth: 2.5
            })
        ],
        scales: {
            x: { scale: scaleUtc(), axis: { label: 'Messzeit' } },
            y: { scale: scaleLinear().domain([0, 100]), grid: true, axis: { label: 'Auslastung (%)' } }
        },
        margin: { top: 14, right: 18, bottom: 50, left: 56 },
        theme: { foreground: '#d4d4d8', muted: '#52525b', background: 'transparent', palette: [metric.color] }
    });
}

function StatusFlow({ groups }) {
    return (
        <section className="overflow-hidden rounded-[28px] border border-white/[.07] bg-[#111218]">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[.055] p-5 sm:px-6">
                <div>
                    <p className="eyebrow">SERVICE FLOW</p>
                    <h3 className="mt-2 font-display text-xl font-bold">Verbindung durch die Infrastruktur</h3>
                    <p className="mt-2 text-xs leading-5 text-zinc-600">
                        Aggregierte Dienstgruppen in ihrer tatsächlichen Verbindungsreihenfolge.
                    </p>
                </div>
                <LiveBadge />
            </div>
            {groups.length ? (
                <div className="overflow-x-auto p-5 [scrollbar-color:#3f3f46_transparent] sm:p-6">
                    <div className="flex min-w-[1180px] items-center justify-between rounded-[24px] border border-white/[.05] bg-black/15 px-5 py-8">
                        {groups.map((service, index) => (
                            <div className="contents" key={service.name}>
                                <FlowNode service={service} />
                                {index < groups.length - 1 && (
                                    <FlowConnector index={index} status={groups[index + 1].status} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="p-5 sm:p-6">
                    <AdminEmptyState
                        title="Keine Dienstgruppen gemeldet"
                        text="Der Status-Snapshot enthält aktuell keine Flow-Gruppen."
                    />
                </div>
            )}
        </section>
    );
}

function FlowNode({ service }) {
    const visual = STATUS_VISUALS[service.status];
    const Icon = service.icon;
    const StatusIcon = visual.icon;
    return (
        <article
            className={`relative flex h-[168px] w-[160px] shrink-0 flex-col items-center justify-center rounded-[22px] border ${visual.border} ${visual.background} px-4 text-center`}
        >
            <span
                className={`grid h-11 w-11 place-items-center rounded-2xl border ${visual.border} bg-black/20 ${visual.accent}`}
            >
                <Icon />
            </span>
            <h4 className="mt-3 min-h-8 text-xs font-bold leading-4 text-zinc-100">{service.name}</h4>
            <div
                className={`mt-2 flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[.12em] ${visual.accent}`}
            >
                <StatusIcon className={service.status === 'degraded' ? 'animate-spin [animation-duration:1.8s]' : ''} />
                {visual.label}
            </div>
            <span className="mt-2 text-[10px] font-semibold text-zinc-600">
                {service.hasResponse
                    ? `${service.latency} ms · ${service.healthy}/${service.total}`
                    : `Keine Antwort · ${service.healthy}/${service.total}`}
            </span>
        </article>
    );
}

function FlowConnector({ index, status }) {
    const visual = STATUS_VISUALS[status];
    return (
        <svg
            aria-hidden="true"
            className={`h-8 w-10 shrink-0 ${visual.accent}`}
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

function ServiceInventory({ services, stackName, onScale, scaleOperation }) {
    return (
        <section className="overflow-hidden rounded-[28px] border border-white/[.07] bg-[#111218]">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[.055] p-5 sm:px-6">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <p className="eyebrow">SWARM INVENTAR</p>
                        <LiveBadge />
                    </div>
                    <h3 className="mt-2 font-display text-xl font-bold">Services im Stack „{stackName}“</h3>
                    <p className="mt-2 text-xs leading-5 text-zinc-600">
                        Images, laufende Container, Nodes und Replikate direkt aus der Docker Engine API.
                    </p>
                </div>
                <span className="rounded-full border border-orange-400/15 bg-orange-400/[.06] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.14em] text-orange-300">
                    {services.length} Services
                </span>
            </div>

            {scaleOperation.error && (
                <div className="border-b border-red-400/15 bg-red-400/[.045] px-6 py-3 text-[10px] font-semibold text-red-300">
                    Skalierung fehlgeschlagen: {scaleOperation.error}
                </div>
            )}

            {services.length ? (
                <div className="divide-y divide-white/[.05]">
                    {services.map((service) => (
                        <ServiceRow
                            busy={scaleOperation.serviceName === service.serviceName}
                            key={service.serviceName}
                            onScale={onScale}
                            service={service}
                        />
                    ))}
                </div>
            ) : (
                <div className="p-5 sm:p-6">
                    <AdminEmptyState
                        title="Kein SeriuxMod-Service gefunden"
                        text={`Die Docker Engine meldet aktuell keine Services für den Stack ${stackName}.`}
                    />
                </div>
            )}
        </section>
    );
}

function ServiceRow({ service, busy, onScale }) {
    const [expanded, setExpanded] = useState(false);
    const [draftReplicas, setDraftReplicas] = useState(Number(service.desiredReplicas) || 0);
    const state = SERVICE_STATES[normalizeStackState(service.state)];
    const imageState = IMAGE_STATES[service.imageStatus] ?? IMAGE_STATES.UNKNOWN;
    const tasks = service.tasks ?? [];
    const runningTasks = tasks.filter((task) => String(task.currentState).toLowerCase() === 'running');
    const nodes = [...new Set(runningTasks.map((task) => task.nodeName).filter(Boolean))];

    useEffect(() => {
        setDraftReplicas(Number(service.desiredReplicas) || 0);
    }, [service.desiredReplicas]);

    const changeDraft = (delta) => {
        const minimum = Number(service.minimumReplicas) || 0;
        const maximum = Number(service.maximumReplicas) || 10;
        setDraftReplicas((current) => Math.max(minimum, Math.min(maximum, current + delta)));
    };

    return (
        <article className="transition hover:bg-white/[.012]">
            <div className="grid gap-5 px-5 py-5 sm:px-6 xl:grid-cols-[minmax(220px,1.25fr)_minmax(260px,1.5fr)_minmax(150px,.7fr)_minmax(210px,.9fr)_auto] xl:items-center">
                <div className="min-w-0">
                    <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[.06] bg-black/20 text-orange-300">
                            <FaBox />
                        </span>
                        <div className="min-w-0">
                            <strong className="block truncate text-sm text-zinc-100">{service.displayName}</strong>
                            <code className="mt-1 block truncate text-[9px] text-zinc-700">{service.serviceName}</code>
                        </div>
                    </div>
                </div>

                <div className="min-w-0">
                    <code className="block truncate text-[10px] font-semibold text-zinc-400" title={service.image}>
                        {service.image || 'Kein Image gemeldet'}
                    </code>
                    <div
                        className={`mt-2 flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[.11em] ${imageState.className}`}
                    >
                        <span className={`h-1.5 w-1.5 rounded-full ${imageState.dot}`} />
                        {imageState.label}
                        {service.imageTag && (
                            <span className="normal-case tracking-normal text-zinc-700">· Tag {service.imageTag}</span>
                        )}
                    </div>
                </div>

                <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[.12em] text-zinc-700">Node</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {nodes.length ? (
                            nodes.map((node) => (
                                <span
                                    className="rounded-lg border border-white/[.06] bg-black/15 px-2 py-1 text-[9px] font-semibold text-zinc-400"
                                    key={node}
                                >
                                    {node}
                                </span>
                            ))
                        ) : (
                            <span className="text-[10px] text-zinc-700">Nicht platziert</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4 xl:justify-start">
                    <div>
                        <p className="text-[9px] font-extrabold uppercase tracking-[.12em] text-zinc-700">
                            Replikate online / soll
                        </p>
                        <strong className="mt-1 block font-display text-lg text-zinc-200">
                            {service.runningReplicas}/{service.desiredReplicas}
                        </strong>
                    </div>
                    {service.scalingSupported ? (
                        <ReplicaControl
                            busy={busy}
                            changed={draftReplicas !== Number(service.desiredReplicas)}
                            onApply={() => onScale(service, draftReplicas)}
                            onDecrease={() => changeDraft(-1)}
                            onIncrease={() => changeDraft(1)}
                            value={draftReplicas}
                        />
                    ) : service.swarmMode === 'global' ? (
                        <span className="max-w-32 text-right text-[9px] leading-4 text-emerald-400/70">
                            Automatisch je Manager-Node
                        </span>
                    ) : (
                        <span className="text-[9px] text-zinc-700">Nicht skalierbar</span>
                    )}
                </div>

                <div className="flex items-center justify-between gap-3 xl:justify-end">
                    <span
                        className={`w-fit rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider ${state.className}`}
                    >
                        {state.label}
                    </span>
                    <button
                        aria-label="Containerdetails anzeigen"
                        className="grid h-9 w-9 place-items-center rounded-xl border border-white/[.06] text-zinc-600 transition hover:border-orange-400/20 hover:text-orange-300"
                        onClick={() => setExpanded((value) => !value)}
                        type="button"
                    >
                        <FaChevronDown className={`transition ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="border-t border-white/[.045] bg-black/10 px-5 py-4 sm:px-6">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-zinc-700">
                            Container und Tasks
                        </p>
                        <span className="text-[9px] text-zinc-700">Modus: {service.swarmMode}</span>
                    </div>
                    {tasks.length ? (
                        <div className="grid gap-2 lg:grid-cols-2">
                            {tasks.map((task) => (
                                <div
                                    className="rounded-2xl border border-white/[.055] bg-[#111218] p-3.5"
                                    key={task.taskId}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <code className="truncate text-[10px] font-bold text-zinc-300">
                                            {task.containerName || `Task ${shortId(task.taskId)}`}
                                        </code>
                                        <span
                                            className={`h-2 w-2 shrink-0 rounded-full ${String(task.currentState).toLowerCase() === 'running' ? 'bg-emerald-400' : 'bg-amber-400'}`}
                                        />
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-[9px] text-zinc-600">
                                        <span>
                                            Slot <b className="text-zinc-400">{task.slot ?? '–'}</b>
                                        </span>
                                        <span>
                                            Node <b className="text-zinc-400">{task.nodeName || 'Unbekannt'}</b>
                                        </span>
                                        <span>
                                            Status <b className="text-zinc-400">{task.currentState}</b>
                                        </span>
                                        <span>
                                            ID <b className="text-zinc-400">{shortId(task.containerId)}</b>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <AdminEmptyState
                            title="Keine Tasks vorhanden"
                            text="Docker hat für diesen Service noch keine Tasks gemeldet."
                        />
                    )}
                </div>
            )}
        </article>
    );
}

function ReplicaControl({ value, changed, busy, onDecrease, onIncrease, onApply }) {
    return (
        <div className="flex items-center gap-1 rounded-xl border border-white/[.07] bg-black/20 p-1">
            <button
                aria-label="Ein Replikat weniger"
                className="grid h-7 w-7 place-items-center rounded-lg text-zinc-600 transition hover:bg-white/[.04] hover:text-zinc-200 disabled:opacity-40"
                disabled={busy}
                onClick={onDecrease}
                type="button"
            >
                <FaMinus className="text-[9px]" />
            </button>
            <span className="min-w-6 text-center font-display text-xs font-bold text-zinc-200">{value}</span>
            <button
                aria-label="Ein Replikat mehr"
                className="grid h-7 w-7 place-items-center rounded-lg text-zinc-600 transition hover:bg-white/[.04] hover:text-zinc-200 disabled:opacity-40"
                disabled={busy}
                onClick={onIncrease}
                type="button"
            >
                <FaPlus className="text-[9px]" />
            </button>
            <button
                className="ml-1 rounded-lg bg-orange-500 px-2.5 py-2 text-[8px] font-extrabold uppercase tracking-wider text-white transition disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600"
                disabled={!changed || busy}
                onClick={onApply}
                type="button"
            >
                {busy ? '…' : 'Setzen'}
            </button>
        </div>
    );
}

function TopologyCard({ topology, generatedAt }) {
    const graph = useMemo(() => buildTopologyLayout(topology), [topology, generatedAt]);
    const definition = useMemo(() => (graph.nodes.length ? createTopologyDefinition(graph) : null), [graph]);

    return (
        <section className="overflow-hidden rounded-[28px] border border-white/[.07] bg-[#111218]">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[.055] p-5 sm:px-6">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <p className="eyebrow">SERVICE TOPOLOGIE</p>
                        <LiveBadge />
                    </div>
                    <h3 className="mt-2 font-display text-xl font-bold">Wie SeriuxMod verbunden ist</h3>
                    <p className="mt-2 text-xs leading-5 text-zinc-600">
                        Live-Struktur aus Services, Overlay-Netzwerken, Swarm-Nodes, MongoDB und Redis.
                    </p>
                </div>
                <FaCodeBranch className="mt-1 text-orange-300" />
            </div>
            {definition ? (
                <>
                    <div className="min-h-[430px] p-4 sm:p-6">
                        <Chart
                            ariaLabel="Netzwerkstruktur des SeriuxMod Docker-Stacks"
                            definition={definition}
                            height={390}
                        />
                    </div>
                    <div className="flex flex-wrap gap-5 border-t border-white/[.055] px-5 py-3 text-[9px] font-bold text-zinc-600 sm:px-6">
                        <TopologyLegend color="bg-orange-400" label="Service" />
                        <TopologyLegend color="bg-sky-400" label="Overlay-Netzwerk" />
                        <TopologyLegend color="bg-emerald-400" label="Swarm Node" />
                        <TopologyLegend color="bg-violet-400" label="MongoDB Node" />
                        <TopologyLegend color="bg-rose-400" label="Redis Cache" />
                        <TopologyLegend color="bg-red-400" label="Beeinträchtigter Service" />
                    </div>
                </>
            ) : (
                <div className="p-5 sm:p-6">
                    <AdminPendingState
                        compact
                        title="Topologie wird ermittelt"
                        text="Docker hat noch keine Netzwerk- oder Task-Zuordnungen gemeldet."
                    />
                </div>
            )}
        </section>
    );
}

function TopologyLegend({ color, label }) {
    return (
        <span className="flex items-center gap-2">
            <i className={`h-2 w-2 rounded-full ${color}`} />
            {label}
        </span>
    );
}

function buildTopologyLayout(topology) {
    const sourceNodes = topology?.nodes ?? [];
    const knownNodeIds = new Set(sourceNodes.map((node) => node.id));
    const layoutNodes = sourceNodes.map((node) => ({ ...node }));
    const layoutLinks = (topology?.links ?? [])
        .filter((edge) => knownNodeIds.has(edge.source) && knownNodeIds.has(edge.target))
        .map((edge) => ({ ...edge }));

    if (!layoutNodes.length) return { nodes: [], links: [], xDomain: [-1, 1], yDomain: [-1, 1] };

    const simulation = forceSimulation(layoutNodes)
        .force(
            'link',
            d3ForceLink(layoutLinks)
                .id((node) => node.id)
                .distance((edge) => (edge.type === 'deployment' ? 92 : edge.type === 'network' ? 64 : 105))
                .strength(0.58)
        )
        .force(
            'charge',
            forceManyBody().strength((node) => (node.type === 'service' ? -390 : -240))
        )
        .force('center', forceCenter(0, 0))
        .force(
            'collision',
            forceCollide((node) => (node.type === 'service' ? 39 : node.type === 'database' ? 31 : 27)).strength(0.95)
        )
        .force('x', forceX(0).strength(0.035))
        .force('y', forceY(0).strength(0.035))
        .stop();
    simulation.tick(360);

    const nodes = layoutNodes.map((node) => ({
        ...node,
        x: finiteCoordinate(node.x),
        y: finiteCoordinate(node.y),
        visualGroup: topologyVisualGroup(node)
    }));
    const links = layoutLinks.map((edge) => ({
        ...edge,
        sourceId: edge.source.id,
        targetId: edge.target.id,
        x1: finiteCoordinate(edge.source.x),
        y1: finiteCoordinate(edge.source.y),
        x2: finiteCoordinate(edge.target.x),
        y2: finiteCoordinate(edge.target.y)
    }));

    return {
        nodes,
        links,
        xDomain: paddedDomain(nodes.map((node) => node.x)),
        yDomain: paddedDomain(nodes.map((node) => node.y))
    };
}

function createTopologyDefinition(graph) {
    return defineChart({
        marks: [
            link(graph.links, {
                id: 'seriuxmod-topology-links',
                x1: 'x1',
                y1: 'y1',
                x2: 'x2',
                y2: 'y2',
                stroke: (edge) =>
                    edge.type === 'deployment'
                        ? '#34d399'
                        : edge.type === 'database'
                          ? '#a78bfa'
                          : edge.type === 'cache'
                            ? '#fb7185'
                            : '#52525b',
                strokeOpacity: 0.5,
                strokeWidth: (edge) => (edge.type === 'network' ? 2 : 1.4)
            }),
            dot(graph.nodes, {
                id: 'seriuxmod-topology-nodes',
                x: 'x',
                y: 'y',
                color: 'visualGroup',
                r: (node) =>
                    node.type === 'service'
                        ? 11
                        : node.type === 'node'
                          ? 9
                          : node.type === 'database' || node.type === 'cache'
                            ? 8
                            : 7,
                stroke: '#111218',
                strokeWidth: 3
            }),
            text(graph.nodes, {
                id: 'seriuxmod-topology-labels',
                x: 'x',
                y: 'y',
                text: 'label',
                dy: (node) => (node.type === 'service' ? -19 : -15),
                fill: '#d4d4d8',
                fontSize: 9,
                fontWeight: 700
            })
        ],
        scales: {
            x: { scale: scaleLinear().domain(graph.xDomain), axis: false },
            y: { scale: scaleLinear().domain(graph.yDomain), axis: false }
        },
        guides: false,
        color: {
            domain: ['service', 'service-degraded', 'service-offline', 'network', 'node', 'database', 'cache'],
            range: ['#f97316', '#fbbf24', '#f87171', '#38bdf8', '#34d399', '#a78bfa', '#fb7185']
        },
        margin: 32,
        theme: {
            foreground: '#d4d4d8',
            muted: '#52525b',
            background: 'transparent',
            palette: ['#f97316', '#38bdf8', '#34d399']
        }
    });
}

function topologyVisualGroup(node) {
    if (node.type !== 'service') return node.type;
    const state = normalizeStackState(node.state);
    return state === 'ready' ? 'service' : state === 'delayed' ? 'service-degraded' : 'service-offline';
}

function ServiceLoadDonut({ services }) {
    const [factor, setFactor] = useState('cpu');
    const config = LOAD_FACTORS[factor];
    const rows = useMemo(() => aggregateServiceLoad(services, config), [services, config]);
    const definition = useMemo(() => (rows.length ? createDonutDefinition(rows) : null), [rows]);
    const total = rows.reduce((sum, row) => sum + row.value, 0);

    return (
        <section className="overflow-hidden rounded-[28px] border border-white/[.07] bg-[#111218]">
            <div className="border-b border-white/[.055] p-5 sm:px-6">
                <div className="flex flex-wrap items-center gap-3">
                    <p className="eyebrow">STACK-AUSLASTUNG</p>
                    <LiveBadge />
                </div>
                <h3 className="mt-2 font-display text-xl font-bold">Ressourcenanteile je Service</h3>
                <p className="mt-2 text-xs leading-5 text-zinc-600">
                    Verteilung innerhalb des SeriuxMod-Stacks als gerundetes Donut-Diagramm.
                </p>
                <div className="mt-5">
                    <MetricTabs options={LOAD_FACTORS} selected={factor} onSelect={setFactor} />
                </div>
            </div>
            {definition ? (
                <div className="p-5 sm:p-6">
                    <div className="relative mx-auto h-[280px] max-w-[320px]">
                        <Chart
                            ariaLabel={`${config.label}-Verteilung der SeriuxMod-Services`}
                            definition={definition}
                            height={280}
                        />
                        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                            <div>
                                <span className="block text-[9px] font-extrabold uppercase tracking-[.13em] text-zinc-700">
                                    Gesamt
                                </span>
                                <strong className="mt-1 block font-display text-2xl font-black text-white">
                                    {formatMetric(total)}
                                </strong>
                                <span className="text-[9px] font-semibold text-zinc-600">{config.unit}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 space-y-2.5">
                        {rows.map((row, index) => (
                            <div className="flex items-center gap-3" key={row.id}>
                                <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
                                />
                                <span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-zinc-500">
                                    {row.label}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-300">
                                    {formatMetric(row.value)} {config.unit}
                                </span>
                                <span className="w-10 text-right text-[9px] text-zinc-700">
                                    {formatMetric((row.value / total) * 100)} %
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="p-5 sm:p-6">
                    <AdminPendingState
                        compact
                        title={`${config.label}-Metrik wird ermittelt`}
                        text={
                            factor === 'networking'
                                ? 'Für die Netzwerkgeschwindigkeit werden zwei Docker-Snapshots benötigt.'
                                : 'Die Docker Engine hat für diese Metrik noch keine verwertbaren Werte geliefert.'
                        }
                    />
                </div>
            )}
        </section>
    );
}

function aggregateServiceLoad(services, config) {
    return services
        .filter((service) => service?.[config.available])
        .map((service) => ({
            id: service.serviceName,
            label: readableServiceName(service.serviceName),
            value: config.value(service)
        }))
        .filter((row) => Number.isFinite(row.value) && row.value > 0.001)
        .sort((left, right) => right.value - left.value)
        .slice(0, 8);
}

function createDonutDefinition(rows) {
    const arcs = pie(rows, { value: 'value', gapAngle: (Math.PI / 180) * 3 });
    return defineChart({
        marks: [
            polar({
                radiusRatio: 0.82,
                marks: [
                    radialArc(arcs, {
                        id: 'seriuxmod-service-load',
                        key: 'id',
                        innerRadius: ({ radius }) => radius * 0.58,
                        cornerRadius: 8,
                        color: 'id'
                    })
                ],
                scales: { angle: null, radius: null }
            })
        ],
        scales: { x: null, y: null },
        color: { domain: rows.map((row) => row.id), range: DONUT_COLORS },
        margin: 0,
        theme: { foreground: '#d4d4d8', muted: '#52525b', background: 'transparent', palette: DONUT_COLORS }
    });
}

function normalizeFlowGroups(groups) {
    return GROUP_DEFINITIONS.map((definition) => {
        const matches = groups.filter((group) =>
            definition.aliases.some((alias) => alias.toLowerCase() === String(group.name).toLowerCase())
        );
        if (!matches.length) return null;
        const total = matches.reduce((sum, group) => sum + Number(group.monitoredServices || 0), 0);
        const healthy = matches.reduce((sum, group) => sum + Number(group.healthyServices || 0), 0);
        const responseSamples = matches.filter((group) => Number.isFinite(Number(group.averageResponseTimeMs)));
        const latency = responseSamples.length
            ? Math.round(
                  responseSamples.reduce((sum, group) => sum + Number(group.averageResponseTimeMs), 0) /
                      responseSamples.length
              )
            : 0;
        const states = matches.map((group) => normalizeVisualState(group.state));
        const status = states.every((state) => state === 'operational')
            ? 'operational'
            : states.every((state) => state === 'offline')
              ? 'offline'
              : 'degraded';
        return { ...definition, total, healthy, latency, hasResponse: healthy > 0 || latency > 0, status };
    }).filter(Boolean);
}

function normalizeVisualState(state) {
    const normalized = String(state || '').toUpperCase();
    if (normalized === 'UP' || normalized === 'OPERATIONAL' || normalized === 'OK') return 'operational';
    if (normalized === 'DEGRADED' || normalized === 'DELAYED' || normalized === 'PARTIAL') return 'degraded';
    return 'offline';
}

function normalizeStackState(state) {
    const normalized = String(state || '').toUpperCase();
    if (normalized === 'UP' || normalized === 'READY' || normalized === 'RUNNING') return 'ready';
    if (normalized === 'DEGRADED' || normalized === 'DELAYED' || normalized === 'PARTIAL' || normalized === 'UPDATING')
        return 'delayed';
    return 'offline';
}

function LiveBadge() {
    return (
        <span className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[.055] px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-[.13em] text-emerald-300">
            <i className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live
        </span>
    );
}

function readableServiceName(serviceName) {
    return String(serviceName || '')
        .replace(/^seriuxmod_/, '')
        .replaceAll('-', ' ');
}

function formatDateTime(value) {
    if (!value) return 'unbekannt';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? 'unbekannt'
        : new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'medium' }).format(date);
}

function formatBytes(value) {
    const bytes = Number(value);
    if (!Number.isFinite(bytes) || bytes <= 0) return 'Nicht verfügbar';
    const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
    const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: unitIndex > 2 ? 1 : 0 }).format(bytes / 1024 ** unitIndex)} ${units[unitIndex]}`;
}

function formatMetric(value) {
    const number = Number(value);
    return Number.isFinite(number)
        ? new Intl.NumberFormat('de-DE', { maximumFractionDigits: number < 10 ? 2 : 1 }).format(number)
        : '–';
}

function shortId(value) {
    const textValue = String(value || '');
    return textValue ? textValue.slice(0, 12) : '–';
}

function finiteCoordinate(value) {
    return Number.isFinite(value) ? value : 0;
}

function paddedDomain(values) {
    if (!values.length) return [-1, 1];
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const span = Math.max(1, maximum - minimum);
    return [minimum - span * 0.2, maximum + span * 0.2];
}

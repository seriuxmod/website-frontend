import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    FaArrowRotateRight,
    FaCheck,
    FaCircleExclamation,
    FaClock,
    FaTriangleExclamation,
    FaWifi
} from 'react-icons/fa6';

const STATUS_API = 'https://api.seriuxmod.net/api/v1/status/summary';
const REFRESH_INTERVAL = 30_000;

const excludedMonitorIds = new Set(['seriuxmod-homepage', 'gcore-api', 'nexus', 'docker-registry', 'docker-swarm-api']);

const groupPresentation = {
    'API Services': { name: 'DNS Auflösung', order: 10 },
    'DNS Auflösung': { name: 'DNS Auflösung', order: 10 },
    'DNS AuflÃ¶sung': { name: 'DNS Auflösung', order: 10 },
    seriuxmod: { name: 'API Gateway', order: 20 },
    'API Gateway': { name: 'API Gateway', order: 20 },
    CDN: { name: 'CDN', order: 30 },
    'Databases & Cache': { name: 'Database', order: 40 },
    Database: { name: 'Database', order: 40 },
    Payments: { name: 'Payment Gateway', order: 50 },
    'Payment Gateway': { name: 'Payment Gateway', order: 50 },
    Notifications: { name: 'Notification Service', order: 60 },
    'Notification Service': { name: 'Notification Service', order: 60 }
};

const groupStates = {
    operational: {
        label: 'Operational',
        circle: 'border-emerald-400/70 bg-emerald-400/[.08] text-emerald-300 shadow-[0_0_45px_rgba(52,211,153,.14)]'
    },
    degraded: {
        label: 'Beeinträchtigt',
        circle: 'border-amber-400/70 bg-amber-400/[.08] text-amber-300 shadow-[0_0_45px_rgba(251,191,36,.14)]'
    },
    outage: {
        label: 'Nicht erreichbar',
        circle: 'border-red-500/70 bg-red-500/[.08] text-red-300 shadow-[0_0_45px_rgba(239,68,68,.14)]'
    }
};

const overallContent = {
    UP: {
        title: 'Alle Systeme operational',
        copy: 'Alle überwachten SeriuxMod-Dienste arbeiten ohne bekannte Einschränkungen.',
        icon: FaCheck,
        panel: 'border-emerald-400/15 bg-emerald-400/[.045] text-emerald-300'
    },
    DEGRADED: {
        title: 'Einige Systeme sind beeinträchtigt',
        copy: 'Mindestens ein Dienst arbeitet aktuell nicht mit voller Leistung.',
        icon: FaTriangleExclamation,
        panel: 'border-amber-400/15 bg-amber-400/[.045] text-amber-300'
    },
    CRITICAL: {
        title: 'Eine Störung wurde erkannt',
        copy: 'Mindestens ein wichtiger Dienst ist aktuell nicht erreichbar.',
        icon: FaCircleExclamation,
        panel: 'border-red-400/15 bg-red-500/[.045] text-red-300'
    },
    UNKNOWN: {
        title: 'Status wird ermittelt',
        copy: 'Die aktuellen Systemdaten konnten noch nicht vollständig geladen werden.',
        icon: FaClock,
        panel: 'border-zinc-500/15 bg-white/[.025] text-zinc-300'
    }
};

const formatDate = (value) => {
    if (!value) return 'Noch nicht aktualisiert';
    return new Intl.DateTimeFormat('de-DE', {
        dateStyle: 'medium',
        timeStyle: 'medium'
    }).format(new Date(value));
};

export default function SystemStatus() {
    const [state, setState] = useState({ data: null, loading: true, refreshing: false, error: '' });

    const load = useCallback(async (background = false, signal) => {
        setState((current) => ({
            ...current,
            loading: background ? current.loading : !current.data,
            refreshing: background || Boolean(current.data),
            error: ''
        }));
        try {
            const response = await fetch(STATUS_API, { signal, cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            setState({ data, loading: false, refreshing: false, error: '' });
        } catch (error) {
            if (error.name === 'AbortError') return;
            setState((current) => ({
                ...current,
                loading: false,
                refreshing: false,
                error: 'Der Systemstatus konnte gerade nicht geladen werden.'
            }));
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        load(false, controller.signal);
        const interval = window.setInterval(() => load(true, controller.signal), REFRESH_INTERVAL);
        return () => {
            controller.abort();
            window.clearInterval(interval);
        };
    }, [load]);

    const publicServices = useMemo(
        () =>
            (state.data?.services ?? []).filter(
                (service) => service.group !== 'Development' && !excludedMonitorIds.has(service.monitorId)
            ),
        [state.data]
    );

    const groups = useMemo(() => {
        const grouped = new Map();
        for (const service of publicServices) {
            const presentation = groupPresentation[service.group] ?? {
                name: service.group,
                order: service.groupOrder ?? 999
            };
            if (!grouped.has(presentation.name)) {
                grouped.set(presentation.name, { services: [], order: presentation.order });
            }
            grouped.get(presentation.name).services.push(service);
        }
        return [...grouped.entries()]
            .map(([name, group]) => {
                const { services } = group;
                const onlineServices = services.filter((service) => service.state === 'UP').length;
                const status =
                    onlineServices === services.length ? 'operational' : onlineServices === 0 ? 'outage' : 'degraded';
                const averagePing = Math.round(
                    services.reduce((total, service) => total + (Number(service.responseTimeMs) || 0), 0) /
                        services.length
                );
                return {
                    name,
                    services,
                    onlineServices,
                    status,
                    averagePing,
                    order: group.order
                };
            })
            .sort((left, right) => left.order - right.order || left.name.localeCompare(right.name, 'de'));
    }, [publicServices]);

    const healthyServices = publicServices.filter((service) => service.state === 'UP').length;
    const calculatedOverallStatus = groups.some((group) => group.status === 'outage')
        ? 'CRITICAL'
        : groups.some((group) => group.status === 'degraded')
          ? 'DEGRADED'
          : publicServices.length
            ? 'UP'
            : 'UNKNOWN';

    const overall = overallContent[calculatedOverallStatus] ?? overallContent.UNKNOWN;
    const OverallIcon = overall.icon;

    return (
        <main className="min-h-[80vh] overflow-hidden px-5 pb-24 pt-36 text-white sm:pt-44 lg:px-10">
            <div className="mx-auto max-w-6xl">
                <header className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="eyebrow">SERIUXMOD INFRASTRUKTUR</p>
                        <h1 className="mt-3 font-display text-4xl font-bold tracking-[-.05em] sm:text-6xl">
                            Systemstatus
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500">
                            Live-Überblick über APIs, Datenbanken und zentrale SeriuxMod-Dienste.
                        </p>
                    </div>
                    <button
                        className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/[.08] bg-white/[.035] px-4 py-3 text-xs font-bold text-zinc-300 transition hover:border-orange-400/30 hover:text-white disabled:opacity-50"
                        disabled={state.refreshing}
                        onClick={() => load(true)}
                        type="button"
                    >
                        <FaArrowRotateRight className={state.refreshing ? 'animate-spin' : ''} />
                        Aktualisieren
                    </button>
                </header>

                <section
                    className={`mt-10 flex flex-col gap-5 rounded-[30px] border p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8 ${overall.panel}`}
                    aria-live="polite"
                >
                    <div className="flex items-start gap-4">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-black/20">
                            <OverallIcon />
                        </span>
                        <div>
                            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">{overall.title}</h2>
                            <p className="mt-2 text-sm leading-6 text-zinc-400">{overall.copy}</p>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-xs text-zinc-500">
                        <FaClock /> {formatDate(state.data?.generatedAt)}
                    </div>
                </section>

                {state.error && (
                    <div className="mt-6 rounded-2xl border border-red-400/15 bg-red-500/[.05] px-5 py-4 text-sm text-red-300">
                        {state.error}
                    </div>
                )}

                {state.loading ? (
                    <StatusSkeleton />
                ) : (
                    <>
                        <section className="mt-12">
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <p className="eyebrow">LIVE-MONITORING</p>
                                    <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Dienste</h2>
                                </div>
                                <span className="text-xs text-zinc-600">
                                    {healthyServices} von {publicServices.length} operational
                                </span>
                            </div>

                            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                                {groups.map((group) => (
                                    <ServiceGroup group={group} key={group.name} />
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}

function ServiceGroup({ group }) {
    const visual = groupStates[group.status];

    return (
        <article className="flex min-h-56 flex-col items-center rounded-3xl border border-white/[.07] bg-[#111218] px-4 py-5 text-center shadow-[0_18px_45px_rgba(0,0,0,.18)]">
            <h3 className="min-h-8 text-sm font-bold text-zinc-100">{group.name}</h3>
            <div
                className={`mt-3 grid h-20 w-20 place-items-center rounded-full border-2 ${visual.circle}`}
                aria-label={`${group.name}: ${visual.label}`}
                title={visual.label}
            >
                <FaWifi className="text-2xl" aria-hidden="true" />
            </div>
            <p className="mt-4 font-display text-2xl font-bold tracking-[-.04em] text-white">
                {group.averagePing} <span className="text-sm text-zinc-500">ms</span>
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[.14em] text-zinc-600">Ø Antwortzeit</p>
            <div className="mt-4 flex w-full items-center justify-between gap-2 border-t border-white/[.06] pt-3 text-[9px]">
                <span className="text-zinc-600">
                    {group.onlineServices}/{group.services.length} online
                </span>
                <span className="truncate font-bold text-zinc-400">{visual.label}</span>
            </div>
        </article>
    );
}

function StatusSkeleton() {
    return (
        <div
            className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
            aria-label="Systemstatus wird geladen"
        >
            {[0, 1, 2, 3, 4, 5].map((item) => (
                <div className="h-56 animate-pulse rounded-3xl border border-white/[.05] bg-white/[.025]" key={item} />
            ))}
        </div>
    );
}

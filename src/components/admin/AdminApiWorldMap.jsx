import { useEffect, useMemo, useRef, useState } from 'react';
import { Chart } from '@tanstack/charts/react/tooltip';
import { defineChart } from '@tanstack/charts';
import { geoShape } from '@tanstack/charts/geo';
import { tooltip as chartTooltip } from '@tanstack/charts/tooltip';
import { geoEqualEarth } from 'd3-geo';
import { scaleQuantize } from 'd3-scale';
import { feature } from 'topojson-client';
import worldAtlas from 'world-atlas/countries-110m.json';
import { FaArrowTrendUp, FaBolt, FaCodeBranch, FaGlobe, FaLocationDot } from 'react-icons/fa6';

const WORLD_SPHERE = { type: 'Sphere' };
const WORLD_COUNTRIES = feature(worldAtlas, worldAtlas.objects.countries).features;
const MAP_MARGIN = 12;

const API_ORIGIN = {
    id: 'fra',
    name: 'Frankfurt',
    country: 'Germany',
    detail: 'SeriuxMod API Gateway',
    requests: 'Zielregion',
    coordinates: [8.6821, 50.1109]
};

const TRAFFIC_ROUTES = [
    {
        id: 'iad',
        name: 'Virginia',
        country: 'United States of America',
        detail: '/api/v1/user',
        requests: '3.420 Anfragen',
        coordinates: [-77.0369, 38.9072]
    },
    {
        id: 'gru',
        name: 'São Paulo',
        country: 'Brazil',
        detail: '/api/v1/player',
        requests: '1.180 Anfragen',
        coordinates: [-46.6333, -23.5505]
    },
    {
        id: 'dxb',
        name: 'Dubai',
        country: 'United Arab Emirates',
        detail: '/oauth2/token',
        requests: '2.140 Anfragen',
        coordinates: [55.2708, 25.2048]
    },
    {
        id: 'sin',
        name: 'Singapur',
        country: 'Singapore',
        detail: '/api/v1/store',
        requests: '2.890 Anfragen',
        coordinates: [103.8198, 1.3521]
    },
    {
        id: 'nrt',
        name: 'Tokio',
        country: 'Japan',
        detail: '/api/v1/status',
        requests: '1.760 Anfragen',
        coordinates: [139.6917, 35.6895]
    },
    {
        id: 'syd',
        name: 'Sydney',
        country: 'Australia',
        detail: '/api/v1/social',
        requests: '1.410 Anfragen',
        coordinates: [151.2093, -33.8688]
    }
];

const API_METRICS = [
    { label: 'Anfragen / Minute', value: '12.800', icon: FaBolt },
    { label: 'Erfolgsquote', value: '99,94 %', icon: FaArrowTrendUp },
    { label: 'Ø Antwortzeit', value: '47 ms', icon: FaCodeBranch },
    { label: 'Aktive Regionen', value: '6', icon: FaGlobe }
];

const CHOROPLETH_COLORS = ['#15171d', '#1e1b19', '#2d1d17', '#4d2416', '#813312', '#d94a0b', '#ff721b'];
const ROUTE_COUNTRY_TRAFFIC = new Map([
    ['Germany', 5_100],
    ...TRAFFIC_ROUTES.map((route) => [route.country, Number.parseInt(route.requests.replaceAll('.', ''), 10)])
]);

const countryTraffic = (country, index) => {
    const countryName = country.properties?.name || `Region ${index + 1}`;
    const configuredTraffic = ROUTE_COUNTRY_TRAFFIC.get(countryName);
    const backgroundTraffic =
        120 +
        (Array.from(countryName).reduce((total, character) => total + character.codePointAt(0), index * 17) % 920);

    return {
        ...country,
        properties: {
            ...country.properties,
            name: countryName,
            testTraffic: configuredTraffic || backgroundTraffic
        }
    };
};

const BASE_TRAFFIC_COUNTRIES = WORLD_COUNTRIES.map(countryTraffic);

function createTrafficChart(activeCountry) {
    const countries = BASE_TRAFFIC_COUNTRIES.map((country) => ({
        ...country,
        properties: {
            ...country.properties,
            testTraffic:
                country.properties.name === activeCountry
                    ? Math.max(6_500, country.properties.testTraffic + 2_400)
                    : country.properties.testTraffic
        }
    }));

    const projection = {
        type: geoEqualEarth,
        fit: 'sphere'
    };

    return defineChart(
        {
            marks: [
                geoShape(countries, {
                    id: 'api-country-traffic',
                    key: (country) => country.id,
                    projection,
                    color: (country) => country.properties.testTraffic,
                    stroke: '#503126',
                    strokeOpacity: 0.62,
                    strokeWidth: 0.6
                }),
                geoShape([WORLD_SPHERE], {
                    id: 'api-world-frame',
                    projection,
                    fill: 'none',
                    stroke: '#9a4e2e',
                    strokeOpacity: 0.38,
                    strokeWidth: 0.8
                })
            ],
            scales: {
                x: null,
                y: null
            },
            color: {
                scale: scaleQuantize,
                range: CHOROPLETH_COLORS
            },
            margin: MAP_MARGIN
        },
        {
            keyboard: true,
            tooltip: {
                use: chartTooltip,
                format: ({ datum }) => {
                    const properties = datum?.properties;
                    if (!properties?.name) return 'Globale API-Region';
                    return `${properties.name} · ${Number(properties.testTraffic || 0).toLocaleString('de-DE')} Test-Anfragen/min`;
                }
            }
        }
    );
}

function routePath(route, origin) {
    const centerX = (route.x + origin.x) / 2;
    const distance = Math.abs(route.x - origin.x);
    const centerY = Math.min(route.y, origin.y) - Math.max(38, distance * 0.14);
    return `M ${route.x} ${route.y} Q ${centerX} ${centerY} ${origin.x} ${origin.y}`;
}

function tooltipPosition(location, mapSize) {
    return {
        left: `${Math.min(mapSize.width - 90, Math.max(90, location.x))}px`,
        top: `${Math.min(mapSize.height - 24, Math.max(74, location.y))}px`
    };
}

export default function AdminApiWorldMap() {
    const mapRef = useRef(null);
    const [activeLocation, setActiveLocation] = useState(null);
    const [activeRouteIndex, setActiveRouteIndex] = useState(0);
    const [mapSize, setMapSize] = useState({ width: 1000, height: 430 });
    const activeRoute = TRAFFIC_ROUTES[activeRouteIndex];
    const highlightedRouteId =
        activeLocation && activeLocation.id !== API_ORIGIN.id ? activeLocation.id : activeRoute.id;
    const chartDefinition = useMemo(() => createTrafficChart(activeRoute.country), [activeRoute.country]);

    const projectedMap = useMemo(() => {
        const projection = geoEqualEarth().fitExtent(
            [
                [MAP_MARGIN, MAP_MARGIN],
                [mapSize.width - MAP_MARGIN, mapSize.height - MAP_MARGIN]
            ],
            WORLD_SPHERE
        );
        const project = (location) => {
            const [x, y] = projection(location.coordinates) || [0, 0];
            return { ...location, x, y };
        };

        return {
            origin: project(API_ORIGIN),
            routes: TRAFFIC_ROUTES.map(project)
        };
    }, [mapSize]);

    useEffect(() => {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (reducedMotion.matches) return undefined;

        const interval = window.setInterval(() => {
            setActiveRouteIndex((current) => (current + 1) % TRAFFIC_ROUTES.length);
        }, 2400);

        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        const element = mapRef.current;
        if (!element) return undefined;

        const updateSize = () => {
            const width = Math.max(320, Math.round(element.getBoundingClientRect().width));
            setMapSize({ width, height: width < 640 ? 350 : 430 });
        };
        const observer = new ResizeObserver(updateSize);
        observer.observe(element);
        updateSize();

        return () => observer.disconnect();
    }, []);

    return (
        <section className="overflow-hidden rounded-[28px] border border-white/[.07] bg-[#0e1015] shadow-[0_24px_80px_rgba(0,0,0,.18)]">
            <div className="flex flex-wrap items-start justify-between gap-4 px-5 pb-1 pt-5 sm:px-7 sm:pt-7">
                <div>
                    <p className="eyebrow">GLOBALER API-TRAFFIC</p>
                    <h3 className="mt-2 font-display text-2xl font-bold">API Overview</h3>
                    <p className="mt-2 text-xs text-zinc-600">
                        Länderbasierte API-Vorschau mit TanStack Charts und animierten Request-Routen.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-amber-400/20 bg-amber-400/[.07] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.15em] text-amber-200">
                        Testdatensatz
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[.05] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.15em] text-emerald-300">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> Simulation aktiv
                    </span>
                </div>
            </div>

            <div
                ref={mapRef}
                className="api-world-map relative mt-3 overflow-hidden"
                style={{ height: `${mapSize.height}px` }}
            >
                <div className="api-tanstack-world-map absolute inset-0">
                    <Chart
                        ariaLabel="Länderbasierte Weltkarte mit simuliertem API-Traffic"
                        definition={chartDefinition}
                        height={mapSize.height}
                    />
                </div>
                <div className="api-world-map-scan" />

                <svg
                    className="api-map-overlay absolute inset-0 h-full w-full"
                    viewBox={`0 0 ${mapSize.width} ${mapSize.height}`}
                    role="img"
                    aria-label="Animierte Verbindungen eingehender API-Anfragen zum Gateway Frankfurt"
                >
                    <defs>
                        <filter id="api-map-glow" x="-80%" y="-80%" width="260%" height="260%">
                            <feGaussianBlur stdDeviation="5" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <linearGradient id="api-route-gradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0" stopColor="#ffb26f" />
                            <stop offset="1" stopColor="#f04400" />
                        </linearGradient>
                    </defs>

                    <g aria-hidden="true">
                        {projectedMap.routes.map((route, index) => {
                            const path = routePath(route, projectedMap.origin);
                            return (
                                <g
                                    className={`api-map-connection ${route.id === highlightedRouteId ? 'is-active' : ''}`}
                                    key={route.id}
                                >
                                    <path className="api-map-route-base" d={path} />
                                    <path
                                        className="api-map-route"
                                        d={path}
                                        pathLength="100"
                                        style={{ '--route-delay': `${index * -0.34}s` }}
                                    />
                                    <path
                                        className="api-map-route-packet"
                                        d={path}
                                        pathLength="100"
                                        style={{ '--packet-delay': `${index * -0.41}s` }}
                                    />
                                    <path
                                        className="api-map-route-packet api-map-route-packet-secondary"
                                        d={path}
                                        pathLength="100"
                                        style={{ '--packet-delay': `${index * -0.41 - 1.35}s` }}
                                    />
                                </g>
                            );
                        })}
                    </g>

                    <g className="api-map-radar" aria-hidden="true">
                        {[0, 1, 2].map((ring) => (
                            <circle
                                cx={projectedMap.origin.x}
                                cy={projectedMap.origin.y}
                                r="11"
                                key={ring}
                                style={{ '--radar-delay': `${ring * 0.9}s` }}
                            />
                        ))}
                    </g>

                    <g
                        className="api-map-location api-map-location-origin"
                        tabIndex="0"
                        role="button"
                        aria-label={`${API_ORIGIN.name}: ${API_ORIGIN.detail}`}
                        onFocus={() => setActiveLocation(projectedMap.origin)}
                        onBlur={() => setActiveLocation(null)}
                        onMouseEnter={() => setActiveLocation(projectedMap.origin)}
                        onMouseLeave={() => setActiveLocation(null)}
                    >
                        <circle
                            className="api-map-pulse"
                            cx={projectedMap.origin.x}
                            cy={projectedMap.origin.y}
                            r="15"
                        />
                        <circle
                            cx={projectedMap.origin.x}
                            cy={projectedMap.origin.y}
                            r="6"
                            fill="#ff7a24"
                            filter="url(#api-map-glow)"
                        />
                        <circle cx={projectedMap.origin.x} cy={projectedMap.origin.y} r="2" fill="#fff4ea" />
                    </g>

                    {projectedMap.routes.map((route, index) => (
                        <g
                            className={`api-map-location ${route.id === highlightedRouteId ? 'is-active' : ''}`}
                            key={route.id}
                            tabIndex="0"
                            role="button"
                            aria-label={`${route.name}: ${route.requests}`}
                            onFocus={() => setActiveLocation(route)}
                            onBlur={() => setActiveLocation(null)}
                            onMouseEnter={() => setActiveLocation(route)}
                            onMouseLeave={() => setActiveLocation(null)}
                        >
                            <circle
                                className="api-map-pulse"
                                cx={route.x}
                                cy={route.y}
                                r="12"
                                style={{ '--route-delay': `${index * 0.72}s` }}
                            />
                            <circle cx={route.x} cy={route.y} r="4.5" fill="#fb923c" />
                            <circle cx={route.x} cy={route.y} r="1.5" fill="#fff7ed" />
                        </g>
                    ))}
                </svg>

                <div className="pointer-events-none absolute left-5 top-5 z-10 flex items-center gap-2 rounded-full border border-white/[.07] bg-[#0b0c10]/80 px-3 py-2 text-[9px] font-bold uppercase tracking-[.15em] text-zinc-500 backdrop-blur-xl sm:left-7">
                    <FaLocationDot className="text-orange-300" /> Gateway Frankfurt
                </div>

                <div className="api-map-activity pointer-events-none absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-orange-400/15 bg-[#090a0e]/85 px-3 py-2 text-[9px] font-bold uppercase tracking-[.12em] text-zinc-500 backdrop-blur-xl sm:flex">
                    <span className="api-map-activity-dot" />
                    <span className="text-zinc-300">{activeRoute.name}</span>
                    <span>→</span>
                    <span className="text-orange-300">Frankfurt</span>
                    <span className="text-zinc-700">{activeRoute.detail}</span>
                </div>

                {activeLocation && (
                    <div
                        className="api-map-tooltip pointer-events-none absolute z-20 w-44 rounded-2xl border border-orange-400/20 bg-[#111218]/95 p-3 shadow-2xl backdrop-blur-xl"
                        style={tooltipPosition(activeLocation, mapSize)}
                    >
                        <b className="block text-xs text-white">{activeLocation.name}</b>
                        <span className="mt-1 block text-[10px] font-semibold text-orange-300">
                            {activeLocation.requests}
                        </span>
                        <small className="mt-1 block truncate text-[9px] text-zinc-600">{activeLocation.detail}</small>
                    </div>
                )}
            </div>

            <div className="grid border-t border-white/[.06] sm:grid-cols-2 xl:grid-cols-4">
                {API_METRICS.map(({ label, value, icon: Icon }) => (
                    <div
                        className="flex items-center gap-3 border-b border-white/[.05] px-5 py-4 last:border-b-0 xl:border-b-0 xl:border-r xl:last:border-r-0 sm:[&:nth-child(odd)]:border-r"
                        key={label}
                    >
                        <Icon className="w-4 shrink-0 text-orange-300" />
                        <div className="min-w-0">
                            <b className="block font-display text-lg text-white">{value}</b>
                            <span className="block truncate text-[9px] font-bold uppercase tracking-[.12em] text-zinc-600">
                                {label} · Test
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

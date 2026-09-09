import { useEffect, useState } from 'react';
import { FaArrowTrendUp, FaBolt, FaCodeBranch, FaGlobe, FaLocationDot } from 'react-icons/fa6';

const API_ORIGIN = {
    id: 'fra',
    name: 'Frankfurt',
    detail: 'SeriuxMod API Gateway',
    requests: 'Zielregion',
    x: 506,
    y: 174
};

const TRAFFIC_ROUTES = [
    { id: 'iad', name: 'Virginia', detail: '/api/v1/user', requests: '3.420 Anfragen', x: 270, y: 192 },
    { id: 'gru', name: 'São Paulo', detail: '/api/v1/player', requests: '1.180 Anfragen', x: 368, y: 360 },
    { id: 'dxb', name: 'Dubai', detail: '/oauth2/token', requests: '2.140 Anfragen', x: 615, y: 240 },
    { id: 'sin', name: 'Singapur', detail: '/api/v1/store', requests: '2.890 Anfragen', x: 762, y: 320 },
    { id: 'nrt', name: 'Tokio', detail: '/api/v1/status', requests: '1.760 Anfragen', x: 851, y: 205 },
    { id: 'syd', name: 'Sydney', detail: '/api/v1/social', requests: '1.410 Anfragen', x: 870, y: 392 }
];

const API_METRICS = [
    { label: 'Anfragen / Minute', value: '12.800', icon: FaBolt },
    { label: 'Erfolgsquote', value: '99,94 %', icon: FaArrowTrendUp },
    { label: 'Ø Antwortzeit', value: '47 ms', icon: FaCodeBranch },
    { label: 'Aktive Regionen', value: '6', icon: FaGlobe }
];

const CONTINENTS = [
    'M72 134 96 93 157 75 201 91 236 118 250 154 226 173 216 205 181 211 163 239 132 225 124 196 92 185 65 157Z',
    'M266 229 310 235 343 269 351 304 383 327 368 381 347 430 323 457 304 417 295 373 273 330 256 279Z',
    'M421 124 456 105 501 112 521 139 509 164 472 174 444 157Z',
    'M459 186 514 184 553 211 570 253 551 292 537 348 508 395 480 354 473 303 449 267 430 224Z',
    'M524 121 578 90 650 82 711 97 758 88 822 106 884 132 929 166 914 203 875 215 848 247 805 241 773 272 737 253 704 281 665 257 630 231 595 209 553 181Z',
    'M786 338 828 319 883 327 925 358 913 401 875 424 826 409 796 378Z',
    'M939 424 955 418 965 438 951 451Z',
    'M281 66 302 39 333 43 350 72 326 91 296 85Z'
];

function routePath(route) {
    const centerX = (route.x + API_ORIGIN.x) / 2;
    const distance = Math.abs(route.x - API_ORIGIN.x);
    const centerY = Math.min(route.y, API_ORIGIN.y) - Math.max(42, distance * 0.16);
    return `M ${route.x} ${route.y} Q ${centerX} ${centerY} ${API_ORIGIN.x} ${API_ORIGIN.y}`;
}

function tooltipPosition(location) {
    return {
        left: `${Math.min(92, Math.max(8, location.x / 10))}%`,
        top: `${Math.min(90, Math.max(14, (location.y - 34) / 4.2))}%`
    };
}

export default function AdminApiWorldMap() {
    const [activeLocation, setActiveLocation] = useState(null);
    const [activeRouteIndex, setActiveRouteIndex] = useState(0);
    const activeRoute = TRAFFIC_ROUTES[activeRouteIndex];
    const highlightedRouteId =
        activeLocation && activeLocation.id !== API_ORIGIN.id ? activeLocation.id : activeRoute.id;

    useEffect(() => {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (reducedMotion.matches) return undefined;

        const interval = window.setInterval(() => {
            setActiveRouteIndex((current) => (current + 1) % TRAFFIC_ROUTES.length);
        }, 2400);

        return () => window.clearInterval(interval);
    }, []);

    return (
        <section className="overflow-hidden rounded-[28px] border border-white/[.07] bg-[#0e1015] shadow-[0_24px_80px_rgba(0,0,0,.18)]">
            <div className="flex flex-wrap items-start justify-between gap-4 px-5 pb-1 pt-5 sm:px-7 sm:pt-7">
                <div>
                    <p className="eyebrow">GLOBALER API-TRAFFIC</p>
                    <h3 className="mt-2 font-display text-2xl font-bold">API Overview</h3>
                    <p className="mt-2 text-xs text-zinc-600">
                        Geografische Vorschau eingehender Anfragen an die SeriuxMod-Endpunkte.
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

            <div className="api-world-map relative mt-3 min-h-[370px] overflow-hidden sm:min-h-[430px]">
                <div className="api-world-map-scan" />
                <svg
                    className="absolute inset-0 h-full w-full"
                    viewBox="0 38 1000 424"
                    preserveAspectRatio="xMidYMid slice"
                    role="img"
                    aria-label="Animierte Weltkarte mit simulierten API-Anfragen"
                >
                    <defs>
                        <pattern id="api-map-dots" width="8" height="8" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="1.25" fill="rgba(212,212,216,.46)">
                                <animate
                                    attributeName="opacity"
                                    values=".48;.92;.48"
                                    dur="4.8s"
                                    repeatCount="indefinite"
                                />
                            </circle>
                        </pattern>
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
                        <linearGradient id="api-land-sweep-gradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0" stopColor="#f97316" stopOpacity="0" />
                            <stop offset=".5" stopColor="#fb923c" stopOpacity=".52" />
                            <stop offset="1" stopColor="#f97316" stopOpacity="0" />
                        </linearGradient>
                        <clipPath id="api-world-land-clip">
                            {CONTINENTS.map((path, index) => (
                                <path d={path} key={index} />
                            ))}
                        </clipPath>
                    </defs>

                    <g className="api-world-map-land-base">
                        {CONTINENTS.map((path, index) => (
                            <path d={path} key={index} />
                        ))}
                    </g>
                    <g className="api-world-map-land">
                        {CONTINENTS.map((path, index) => (
                            <path d={path} fill="url(#api-map-dots)" key={index} />
                        ))}
                    </g>
                    <rect
                        className="api-map-land-sweep"
                        x="-420"
                        y="32"
                        width="300"
                        height="440"
                        fill="url(#api-land-sweep-gradient)"
                        clipPath="url(#api-world-land-clip)"
                    />

                    <g aria-hidden="true">
                        {TRAFFIC_ROUTES.map((route, index) => {
                            const path = routePath(route);
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
                                cx={API_ORIGIN.x}
                                cy={API_ORIGIN.y}
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
                        onFocus={() => setActiveLocation(API_ORIGIN)}
                        onBlur={() => setActiveLocation(null)}
                        onMouseEnter={() => setActiveLocation(API_ORIGIN)}
                        onMouseLeave={() => setActiveLocation(null)}
                    >
                        <circle className="api-map-pulse" cx={API_ORIGIN.x} cy={API_ORIGIN.y} r="15" />
                        <circle cx={API_ORIGIN.x} cy={API_ORIGIN.y} r="6" fill="#ff7a24" filter="url(#api-map-glow)" />
                        <circle cx={API_ORIGIN.x} cy={API_ORIGIN.y} r="2" fill="#fff4ea" />
                    </g>

                    {TRAFFIC_ROUTES.map((route, index) => (
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

                <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/[.07] bg-[#0b0c10]/80 px-3 py-2 text-[9px] font-bold uppercase tracking-[.15em] text-zinc-500 backdrop-blur-xl sm:left-7">
                    <FaLocationDot className="text-orange-300" /> Gateway Frankfurt
                </div>

                <div className="api-map-activity pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-orange-400/15 bg-[#090a0e]/85 px-3 py-2 text-[9px] font-bold uppercase tracking-[.12em] text-zinc-500 backdrop-blur-xl sm:flex">
                    <span className="api-map-activity-dot" />
                    <span className="text-zinc-300">{activeRoute.name}</span>
                    <span>→</span>
                    <span className="text-orange-300">Frankfurt</span>
                    <span className="text-zinc-700">{activeRoute.detail}</span>
                </div>

                {activeLocation && (
                    <div
                        className="api-map-tooltip pointer-events-none absolute z-10 w-44 rounded-2xl border border-orange-400/20 bg-[#111218]/95 p-3 shadow-2xl backdrop-blur-xl"
                        style={tooltipPosition(activeLocation)}
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

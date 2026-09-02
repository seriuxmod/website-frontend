import { useState } from 'react';
import {
    FaBolt,
    FaCheck,
    FaDownload,
    FaGear,
    FaHouse,
    FaLayerGroup,
    FaNewspaper,
    FaPlay,
    FaServer,
    FaUserGroup,
    FaWifi
} from 'react-icons/fa6';

const navigation = [
    { id: 'home', label: 'Start', icon: FaHouse },
    { id: 'modules', label: 'Module', icon: FaLayerGroup },
    { id: 'social', label: 'Social', icon: FaUserGroup },
    { id: 'news', label: 'News', icon: FaNewspaper },
    { id: 'downloads', label: 'Downloads', icon: FaDownload }
];

const modules = [
    { id: 'performance', name: 'Performance-Profil', detail: 'Optimiert Rendering und Speicher', icon: FaBolt },
    { id: 'hud', name: 'HUD Editor', detail: 'Dein Interface, deine Anordnung', icon: FaLayerGroup },
    { id: 'cosmetics', name: 'Cosmetics Sync', detail: 'Look auf allen Servern synchron', icon: FaCheck },
    { id: 'presence', name: 'Discord Presence', detail: 'Zeigt deinen aktuellen Spielstatus', icon: FaWifi }
];

const headlineStats = [
    { value: '212', label: 'Module im Modpack', note: 'Aktueller Launcher-Stand' },
    { value: '1.21.4', label: 'Minecraft Version', note: 'Produktionsprofil' },
    { value: '5.2.0', label: 'Modpack Release', note: 'Stable Channel' },
    { value: '1,84 GB', label: 'Paketgröße', note: 'Einmaliger Download' }
];

function HomePanel({ previewRunning, setPreviewRunning }) {
    return (
        <div className="launcher-preview-stage relative flex min-h-[440px] flex-col justify-between overflow-hidden p-6 sm:p-8">
            <div className="relative z-10 flex flex-wrap items-center gap-2">
                {[
                    ['MODPACK', 'v5.2.0'],
                    ['MODS', '212'],
                    ['MINECRAFT', '1.21.4'],
                    ['STATUS', 'STABLE']
                ].map(([label, value], index) => (
                    <div
                        key={label}
                        className={`launcher-preview-chip ${index === 0 ? 'launcher-preview-chip-active' : ''}`}
                    >
                        <span>{label}</span>
                        <strong>{value}</strong>
                    </div>
                ))}
            </div>

            <div className="relative z-10 mx-auto max-w-xl py-10 text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[.07] px-3 py-1.5 text-[9px] font-black uppercase tracking-[.18em] text-emerald-300">
                    <i className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" /> Spielbereit
                </span>
                <p className="mt-6 font-mono text-[10px] uppercase tracking-[.3em] text-orange-400">SeriuxMod Client</p>
                <h3 className="mt-3 font-display text-4xl font-black uppercase tracking-[-.04em] text-white sm:text-6xl">
                    Deine Welt.
                    <br />
                    <span className="text-orange-500">Dein Setup.</span>
                </h3>
                <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-zinc-400">
                    Das aktuelle Performance-Profil ist installiert und bereit für deinen nächsten Start.
                </p>
            </div>

            <div className="relative z-10 mx-auto w-full max-w-lg">
                <button
                    type="button"
                    className={`launcher-play-button ${previewRunning ? 'launcher-play-button-active' : ''}`}
                    onClick={() => setPreviewRunning((running) => !running)}
                    aria-pressed={previewRunning}
                >
                    <FaPlay />
                    <span>
                        <strong>{previewRunning ? 'Vorschau aktiv' : 'Spielen'}</strong>
                        <small>Modpack v5.2.0 · reine UI-Demo</small>
                    </span>
                </button>
                <p className="mt-3 text-center text-[9px] uppercase tracking-[.16em] text-zinc-600">
                    Diese Vorschau startet keinen echten Client
                </p>
            </div>
        </div>
    );
}

function ModulesPanel({ enabledModules, toggleModule }) {
    return (
        <div className="min-h-[440px] p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[.22em] text-orange-400">
                        Client-Konfiguration
                    </p>
                    <h3 className="mt-2 font-display text-3xl font-bold text-white">Deine Module.</h3>
                    <p className="mt-2 text-sm text-zinc-500">Aktiviere die Beispielmodule innerhalb der Vorschau.</p>
                </div>
                <span className="rounded-xl border border-white/[.07] bg-black/20 px-4 py-2 text-xs text-zinc-400">
                    {enabledModules.size} von {modules.length} aktiv
                </span>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {modules.map(({ id, name, detail, icon: Icon }) => {
                    const enabled = enabledModules.has(id);
                    return (
                        <button
                            type="button"
                            key={id}
                            className={`launcher-module-card ${enabled ? 'launcher-module-card-active' : ''}`}
                            onClick={() => toggleModule(id)}
                            aria-pressed={enabled}
                        >
                            <span className="launcher-module-icon">
                                <Icon />
                            </span>
                            <span className="min-w-0 flex-1 text-left">
                                <strong>{name}</strong>
                                <small>{detail}</small>
                            </span>
                            <i className={`launcher-module-toggle ${enabled ? 'launcher-module-toggle-active' : ''}`}>
                                <span />
                            </i>
                        </button>
                    );
                })}
            </div>
            <div className="mt-5 rounded-2xl border border-orange-500/10 bg-orange-500/[.035] p-4 text-xs leading-6 text-zinc-500">
                Die Einstellungen dienen nur als interaktive Designvorschau und werden nicht gespeichert.
            </div>
        </div>
    );
}

function SocialPanel() {
    const friends = [
        { name: 'Lena', server: 'Adventure SMP', color: '#f97316' },
        { name: 'Tom', server: 'Im Launcher', color: '#38bdf8' },
        { name: 'Mia', server: 'Zuletzt vor 4 Std.', color: '#a78bfa', offline: true }
    ];
    return (
        <div className="min-h-[440px] p-6 sm:p-8">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[.22em] text-orange-400">Social Hub</p>
            <h3 className="mt-2 font-display text-3xl font-bold text-white">Gemeinsam verbunden.</h3>
            <p className="mt-2 text-sm text-zinc-500">Freunde, Serverstatus und Einladungen auf einen Blick.</p>
            <div className="mt-8 grid gap-3">
                {friends.map((friend) => (
                    <div key={friend.name} className="launcher-friend-row">
                        <span className="launcher-friend-avatar" style={{ color: friend.color }}>
                            {friend.name[0]}
                        </span>
                        <span className="min-w-0 flex-1">
                            <strong>{friend.name}</strong>
                            <small>{friend.server}</small>
                        </span>
                        <i
                            className={`h-2.5 w-2.5 rounded-full ${friend.offline ? 'bg-zinc-700' : 'bg-emerald-400'}`}
                        />
                    </div>
                ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="launcher-mini-stat">
                    <strong>2</strong>
                    <span>Freunde online</span>
                </div>
                <div className="launcher-mini-stat">
                    <strong>1</strong>
                    <span>Aktive Session</span>
                </div>
            </div>
        </div>
    );
}

function NewsPanel() {
    const news = [
        [
            'ANKÜNDIGUNG',
            'Backend-Migration läuft',
            'Die Datenversorgung wird auf das neue SeriuxMod-Backend umgestellt.'
        ],
        ['UPDATE', 'Modpack 5.2.0 ist live', 'Performance-Profil, neue Module und mehrere Crashfixes sind verfügbar.'],
        ['EVENT', 'Community-Event am Wochenende', 'Gemeinsam spielen, Aufgaben lösen und neue Spieler kennenlernen.']
    ];
    return (
        <div className="min-h-[440px] p-6 sm:p-8">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[.22em] text-orange-400">Launcher News</p>
            <h3 className="mt-2 font-display text-3xl font-bold text-white">Immer auf dem Laufenden.</h3>
            <div className="mt-8 space-y-3">
                {news.map(([category, title, text], index) => (
                    <article key={title} className="launcher-news-row">
                        <span>{String(index + 1).padStart(2, '0')}</span>
                        <div>
                            <small>{category}</small>
                            <h4>{title}</h4>
                            <p>{text}</p>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}

function DownloadsPanel() {
    return (
        <div className="min-h-[440px] p-6 sm:p-8">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[.22em] text-orange-400">Downloads</p>
            <h3 className="mt-2 font-display text-3xl font-bold text-white">Alles installiert.</h3>
            <p className="mt-2 text-sm text-zinc-500">Der Launcher hält Client und Modpack automatisch aktuell.</p>
            <div className="mt-8 space-y-4">
                {[
                    ['Modpack 5.2.0', '1,84 GB', 'Minecraft 1.21.4'],
                    ['Launcher 1.4.1', '86 MB', 'Stable Channel']
                ].map(([name, size, detail]) => (
                    <div key={name} className="rounded-2xl border border-white/[.07] bg-black/20 p-5">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <strong className="block text-sm text-white">{name}</strong>
                                <span className="mt-1 block text-xs text-zinc-600">{detail}</span>
                            </div>
                            <span className="text-xs text-zinc-500">{size}</span>
                        </div>
                        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[.06]">
                            <i className="block h-full w-full rounded-full bg-gradient-to-r from-orange-600 to-amber-400" />
                        </div>
                        <span className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                            <FaCheck /> Installiert
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function LauncherShowcase() {
    const [activeView, setActiveView] = useState('home');
    const [enabledModules, setEnabledModules] = useState(
        () => new Set(['performance', 'hud', 'cosmetics', 'presence'])
    );
    const [previewRunning, setPreviewRunning] = useState(false);

    const toggleModule = (id) => {
        setEnabledModules((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div className="mt-12">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {headlineStats.map((stat, index) => (
                    <article key={stat.label} className="launcher-headline-stat" style={{ '--stat-index': index }}>
                        <span>{stat.note}</span>
                        <strong>{stat.value}</strong>
                        <p>{stat.label}</p>
                    </article>
                ))}
            </div>

            <div className="launcher-showcase-shell mt-5 overflow-hidden rounded-[30px] border border-white/[.09] bg-[#0c0d11]">
                <header className="flex h-14 items-center justify-between border-b border-white/[.07] bg-[#111217] px-4 sm:px-5">
                    <div className="flex items-center gap-3">
                        <img className="h-8 w-8 object-contain" src="/logo.png" alt="" />
                        <div>
                            <strong className="block font-display text-xs font-black uppercase tracking-[.12em] text-white">
                                Seriux Launcher
                            </strong>
                            <span className="block text-[8px] uppercase tracking-[.22em] text-zinc-600">
                                Interaktive Vorschau
                            </span>
                        </div>
                    </div>
                    <div className="hidden items-center gap-2 text-[9px] uppercase tracking-[.16em] text-emerald-400 sm:flex">
                        <FaWifi /> Verbindung online
                    </div>
                    <div className="flex items-center gap-1.5" aria-hidden="true">
                        <i className="h-2.5 w-2.5 rounded-full bg-white/10" />
                        <i className="h-2.5 w-2.5 rounded-full bg-white/10" />
                        <i className="h-2.5 w-2.5 rounded-full bg-orange-500/70" />
                    </div>
                </header>

                <div className="grid lg:grid-cols-[190px_minmax(0,1fr)_230px]">
                    <aside className="border-b border-white/[.06] bg-[#0f1014] p-3 lg:border-b-0 lg:border-r lg:p-4">
                        <nav
                            className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible"
                            aria-label="Launcher-Vorschau"
                        >
                            {navigation.map(({ id, label, icon: Icon }) => (
                                <button
                                    type="button"
                                    key={id}
                                    className={`launcher-preview-nav ${activeView === id ? 'launcher-preview-nav-active' : ''}`}
                                    onClick={() => setActiveView(id)}
                                    aria-pressed={activeView === id}
                                >
                                    <Icon />
                                    <span>{label}</span>
                                </button>
                            ))}
                        </nav>
                        <div className="mt-16 hidden border-t border-white/[.06] pt-4 lg:block">
                            <div className="flex items-center gap-3 rounded-xl bg-white/[.025] p-3">
                                <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-500/10 text-orange-400">
                                    <FaGear />
                                </span>
                                <span>
                                    <strong className="block text-[11px] text-zinc-300">Einstellungen</strong>
                                    <small className="text-[9px] text-zinc-600">Client lokal</small>
                                </span>
                            </div>
                        </div>
                    </aside>

                    <div className="min-w-0 bg-[#0b0c10]">
                        {activeView === 'home' && (
                            <HomePanel previewRunning={previewRunning} setPreviewRunning={setPreviewRunning} />
                        )}
                        {activeView === 'modules' && (
                            <ModulesPanel enabledModules={enabledModules} toggleModule={toggleModule} />
                        )}
                        {activeView === 'social' && <SocialPanel />}
                        {activeView === 'news' && <NewsPanel />}
                        {activeView === 'downloads' && <DownloadsPanel />}
                    </div>

                    <aside className="border-t border-white/[.06] bg-[#0f1014] p-5 lg:border-l lg:border-t-0">
                        <div className="flex items-center gap-2">
                            <FaServer className="text-orange-400" />
                            <span className="font-mono text-[9px] uppercase tracking-[.18em] text-zinc-500">
                                Client Status
                            </span>
                        </div>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            {[
                                ['Release', 'Modpack 5.2.0'],
                                ['Minecraft', 'Version 1.21.4'],
                                ['Module', `${212 - (modules.length - enabledModules.size)} aktiv`],
                                ['Kanal', 'Stable']
                            ].map(([label, value]) => (
                                <div key={label} className="launcher-status-row">
                                    <span>{label}</span>
                                    <strong>{value}</strong>
                                </div>
                            ))}
                        </div>
                        <div className="mt-5 border-t border-white/[.06] pt-5">
                            <div className="flex items-center justify-between text-[10px] text-zinc-600">
                                <span>Optimierungsprofil</span>
                                <span className="text-emerald-400">Aktiv</span>
                            </div>
                            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[.06]">
                                <i className="block h-full w-[88%] rounded-full bg-gradient-to-r from-orange-600 to-amber-400" />
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}

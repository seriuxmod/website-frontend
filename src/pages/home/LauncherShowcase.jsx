import {
    FaArrowRight,
    FaBolt,
    FaCheck,
    FaCloudArrowDown,
    FaDownload,
    FaGear,
    FaHouse,
    FaLayerGroup,
    FaNewspaper,
    FaPlay,
    FaUserGroup,
    FaWifi
} from 'react-icons/fa6';

const launcherNavigation = [
    [FaHouse, 'Home'],
    [FaLayerGroup, 'Versionsauswahl'],
    [FaLayerGroup, 'Modpack'],
    [FaUserGroup, 'Social'],
    [FaNewspaper, 'News'],
    [FaDownload, 'Downloads'],
    [FaGear, 'Einstellungen']
];

const launcherNews = [
    ['ANNOUNCEMENT', 'Backend-Migration läuft'],
    ['UPDATE', 'Modpack 5.2.0 ist live'],
    ['EVENT', 'Server-Event am Wochenende'],
    ['MAINTENANCE', 'Wartungsfenster angekündigt']
];

function LauncherWindow() {
    return (
        <div className="launcher-real-perspective" aria-label="Vorschau des SeriuxMod Launchers">
            <div className="launcher-real-window">
                <header className="launcher-real-navbar">
                    <div className="launcher-real-brand">
                        <img src="/logo.png" alt="" />
                        <strong>SERIUXMOD</strong>
                    </div>
                    <nav aria-label="Launcher-Navigation">
                        {launcherNavigation.map(([Icon, label], index) => (
                            <span key={label} className={index === 0 ? 'launcher-real-nav-active' : ''}>
                                <Icon /> {label}
                            </span>
                        ))}
                    </nav>
                    <div className="launcher-real-account">
                        <span>R</span>
                        <strong>RealHosti</strong>
                    </div>
                </header>

                <div className="launcher-real-body">
                    <aside className="launcher-real-left">
                        <div className="launcher-real-update">
                            <div>
                                <small>Neues Update verfügbar</small>
                                <strong>v1.4.1</strong>
                            </div>
                            <span>
                                Aktualisieren <FaArrowRight />
                            </span>
                        </div>
                        <p className="launcher-real-caption">NEUIGKEITEN</p>
                        <div className="launcher-real-news">
                            {launcherNews.map(([category, title]) => (
                                <div key={title}>
                                    <span>{category}</span>
                                    <p>{title}</p>
                                </div>
                            ))}
                        </div>
                        <div className="launcher-real-connection">
                            <small>
                                <FaWifi /> VERBINDUNG :: ONLINE
                            </small>
                            <strong>MODPACK V5.2.0</strong>
                            <span>212 Mods · MC 1.21.4</span>
                        </div>
                    </aside>

                    <div className="launcher-real-center">
                        <div className="launcher-real-version-bar">
                            {[
                                ['MODPACK', 'v5.2.0'],
                                ['MODS', '212'],
                                ['MINECRAFT', '1.21.4'],
                                ['STATUS', 'STABLE']
                            ].map(([label, value], index) => (
                                <span key={label} className={index === 0 ? 'launcher-real-version-active' : ''}>
                                    <small>{label}</small>
                                    <strong>{value}</strong>
                                </span>
                            ))}
                        </div>
                        <div className="launcher-real-player-glow" />
                        <img
                            className="launcher-real-player"
                            src="https://mc-heads.net/body/RealHosti/280"
                            alt="Minecraft-Skin von RealHosti"
                        />
                        <div className="launcher-real-play">
                            <FaPlay />
                            <span>
                                <strong>SPIELEN</strong>
                                <small>Modpack v5.2.0</small>
                            </span>
                            <i>⇄</i>
                        </div>
                        <div className="launcher-real-shortcuts">
                            <span>◈ MODPACK</span>
                            <span>ϟ DOWNLOADS</span>
                            <span>▣ NEWS</span>
                        </div>
                    </div>

                    <aside className="launcher-real-right">
                        <div className="launcher-real-online">
                            <span>ONLINE</span>
                            <strong>2</strong>
                            <small>Alle →</small>
                        </div>
                        {[
                            ['T', 'Tom', 'Online', 'orange'],
                            ['L', 'Lena', 'Adventure SMP', 'blue']
                        ].map(([initial, name, status, color]) => (
                            <div className="launcher-real-friend" key={name}>
                                <span>{initial}</span>
                                <div>
                                    <strong>{name}</strong>
                                    <small className={`launcher-real-${color}`}>{status}</small>
                                </div>
                            </div>
                        ))}
                        <div className="launcher-real-friends-button">♙ ALLE FREUNDE ANZEIGEN</div>
                        <p className="launcher-real-caption">CLAN</p>
                        <div className="launcher-real-clan">
                            ♢ Clans ansehen <b>›</b>
                        </div>
                        <div className="launcher-real-system">
                            <small>SYSTEM</small>
                            <span>
                                Freunde <strong>2</strong>
                            </span>
                            <span>
                                Mods <strong>212</strong>
                            </span>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}

export default function LauncherShowcase() {
    return (
        <div className="grid items-center gap-14 lg:grid-cols-[0.72fr_1.28fr] xl:gap-20">
            <div className="relative z-10">
                <p className="eyebrow">ALLES, WAS DU BRAUCHST</p>
                <h2 className="section-title max-w-xl">Gebaut für dein bestes Spiel.</h2>
                <p className="section-copy max-w-xl">
                    Ein Launcher, der Updates, Modpack, Freunde und deinen Minecraft-Account in einer Oberfläche
                    zusammenführt – schnell, übersichtlich und direkt spielbereit.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-3">
                    {[
                        [FaLayerGroup, '212 Module', 'Aktuelles Modpack'],
                        [FaBolt, '1.21.4', 'Minecraft Version'],
                        [FaCheck, 'Stable', 'Release Channel'],
                        [FaWifi, 'Online', 'Backend verbunden']
                    ].map(([Icon, value, label]) => (
                        <div key={label} className="launcher-copy-stat">
                            <Icon />
                            <span>
                                <strong>{value}</strong>
                                <small>{label}</small>
                            </span>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <a href="#download" className="button-primary">
                        <FaCloudArrowDown /> Launcher herunterladen
                    </a>
                    <a href="#platform" className="button-secondary">
                        Funktionen ansehen <FaArrowRight />
                    </a>
                </div>
                <p className="mt-5 text-[10px] uppercase tracking-[.16em] text-zinc-600">
                    Abgebildet ist der aktuelle Launcher-Startbildschirm
                </p>
            </div>

            <LauncherWindow />
        </div>
    );
}

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

const clientAreas = [
    {
        icon: FaBolt,
        category: 'PERFORMANCE',
        title: 'Performance-Profile',
        text: 'Passe Arbeitsspeicher, Java-Parameter und das Startprofil an dein System an.',
        details: ['RAM-Profile', 'Java-Konfiguration', 'Systemstatus']
    },
    {
        icon: FaLayerGroup,
        category: 'VERSIONEN',
        title: 'Versionsauswahl',
        text: 'Wechsle kontrolliert zwischen freigegebenen Minecraft- und Modpack-Versionen.',
        details: ['Stable Channel', 'Release-Auswahl', 'Eigene Instanzen']
    },
    {
        icon: FaCheck,
        category: 'MODPACK',
        title: 'Modpack-Manager',
        text: 'Der Launcher hält Mods, Abhängigkeiten und Konfigurationen automatisch synchron.',
        details: ['212 Mods', 'Auto-Sync', 'Integritätsprüfung']
    },
    {
        icon: FaUserGroup,
        category: 'COMMUNITY',
        title: 'Social Hub',
        text: 'Sieh Freunde, Online-Status, Clans und gemeinsame Spielsessions direkt im Launcher.',
        details: ['Freundesliste', 'Clans', 'Presence']
    },
    {
        icon: FaDownload,
        category: 'DOWNLOADS',
        title: 'Update-System',
        text: 'Neue Launcher- und Modpack-Versionen landen nachvollziehbar auf deinem System.',
        details: ['Update-Kanal', 'Fortschritt', 'Changelog']
    },
    {
        icon: FaGear,
        category: 'ACCOUNT',
        title: 'Seriux-ID',
        text: 'Minecraft-Profil, Website-Zugang und persönliche Einstellungen bleiben verbunden.',
        details: ['Minecraft-Profil', 'Sichere Session', 'Cloud-Sync']
    }
];

export function LauncherWindow({ hero = false }) {
    return (
        <div
            className={`launcher-real-perspective ${hero ? 'launcher-real-perspective-hero' : ''}`}
            aria-label="Vorschau des SeriuxMod Launchers"
        >
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
        <div>
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
                <div className="max-w-2xl">
                    <p className="eyebrow">DEIN CLIENT. DEINE WERKZEUGE.</p>
                    <h2 className="section-title">Alles an einem Ort.</h2>
                    <p className="section-copy">
                        Vom ersten Download bis zur gemeinsamen Spielsession: Der SeriuxMod Launcher bündelt die
                        wichtigsten Bereiche des Clients in einer Oberfläche.
                    </p>
                </div>
                <div className="client-module-summary">
                    <span>
                        <strong>212</strong>
                        Mods im aktuellen Pack
                    </span>
                    <i />
                    <span>
                        <strong>1.21.4</strong>
                        Minecraft-Basis
                    </span>
                </div>
            </div>

            <div className="client-module-grid">
                {clientAreas.map(({ icon: Icon, category, title, text, details }, index) => (
                    <article className="client-module-card" key={title}>
                        <div className="client-module-card-topline">
                            <span className="client-module-icon">
                                <Icon />
                            </span>
                            <small>0{index + 1}</small>
                        </div>
                        <p>{category}</p>
                        <h3>{title}</h3>
                        <div className="client-module-divider" />
                        <span className="client-module-description">{text}</span>
                        <div className="client-module-details">
                            {details.map((detail) => (
                                <span key={detail}>
                                    <FaCheck /> {detail}
                                </span>
                            ))}
                        </div>
                    </article>
                ))}
            </div>

            <div className="client-module-footer">
                <div>
                    <FaWifi />
                    <span>
                        <strong>Bereit für deinen nächsten Start</strong>
                        Launcher, Modpack und Seriux-ID arbeiten als ein System zusammen.
                    </span>
                </div>
                <a href="#download" className="button-primary">
                    <FaCloudArrowDown /> Launcher herunterladen
                </a>
            </div>
        </div>
    );
}

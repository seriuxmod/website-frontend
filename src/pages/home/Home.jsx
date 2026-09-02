import { useEffect, useState } from 'react';
import {
    FaArrowRight,
    FaBolt,
    FaCheck,
    FaCloudArrowDown,
    FaGamepad,
    FaLayerGroup,
    FaPalette,
    FaRotate,
    FaShieldHalved,
    FaUserGroup,
    FaWindows
} from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import HomeBlogSlider from './HomeBlogSlider';
import LauncherShowcase, { LauncherWindow } from './LauncherShowcase';

const API = 'https://api.seriuxmod.net/api/v1';

function SystemStatus() {
    const [online, setOnline] = useState(null);
    useEffect(() => {
        const controller = new AbortController();
        fetch(`${API}/status/summary`, { signal: controller.signal })
            .then((response) => (response.ok ? response.json() : Promise.reject()))
            .then((data) => {
                const core = data.services?.filter((service) => service.group === 'seriuxmod') ?? [];
                setOnline(core.length > 0 && core.every((service) => service.state === 'UP'));
            })
            .catch(() => setOnline(false));
        return () => controller.abort();
    }, []);
    return (
        <Link to="/status" className="home-status-pill inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs">
            <i
                className={`h-2 w-2 rounded-full ${online === false ? 'bg-amber-400' : 'bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,.12)]'}`}
            />
            {online ? 'Alle Kernsysteme online' : 'Systemstatus ansehen'}
        </Link>
    );
}

const proofPoints = [
    { icon: FaLayerGroup, value: '212', label: 'Module im aktuellen Pack' },
    { icon: FaGamepad, value: '1.21.4', label: 'Aktuelle Minecraft-Basis' },
    { icon: FaRotate, value: 'Automatisch', label: 'Updates und Synchronisierung' },
    { icon: FaShieldHalved, value: 'Eine Seriux-ID', label: 'Für Client und Community' }
];

const benefits = [
    {
        icon: FaBolt,
        eyebrow: 'PERFORMANCE',
        title: 'Mehr Spiel. Weniger Ballast.',
        text: 'Abgestimmte Profile, kontrollierte Releases und ein Client, der dir die technische Arbeit abnimmt.',
        points: ['Performance-Profile', 'Stabile Release-Kanäle', 'Systemstatus im Blick'],
        tone: 'orange'
    },
    {
        icon: FaLayerGroup,
        eyebrow: 'MODPACK',
        title: 'Dein Setup bleibt zusammen.',
        text: 'Mods, Abhängigkeiten und Konfigurationen werden als ein Paket verwaltet und zuverlässig aktualisiert.',
        points: ['Automatische Synchronisierung', 'Versionsauswahl', 'Integritätsprüfung'],
        tone: 'cream'
    },
    {
        icon: FaUserGroup,
        eyebrow: 'COMMUNITY',
        title: 'Deine Leute sind schon da.',
        text: 'Spielerprofile, Freunde, Forum und Präsenz greifen ineinander – auf der Website und im Launcher.',
        points: ['Öffentliche Profile', 'Online-Status', 'Gemeinsame Seriux-ID'],
        tone: 'peach'
    },
    {
        icon: FaPalette,
        eyebrow: 'DEIN LOOK',
        title: 'So individuell wie dein Spielstil.',
        text: 'Cosmetics und persönliche Einstellungen bleiben mit deinem Minecraft-Profil verbunden.',
        points: ['Accountgebundene Inhalte', 'Einheitlicher Auftritt', 'Direkte Freischaltung'],
        tone: 'dark'
    }
];

const journey = [
    {
        number: '01',
        title: 'Launcher laden',
        text: 'SeriuxMod installieren und mit deinem vorhandenen Minecraft-Account starten.'
    },
    {
        number: '02',
        title: 'Setup auswählen',
        text: 'Version und Modpack wählen. Den Rest hält der Launcher für dich synchron.'
    },
    {
        number: '03',
        title: 'Einloggen & spielen',
        text: 'Dein Profil wird verknüpft und dein SeriuxMod-Erlebnis ist direkt spielbereit.'
    }
];

export default function Home() {
    return (
        <main id="top" className="home-landing overflow-hidden">
            <section className="home-hero relative isolate flex min-h-[100svh] items-center overflow-hidden px-5 pb-28 pt-36 text-white sm:pt-40 lg:px-10">
                <video
                    className="home-hero-video absolute inset-0 -z-30 h-full w-full scale-[1.035] object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster="/minecraft-parkour-poster.jpg"
                    aria-hidden="true"
                >
                    <source src="/minecraft-parkour-hero.mp4" type="video/mp4" />
                </video>
                <div className="home-hero-wash absolute inset-0 -z-20" />
                <div className="home-hero-vignette absolute inset-0 -z-20" />
                <div className="mx-auto grid w-full max-w-[1480px] items-center gap-14 lg:grid-cols-[0.72fr_1.28fr] xl:gap-20">
                    <div className="relative z-10 flex max-w-xl flex-col items-center text-center lg:items-start lg:text-left">
                        <SystemStatus />
                        <p className="mt-8 text-xs font-extrabold tracking-[.18em] text-orange-400">
                            DEIN MINECRAFT. NEU GEDACHT.
                        </p>
                        <h1 className="mt-5 font-display text-5xl font-bold leading-[.94] tracking-[-.06em] drop-shadow-[0_8px_35px_rgba(0,0,0,.7)] sm:text-7xl lg:text-7xl xl:text-8xl">
                            Mehr als spielen.
                            <br />
                            <span className="bg-gradient-to-r from-orange-500 to-amber-300 bg-clip-text text-transparent">
                                Erlebe Minecraft.
                            </span>
                        </h1>
                        <p className="mt-7 max-w-2xl text-base leading-8 text-zinc-200 drop-shadow-[0_3px_14px_rgba(0,0,0,.9)] sm:text-lg">
                            Mehr Leistung, ein aufgeräumtes Modpack und deine Community in einem Launcher. Installieren,
                            anmelden und ohne Umwege ins Spiel.
                        </p>
                        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                            <a href="#download" className="button-primary">
                                <FaWindows /> Für Windows herunterladen
                            </a>
                            <a
                                href="#features"
                                className="button-secondary border-white/15 bg-black/30 backdrop-blur-xl"
                            >
                                Client entdecken <FaArrowRight />
                            </a>
                        </div>
                        <div className="mt-8 flex flex-wrap justify-center gap-5 text-xs text-zinc-300 lg:justify-start">
                            {['Kostenloser Einstieg', 'Automatische Updates', 'Community verbunden'].map((item) => (
                                <span className="flex items-center gap-1.5" key={item}>
                                    <FaCheck className="text-orange-500" />
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="landing-launcher relative z-10 mx-auto w-full max-w-[900px]">
                        <LauncherWindow hero />
                        <p className="mt-5 text-center text-[9px] font-bold uppercase tracking-[.18em] text-zinc-400/70">
                            Der aktuelle SeriuxMod Launcher · Modpack v5.2.0
                        </p>
                    </div>
                </div>
                <div className="home-hero-bridge absolute inset-x-0 bottom-0 h-44" />
            </section>

            <section className="home-proof-section relative z-20 px-5 lg:px-10" aria-label="SeriuxMod auf einen Blick">
                <div className="home-proof-ribbon mx-auto grid max-w-7xl sm:grid-cols-2 lg:grid-cols-4">
                    {proofPoints.map(({ icon: Icon, value, label }) => (
                        <div className="home-proof-item" key={label}>
                            <span>
                                <Icon />
                            </span>
                            <div>
                                <strong>{value}</strong>
                                <small>{label}</small>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section id="features" className="home-client-light relative px-5 pb-24 pt-28 lg:px-10 lg:pb-32 lg:pt-36">
                <div className="mx-auto max-w-7xl">
                    <LauncherShowcase />
                </div>
            </section>

            <section
                id="benefits"
                className="home-benefits-section px-5 py-24 lg:px-10 lg:py-32"
                aria-labelledby="benefits-heading"
            >
                <div className="mx-auto max-w-7xl">
                    <div className="max-w-3xl">
                        <p className="eyebrow">WARUM SERIUXMOD?</p>
                        <h2 id="benefits-heading" className="section-title">
                            Ein Client, der sich nach dir richtet.
                        </h2>
                        <p className="section-copy">
                            Kein technischer Hindernislauf vor dem ersten Block: Die wichtigsten Funktionen sind dort,
                            wo du sie erwartest – und arbeiten als ein System zusammen.
                        </p>
                    </div>

                    <div className="home-benefit-grid mt-14">
                        {benefits.map(({ icon: Icon, eyebrow, title, text, points, tone }) => (
                            <article className={`home-benefit-card home-benefit-card-${tone}`} key={title}>
                                <div className="home-benefit-icon">
                                    <Icon />
                                </div>
                                <p>{eyebrow}</p>
                                <h3>{title}</h3>
                                <span>{text}</span>
                                <ul>
                                    {points.map((point) => (
                                        <li key={point}>
                                            <FaCheck /> {point}
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <HomeBlogSlider />

            <section
                id="community"
                className="home-community-section relative overflow-hidden py-24 text-[#251007] lg:py-32"
            >
                <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 lg:grid-cols-2 lg:px-10">
                    <div>
                        <p className="text-xs font-extrabold tracking-[.18em] text-orange-950/70">
                            EINE PLATTFORM. EINE IDENTITÄT.
                        </p>
                        <h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-[-.045em] sm:text-6xl">
                            Deine Welt hört nicht am Serverrand auf.
                        </h2>
                        <p className="mt-6 max-w-xl leading-8 text-orange-950/70">
                            Account, Freunde und Einstellungen an einem Ort. Forum, Social Hub und Store bilden ein
                            gemeinsames Erlebnis auf dem SeriuxMod-Backend.
                        </p>
                        <a
                            href="#download"
                            className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white px-5 py-4 text-sm font-bold shadow-xl"
                        >
                            Website-Zugang im Launcher aktivieren <FaArrowRight />
                        </a>
                    </div>
                    <div className="home-community-profile relative mx-auto w-full max-w-lg rounded-3xl p-8 text-white">
                        <div className="flex items-center gap-5">
                            <img
                                className="h-24 w-24 rounded-2xl object-contain"
                                src="/logo.png"
                                alt="SeriuxMod Fuchs"
                            />
                            <div>
                                <small className="text-[10px] tracking-[.18em] text-orange-400">SERIUX PROFILE</small>
                                <h3 className="mt-2 font-display text-2xl font-bold">Willkommen zurück.</h3>
                                <p className="mt-2 text-xs text-zinc-500">Dein Account. Dein Netzwerk. Dein Client.</p>
                            </div>
                        </div>
                        <span className="mt-7 flex items-center gap-2 text-[10px] text-emerald-400">
                            <i className="h-2 w-2 rounded-full bg-emerald-400" /> ONLINE
                        </span>
                    </div>
                </div>
            </section>

            <section className="home-journey-section px-5 py-24 lg:px-10 lg:py-32" aria-labelledby="journey-heading">
                <div className="mx-auto max-w-7xl">
                    <div className="text-center">
                        <p className="eyebrow">SO EINFACH GEHT&apos;S</p>
                        <h2 id="journey-heading" className="section-title">
                            Vom Download direkt ins Spiel.
                        </h2>
                        <p className="section-copy mx-auto max-w-2xl">
                            Der Launcher führt dich durch die Einrichtung. Keine separate Registrierung auf der Website,
                            kein manuelles Zusammensuchen deiner Mods.
                        </p>
                    </div>

                    <div className="home-journey-grid mt-14">
                        {journey.map(({ number, title, text }) => (
                            <article className="home-journey-step" key={number}>
                                <strong>{number}</strong>
                                <h3>{title}</h3>
                                <p>{text}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section id="download" className="home-download-section px-5 pb-24 lg:px-10 lg:pb-32">
                <div className="home-download-card relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 overflow-hidden rounded-[36px] p-8 text-white sm:p-14 lg:flex-row lg:items-center">
                    <div className="home-download-orb absolute -right-24 h-80 w-80 rounded-full blur-3xl" />
                    <div className="relative max-w-2xl">
                        <p className="text-xs font-extrabold tracking-[.18em] text-orange-300">
                            BEREIT, WENN DU ES BIST
                        </p>
                        <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                            Dein Minecraft. Nur besser organisiert.
                        </h2>
                        <p className="mt-4 text-sm leading-7 text-orange-50/70">
                            Lade den SeriuxMod Launcher herunter, verbinde deinen Minecraft-Account und starte mit
                            deinem synchronisierten Setup.
                        </p>
                    </div>
                    <a href="#top" className="home-download-button relative shrink-0">
                        <FaCloudArrowDown /> Launcher herunterladen
                    </a>
                </div>
            </section>
        </main>
    );
}

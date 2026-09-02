import { useEffect, useState } from 'react';
import { FaArrowRight, FaCheck, FaCloudArrowDown, FaWindows } from 'react-icons/fa6';
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
        <Link
            to="/status"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-3 py-2 text-xs text-zinc-400"
        >
            <i
                className={`h-2 w-2 rounded-full ${online === false ? 'bg-amber-400' : 'bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,.12)]'}`}
            />
            {online ? 'Alle Kernsysteme online' : 'Systemstatus ansehen'}
        </Link>
    );
}

export default function Home() {
    return (
        <main id="top" className="overflow-hidden bg-[#090a0d] text-white">
            <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden px-5 pb-28 pt-36 sm:pt-40 lg:px-10">
                <video
                    className="absolute inset-0 -z-30 h-full w-full scale-[1.04] object-cover blur-[2.5px] brightness-[.52] saturate-[.82]"
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
                <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(4,5,8,.18)_42%,rgba(4,5,8,.82)_100%)]" />
                <div className="absolute inset-0 -z-20 bg-gradient-to-b from-[#050609]/45 via-transparent to-[#090a0d]" />
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
                            SeriuxMod verbindet Performance, Individualität und Community in einem modernen Minecraft
                            Client – gemacht für dein nächstes Abenteuer.
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
                            {['Kostenlos', 'Sicher', 'Community-first'].map((item) => (
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
                <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent via-[#090a0d]/75 to-[#090a0d]" />
            </section>

            <section
                id="features"
                className="client-detail-cut relative z-10 -mt-16 px-5 pb-24 pt-40 lg:px-10 lg:pb-32 lg:pt-48"
            >
                <div className="mx-auto max-w-7xl">
                    <LauncherShowcase />
                </div>
            </section>

            <HomeBlogSlider />

            <section id="community" className="bg-gradient-to-br from-orange-500 to-[#e33d0b] py-24 text-[#251007]">
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
                    <div className="relative mx-auto w-full max-w-lg rounded-3xl border border-white/20 bg-[#101115] p-8 text-white shadow-[0_35px_80px_rgba(78,15,0,.35)]">
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

            <section id="download" className="mx-auto max-w-7xl px-5 py-24 lg:px-10">
                <div className="relative flex flex-col items-start justify-between gap-10 overflow-hidden rounded-3xl border border-white/10 bg-[#131419] p-8 sm:p-14 lg:flex-row lg:items-center">
                    <div className="absolute -right-24 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />
                    <div className="relative max-w-2xl">
                        <p className="eyebrow">BEREIT, WENN DU ES BIST</p>
                        <h2 className="mt-3 font-display text-4xl font-bold tracking-tight">
                            Dein nächstes Abenteuer startet hier.
                        </h2>
                        <p className="mt-4 text-sm leading-7 text-zinc-500">
                            Dein Spielerprofil entsteht beim ersten verifizierten Minecraft-Login. Den optionalen
                            Website-Zugang mit E-Mail und Passwort aktivierst du anschließend direkt im Launcher.
                        </p>
                    </div>
                    <a href="#top" className="button-primary relative shrink-0">
                        <FaCloudArrowDown /> Launcher herunterladen
                    </a>
                </div>
            </section>
        </main>
    );
}

import { FaDiscord } from 'react-icons/fa6';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="border-t border-white/[.06] bg-[#07080a] px-5 pb-7 pt-20 text-white lg:px-10">
            <div className="mx-auto grid max-w-7xl gap-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
                <div>
                    <Link className="flex items-center gap-2 font-display text-xl font-bold" to="/">
                        <img className="h-10 w-10 rounded-xl object-contain" src="/logo.png" alt="" />
                        Seriux<span className="-ml-2 text-orange-500">Mod</span>
                    </Link>
                    <p className="mt-4 max-w-xs text-xs leading-6 text-zinc-600">
                        Ein unabhängiges Minecraft-Client-Projekt aus der Community.
                    </p>
                </div>
                <div className="footer-links">
                    <b>Plattform</b>
                    <a href="/#features">Features</a>
                    <a href="/#benefits">Vorteile</a>
                    <a href="/#download">Download</a>
                    <Link to="/status">Systemstatus</Link>
                </div>
                <div className="footer-links">
                    <b>Community</b>
                    <a href="/#community">Über uns</a>
                    <a href="https://discord.com">
                        <FaDiscord /> Discord
                    </a>
                </div>
                <div className="footer-links">
                    <b>Rechtliches</b>
                    <Link to="/privacy">Datenschutz</Link>
                    <Link to="/terms">Nutzungsbedingungen</Link>
                    <Link to="/disclosure">Impressum</Link>
                </div>
            </div>
            <div className="mx-auto mt-16 flex max-w-7xl flex-col justify-between gap-2 border-t border-white/[.06] pt-6 text-[10px] text-zinc-700 sm:flex-row">
                <span>© {new Date().getFullYear()} SeriuxMod</span>
                <span>Nicht mit Mojang Studios oder Microsoft verbunden.</span>
            </div>
        </footer>
    );
}

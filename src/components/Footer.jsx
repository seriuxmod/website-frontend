import { FaDiscord } from 'react-icons/fa6';

export default function Footer() {
    return <footer className="border-t border-white/[.06] bg-[#07080a] px-5 pb-7 pt-20 text-white lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
            <div><a className="flex items-center gap-2 font-display text-xl font-bold" href="/#/"><img className="h-10 w-10 rounded-xl object-contain" src="/logo.png" alt="" />Seriux<span className="-ml-2 text-orange-500">Mod</span></a><p className="mt-4 max-w-xs text-xs leading-6 text-zinc-600">Ein unabhängiges Minecraft-Client-Projekt aus der Community.</p></div>
            <div className="footer-links"><b>Plattform</b><a href="/#features">Features</a><a href="/#download">Download</a><a href="https://api.seriuxmod.net/status">Systemstatus</a></div>
            <div className="footer-links"><b>Community</b><a href="/#community">Über uns</a><a href="https://discord.com"><FaDiscord /> Discord</a></div>
            <div className="footer-links"><b>Rechtliches</b><a href="/#/privacy">Datenschutz</a><a href="/#/terms">Nutzungsbedingungen</a><a href="/#/disclosure">Impressum</a></div>
        </div>
        <div className="mx-auto mt-16 flex max-w-7xl flex-col justify-between gap-2 border-t border-white/[.06] pt-6 text-[10px] text-zinc-700 sm:flex-row"><span>© {new Date().getFullYear()} SeriuxMod</span><span>Nicht mit Mojang Studios oder Microsoft verbunden.</span></div>
    </footer>;
}

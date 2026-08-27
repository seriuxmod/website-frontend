import { useState } from 'react';
import { FaArrowRight } from 'react-icons/fa6';

export default function Navbar() {
    const [open, setOpen] = useState(false);
    return <header className="sticky top-0 z-50 border-b border-white/[.06] bg-[#090a0d]/80 backdrop-blur-xl">
        <nav className="relative mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-6 px-5 lg:px-10">
            <a className="flex items-center gap-2 font-display text-xl font-bold tracking-tight" href="/#/"><img className="h-10 w-10 rounded-xl object-contain" src="/logo.png" alt="" />Seriux<span className="-ml-2 text-orange-500">Mod</span></a>
            <button className="text-sm text-zinc-300 md:hidden" onClick={() => setOpen(!open)} aria-expanded={open}>Menü</button>
            <div className={`${open ? 'flex' : 'hidden'} absolute left-5 right-5 top-20 flex-col gap-6 rounded-2xl border border-white/10 bg-[#15161a] p-6 text-sm font-semibold text-zinc-400 md:static md:flex md:flex-row md:border-0 md:bg-transparent md:p-0`}><a href="/#features">Features</a><a href="/#community">Community</a><a href="https://api.seriuxmod.net/status">Status</a><a href="/#download">Download</a></div>
            <a href="https://auth.seriuxmod.net" className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-xs font-bold md:flex">Anmelden <FaArrowRight /></a>
        </nav>
    </header>;
}

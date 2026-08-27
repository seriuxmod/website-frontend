import { useEffect, useState } from 'react';
import { FaArrowRight, FaBars, FaDownload, FaXmark } from 'react-icons/fa6';
import { useLocation, useNavigate } from 'react-router-dom';

const items = [
    ['Features', 'features'],
    ['Clans', '/clans'],
    ['Forum', '/forum'],
    ['Store', '/store'],
    ['Status', 'status'],
    ['Download', 'download'],
];

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        setOpen(false);
        document.body.style.overflow = '';
    }, [location.pathname]);

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    const goTo = (target) => {
        setOpen(false);
        if (target.startsWith('/')) {
            navigate(target);
            return;
        }
        if (target === 'status') {
            window.open('https://api.seriuxmod.net/api/v1/status/summary', '_blank', 'noopener,noreferrer');
            return;
        }
        const scroll = () => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (location.pathname !== '/') {
            navigate('/');
            window.setTimeout(scroll, 80);
        } else {
            scroll();
        }
    };

    return <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
        <nav className={`liquid-nav pointer-events-auto mx-auto flex h-[66px] max-w-6xl items-center justify-between px-3 pl-4 transition-all duration-500 sm:px-3 sm:pl-5 ${scrolled ? 'max-w-5xl shadow-[0_20px_60px_rgba(0,0,0,.38)]' : ''}`} aria-label="Hauptnavigation">
            <button className="relative z-10 flex items-center gap-2 font-display text-lg font-bold tracking-tight" onClick={() => goTo('top')} aria-label="Zur Startseite">
                <img className="h-9 w-9 rounded-xl object-contain" src="/logo.png" alt="" />
                <span>Seriux<span className="text-orange-500">Mod</span></span>
            </button>

            <div className="hidden items-center rounded-full border border-white/[.055] bg-black/15 p-1 md:flex">
                {items.map(([label, target]) => <button key={target} onClick={() => goTo(target)} className="liquid-link rounded-full px-4 py-2.5 text-xs font-bold text-zinc-400">{label}</button>)}
            </div>

            <a href="https://auth.seriuxmod.net" className="liquid-button relative hidden items-center gap-2 overflow-hidden rounded-full px-5 py-3 text-xs font-bold sm:flex">Anmelden <FaArrowRight /></a>
            <button className="liquid-button relative grid h-11 w-11 place-items-center overflow-hidden rounded-full text-lg sm:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? 'Menü schließen' : 'Menü öffnen'}>
                {open ? <FaXmark /> : <FaBars />}
            </button>
        </nav>

        <div id="mobile-navigation" className={`pointer-events-auto fixed inset-0 z-[-1] bg-[#08090c]/70 px-3 pt-[90px] backdrop-blur-xl transition duration-300 sm:hidden ${open ? 'visible opacity-100' : 'invisible opacity-0'}`} onClick={() => setOpen(false)}>
            <div className={`liquid-panel mx-auto overflow-hidden rounded-[28px] p-3 transition duration-500 ${open ? 'translate-y-0 scale-100' : '-translate-y-5 scale-95'}`} onClick={(event) => event.stopPropagation()}>
                <div className="space-y-1 p-2">
                    {items.map(([label, target], index) => <button key={target} onClick={() => goTo(target)} className="group flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left font-display text-xl font-semibold text-zinc-200 transition hover:bg-white/[.06]">
                        <span><small className="mr-4 font-sans text-[10px] text-orange-500">0{index + 1}</small>{label}</span><FaArrowRight className="text-sm text-zinc-600 transition group-hover:translate-x-1 group-hover:text-orange-400" />
                    </button>)}
                </div>
                <a href="https://auth.seriuxmod.net" className="mt-2 flex items-center justify-between rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4 text-sm font-bold shadow-[0_15px_40px_rgba(249,115,22,.25)]">Account öffnen <FaArrowRight /></a>
                <button onClick={() => goTo('download')} className="mt-2 flex w-full items-center justify-center gap-2 py-3 text-xs font-bold text-zinc-500"><FaDownload /> Client herunterladen</button>
            </div>
        </div>
    </header>;
}

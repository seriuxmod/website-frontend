import { FaEnvelope } from 'react-icons/fa6';
import { Link } from 'react-router-dom';

export default function VerifyEmail() {
    return <RecoveryShell icon={FaEnvelope} title="Keine E-Mail-Bestätigung eingerichtet" copy="Seriux-ID verwendet derzeit keine E-Mail-Wiederherstellung. Sichere stattdessen Wiederherstellungscodes unter Kontosicherheit."><Link className="forum-button-primary mt-6" to="/me/settings/security">Zur Sicherheit</Link></RecoveryShell>;
}

export function RecoveryShell({ icon: Icon, title, copy, children }) {
    return <main className="grid min-h-screen place-items-center bg-[#090a0d] px-4 py-32 text-white"><section className="w-full max-w-xl rounded-[32px] border border-white/[.08] bg-[#111218] p-8 text-center shadow-2xl sm:p-12"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-500/10 text-2xl text-orange-300"><Icon/></span><h1 className="mt-7 font-display text-3xl font-bold">{title}</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500">{copy}</p>{children}</section></main>;
}

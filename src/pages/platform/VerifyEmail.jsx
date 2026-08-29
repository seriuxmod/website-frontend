import { useEffect, useState } from 'react';
import { FaCircleCheck, FaEnvelope, FaTriangleExclamation } from 'react-icons/fa6';
import { Link, useSearchParams } from 'react-router-dom';
import { securityApi } from '../../lib/securityApi';

export default function VerifyEmail() {
    const [params] = useSearchParams();
    const [state, setState] = useState('loading');
    useEffect(() => {
        const token = params.get('token');
        if (!token) return setState('error');
        securityApi.verifyEmail(token).then(() => setState('success')).catch(() => setState('error'));
    }, [params]);
    return <RecoveryShell icon={state === 'success' ? FaCircleCheck : state === 'error' ? FaTriangleExclamation : FaEnvelope} title={state === 'loading' ? 'E-Mail wird bestätigt …' : state === 'success' ? 'E-Mail bestätigt' : 'Link nicht gültig'} copy={state === 'success' ? 'Deine Wiederherstellungsadresse ist jetzt verifiziert.' : state === 'error' ? 'Der Link ist abgelaufen oder wurde bereits verwendet.' : 'Einen kurzen Moment bitte.'}><Link className="forum-button-primary mt-6" to="/account/security">Zur Sicherheit</Link></RecoveryShell>;
}

export function RecoveryShell({ icon: Icon, title, copy, children }) {
    return <main className="grid min-h-screen place-items-center bg-[#090a0d] px-4 py-32 text-white"><section className="w-full max-w-xl rounded-[32px] border border-white/[.08] bg-[#111218] p-8 text-center shadow-2xl sm:p-12"><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-500/10 text-2xl text-orange-300"><Icon/></span><h1 className="mt-7 font-display text-3xl font-bold">{title}</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500">{copy}</p>{children}</section></main>;
}

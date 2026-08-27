import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { completeLogin } from '../../lib/auth';

export default function AuthCallback() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    useEffect(() => {
        completeLogin(params.get('code'), params.get('state'))
            .then((returnTo) => navigate(returnTo, { replace: true }))
            .catch((reason) => setError(reason.message));
    }, [navigate, params]);

    return <main className="grid min-h-screen place-items-center bg-[#090a0d] px-5 text-white">
        <div className="liquid-panel max-w-md rounded-3xl p-8 text-center">
            <p className="eyebrow">SERIUX ACCOUNT</p>
            <h1 className="mt-3 font-display text-3xl font-bold">{error ? 'Anmeldung fehlgeschlagen' : 'Anmeldung wird abgeschlossen'}</h1>
            <p className="mt-4 text-sm leading-7 text-zinc-400">{error || 'Dein sicherer PKCE-Login wird geprüft …'}</p>
        </div>
    </main>;
}

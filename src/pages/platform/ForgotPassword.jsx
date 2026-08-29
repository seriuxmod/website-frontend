import { useState } from 'react';
import { FaEnvelope } from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import { securityApi } from '../../lib/securityApi';
import { RecoveryShell } from './VerifyEmail';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [state, setState] = useState('idle');
    const [error, setError] = useState('');

    const submit = async (event) => {
        event.preventDefault();
        setError('');
        try {
            setState('saving');
            await securityApi.requestPasswordReset(email);
            setState('done');
        } catch (failure) {
            setState('idle');
            setError(failure.status === 429
                ? 'Zu viele Anfragen. Bitte versuche es später erneut.'
                : 'Die Anfrage konnte gerade nicht verarbeitet werden.');
        }
    };

    if (state === 'done') {
        return <RecoveryShell icon={FaEnvelope} title="Postfach prüfen" copy="Wenn die Adresse zu einem Seriux-ID-Konto gehört, erhältst du in Kürze einen einmalig nutzbaren Link."><Link className="forum-button-primary mt-6" to="/">Zur Startseite</Link></RecoveryShell>;
    }

    return <RecoveryShell icon={FaEnvelope} title="Passwort vergessen" copy="Gib die hinterlegte Wiederherstellungsadresse ein. Aus Datenschutzgründen verraten wir nicht, ob ein Konto dazu existiert."><form className="mt-7 text-left" onSubmit={submit}><label className="forum-label">Wiederherstellungs-E-Mail<input className="forum-input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>{error && <p className="mt-4 text-sm text-red-300">{error}</p>}<button className="forum-button-primary mt-6 w-full" disabled={state === 'saving'}>{state === 'saving' ? 'Wird gesendet …' : 'Reset-Link anfordern'}</button><p className="mt-5 text-center text-xs text-zinc-600">Noch keinen Website-Zugang? Richte ihn zuerst im SeriuxMod Launcher ein.</p></form></RecoveryShell>;
}

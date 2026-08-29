import { useState } from 'react';
import { FaKey } from 'react-icons/fa6';
import { Link, useSearchParams } from 'react-router-dom';
import { securityApi } from '../../lib/securityApi';
import { RecoveryShell } from './VerifyEmail';

export default function ResetPassword() {
    const [params] = useSearchParams(); const [password, setPassword] = useState(''); const [repeat, setRepeat] = useState(''); const [state, setState] = useState('idle'); const [error, setError] = useState('');
    const submit = async (event) => { event.preventDefault(); setError(''); if (password.length < 12) return setError('Das Passwort muss mindestens 12 Zeichen enthalten.'); if (password !== repeat) return setError('Die Passwörter stimmen nicht überein.'); try { setState('saving'); await securityApi.confirmPasswordReset(params.get('token'), password); setState('done'); } catch { setState('idle'); setError('Der Link ist abgelaufen oder wurde bereits verwendet.'); } };
    if (state === 'done') return <RecoveryShell icon={FaKey} title="Passwort geändert" copy="Alle bestehenden Web- und Launcher-Sitzungen wurden widerrufen."><Link className="forum-button-primary mt-6" to="/">Zur Startseite</Link></RecoveryShell>;
    return <RecoveryShell icon={FaKey} title="Passwort zurücksetzen" copy="Vergib ein neues Passwort für deine Seriux-ID. Andere aktive Sitzungen werden anschließend beendet."><form className="mt-7 text-left" onSubmit={submit}><label className="forum-label">Neues Passwort<input className="forum-input" type="password" minLength="12" value={password} onChange={(e)=>setPassword(e.target.value)} required/></label><label className="forum-label mt-4">Passwort wiederholen<input className="forum-input" type="password" minLength="12" value={repeat} onChange={(e)=>setRepeat(e.target.value)} required/></label>{error && <p className="mt-4 text-sm text-red-300">{error}</p>}<button className="forum-button-primary mt-6 w-full" disabled={state === 'saving'}>{state === 'saving' ? 'Wird gespeichert …' : 'Passwort speichern'}</button></form></RecoveryShell>;
}

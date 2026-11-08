import { useCallback, useEffect, useState } from 'react';
import {
    FaCheck,
    FaClockRotateLeft,
    FaComputer,
    FaKey,
    FaLaptop,
    FaLocationDot,
    FaMobileScreen,
    FaFingerprint,
    FaShieldHalved,
    FaTrash
} from 'react-icons/fa6';
import { beginLogin, fetchAuthenticatedUser, getAuthenticatedUser, logout } from '../../lib/auth';
import { securityApi } from '../../lib/securityApi';
import { registrationOptions, serializeCredential } from '../../lib/passkeys';
import { ForumError, ForumLoading, ForumShell, formatDate } from '../forum/ForumComponents';

export default function Security() {
    const [user, setUser] = useState(() => getAuthenticatedUser());
    const [state, setState] = useState({ loading: true, status: null, devices: [], passkeys: [], error: '' });
    const [totpSetup, setTotpSetup] = useState(null);
    const [message, setMessage] = useState('');

    const load = useCallback(async () => {
        const expectedUser = getAuthenticatedUser()?.playerId;
        if (!expectedUser) return;
        setState((current) => ({ ...current, loading: current.status === null, error: '' }));
        try {
            const [status, devices, passkeys] = await Promise.all([
                securityApi.status(),
                securityApi.devices(),
                securityApi.passkeys()
            ]);
            if (getAuthenticatedUser()?.playerId === expectedUser) setState({ loading: false, status, devices, passkeys, error: '' });
        } catch (error) {
            if (getAuthenticatedUser()?.playerId === expectedUser) setState((current) => ({ ...current, loading: false, error: error.message }));
        }
    }, []);

    useEffect(() => {
        let active = true;
        fetchAuthenticatedUser().then((profile) => {
            if (!active) return;
            setUser(profile);
            if (profile) load();
            else setState((current) => ({ ...current, loading: false }));
        });
        const changed = () => {
            const profile = getAuthenticatedUser(); setUser(profile); setTotpSetup(null); setMessage('');
            if (profile) load();
            else setState({ loading: false, status: null, devices: [], passkeys: [], error: '' });
        };
        window.addEventListener('seriux-auth-changed', changed);
        return () => { active = false; window.removeEventListener('seriux-auth-changed', changed); };
    }, [load]);

    const sessionEnded = async text => {
        await logout(); setUser(null); setTotpSetup(null); setMessage(text);
    };
    const securityChanged = text => sessionEnded(`${text} Alle bisherigen Sitzungen wurden widerrufen. Bitte melde dich erneut an.`);

    if (!user)
        return (
            <ForumShell
                eyebrow="SERIUX-ID"
                title="Sicherheit"
                description="Melde dich an, um deine Zugangsdaten und Geräte zu verwalten."
                rootBreadcrumb={{ label: 'Sicherheit' }}
            >
                {message && <p className="mb-5 text-sm leading-6 text-zinc-300" role="status">{message}</p>}
                <button className="forum-button-primary" onClick={() => beginLogin('/me/settings/security')}>Anmelden</button>
            </ForumShell>
        );
    if (state.loading)
        return (
            <ForumShell title="Sicherheit" eyebrow="MEIN KONTO" rootBreadcrumb={{ label: 'Meine persönliche Ansicht', to: '/me' }}>
                <ForumLoading />
            </ForumShell>
        );
    if (state.error)
        return (
            <ForumShell title="Sicherheit" eyebrow="MEIN KONTO" rootBreadcrumb={{ label: 'Meine persönliche Ansicht', to: '/me' }}>
                <ForumError message={state.error} onRetry={load} />
                <button className="forum-button-primary mt-5" onClick={() => beginLogin('/me/settings/security', { reauthenticate: true })}>Website-Anmeldung erneuern</button>
            </ForumShell>
        );

    return (
        <ForumShell
            eyebrow="SERIUX-ID"
            title="Sicherheit"
            description="Verwalte dein Web-Passwort, die Zwei-Faktor-Anmeldung und alle aktiven Launcher- und Browser-Sitzungen."
            rootBreadcrumb={{ label: 'Meine persönliche Ansicht', to: '/me' }}
            breadcrumbs={[{ label: 'Sicherheit' }]}
        >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 p-5">
                <p className="text-sm text-zinc-400">Sensible Änderungen verlangen eine aktuelle Website-Anmeldung.</p>
                <button className="forum-button-secondary" onClick={() => beginLogin('/me/settings/security', { reauthenticate: true })}>Anmeldung erneuern</button>
            </div>
            {message && (
                <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[.07] px-5 py-4 text-sm text-emerald-300">
                    {message}
                </div>
            )}
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <PasswordPanel status={state.status} onChanged={securityChanged} />
                <TotpPanel
                    status={state.status}
                    setup={totpSetup}
                    setSetup={setTotpSetup}
                    onChanged={securityChanged}
                />
            </div>
            <PasskeyPanel
                passwordConfigured={state.status.passwordConfigured}
                passkeys={state.passkeys}
                onChanged={securityChanged}
            />
            <RecoveryPanel key={user.playerId} remaining={state.status.recoveryCodesRemaining}
                onGenerated={count => setState(current => ({ ...current, status: { ...current.status, recoveryCodesRemaining: count } }))} />
            <DevicePanel devices={state.devices} onChanged={load} onSessionEnded={sessionEnded} />
        </ForumShell>
    );
}

function PasskeyPanel({ passkeys, onChanged, passwordConfigured }) {
    const [name, setName] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [removeTarget, setRemoveTarget] = useState(null);
    const [removePassword, setRemovePassword] = useState('');
    const [removeCode, setRemoveCode] = useState('');

    const createPasskey = async () => {
        setError('');
        if (!window.PublicKeyCredential || !navigator.credentials) {
            setError('Dieser Browser unterstützt keine Passkeys.');
            return;
        }
        if (!name.trim()) {
            setError('Gib dem Passkey einen Gerätenamen.');
            return;
        }
        setBusy(true);
        try {
            const challenge = await securityApi.startPasskeyRegistration(name.trim());
            const credential = await navigator.credentials.create({
                publicKey: registrationOptions(challenge.publicKey)
            });
            await securityApi.finishPasskeyRegistration(challenge.challengeId, serializeCredential(credential));
            setName('');
            await onChanged('Der Passkey wurde sicher mit deiner Minecraft-UUID verknüpft.');
        } catch (reason) {
            setError(
                reason.name === 'NotAllowedError'
                    ? 'Die Passkey-Einrichtung wurde abgebrochen.'
                    : reason.message || 'Der Passkey konnte nicht eingerichtet werden.'
            );
        } finally {
            setBusy(false);
        }
    };

    const remove = async (passkey) => {
        setBusy(true);
        setError('');
        try {
            await securityApi.removePasskey(passkey.id, removePassword, removeCode, !passwordConfigured);
            setRemoveTarget(null);
            setRemovePassword('');
            setRemoveCode('');
            await onChanged('Der Passkey wurde entfernt.');
        } catch (reason) {
            setError(reason.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <section className="forum-panel mt-6 overflow-hidden rounded-3xl">
            <header className="flex flex-col gap-5 border-b border-white/[.06] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                <div className="flex items-start gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-500/10 text-orange-300">
                        <FaFingerprint />
                    </span>
                    <div>
                        <p className="eyebrow">PASSKEYS</p>
                        <h2 className="mt-1 font-display text-2xl font-bold">Kontaktlos anmelden</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                            Nutze Windows Hello, dein Smartphone oder einen Sicherheitsschlüssel. Der private Schlüssel verlässt dein Gerät nie.
                        </p>
                    </div>
                </div>
                <StatusBadge active={passkeys.length > 0} />
            </header>

            <div className="grid gap-3 p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-8">
                <label className="forum-label">
                    Gerätename
                    <input
                        className="forum-input"
                        maxLength="64"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="z. B. Windows Hello – Gaming-PC"
                    />
                </label>
                <button disabled={busy} onClick={createPasskey} className="forum-button-primary self-end">
                    <FaFingerprint /> Passkey hinzufügen
                </button>
            </div>

            {error && <p className="px-6 pb-6 text-sm text-red-300 sm:px-8">{error}</p>}
            {!passwordConfigured && <p className="px-6 pb-6 text-sm text-zinc-400 sm:px-8">Zum Entfernen brauchst du eine höchstens fünf Minuten alte Passkey-Anmeldung. Der letzte verwendbare Zugang bleibt geschützt — Wiederherstellungscodes zählen dafür nicht als Ersatz.</p>}
            {removeTarget && (
                <div className="mx-6 mb-6 rounded-2xl border border-red-500/20 bg-red-500/[.055] p-5 sm:mx-8">
                    <b className="text-sm text-red-200">„{removeTarget.name || 'Unbenannt'}“ entfernen</b>
                    <p className="mt-2 text-xs leading-5 text-zinc-400">{passwordConfigured ? 'Bestätige mit deinem Passwort und — falls aktiviert — deinem 2FA-Code.' : 'Bestätige mit deiner kürzlich erfolgten Passkey-Anmeldung. Falls nötig, erneuere sie über „Anmeldung erneuern“.'} Die Änderung meldet alle bisherigen Sitzungen ab.</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px_auto_auto]">
                        {passwordConfigured && <input aria-label="Passwort zur Bestätigung" className="forum-input mt-0" type="password" autoComplete="current-password" value={removePassword} onChange={(e) => setRemovePassword(e.target.value)} placeholder="Passwort" />}
                        {passwordConfigured && <input aria-label="2FA-Code zur Bestätigung" className="forum-input mt-0" inputMode="numeric" maxLength={6} value={removeCode} onChange={(e) => setRemoveCode(e.target.value.replace(/\D/g, ''))} placeholder="2FA-Code (falls aktiviert)" />}
                        <button className="rounded-xl bg-red-500 p-4 text-xs font-bold" disabled={busy || (passwordConfigured && !removePassword)} onClick={() => remove(removeTarget)}>Entfernen und abmelden</button>
                        <button className="forum-button-secondary" onClick={() => setRemoveTarget(null)}>Abbrechen</button>
                    </div>
                </div>
            )}
            {passkeys.length === 0 ? (
                <p className="border-t border-white/[.055] p-6 text-sm text-zinc-500 sm:px-8">
                    Noch kein Passkey eingerichtet. Die Anmeldung mit Minecraft-Name und Passwort bleibt verfügbar.
                </p>
            ) : (
                passkeys.map((passkey) => (
                    <div
                        key={passkey.id}
                        className="flex flex-col gap-4 border-t border-white/[.055] p-6 sm:flex-row sm:items-center sm:px-8"
                    >
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/[.04] text-orange-300">
                            <FaFingerprint />
                        </span>
                        <div className="min-w-0 flex-1">
                            <b className="text-zinc-100">{passkey.name || 'Unbenannter Passkey'}</b>
                            <p className="mt-2 text-xs text-zinc-500">
                                Erstellt {formatDate(passkey.registeredAt)}
                                {passkey.lastUsedAt ? ` · Zuletzt verwendet ${formatDate(passkey.lastUsedAt)}` : ''}
                                {passkey.backedUp ? ' · Synchronisiert' : ''}
                            </p>
                        </div>
                        <button title={!passwordConfigured && passkeys.length <= 1 ? 'Richte zuerst einen weiteren Passkey oder ein Passwort ein.' : undefined} disabled={busy || (!passwordConfigured && passkeys.length <= 1)} onClick={() => setRemoveTarget(passkey)} className="forum-button-secondary text-red-300">
                            <FaTrash /> Entfernen
                        </button>
                    </div>
                ))
            )}
        </section>
    );
}

function PasswordPanel({ status, onChanged }) {
    const [form, setForm] = useState({ current: '', next: '', confirm: '' });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const submit = async (event) => {
        event.preventDefault();
        setError('');
        if (form.next !== form.confirm) return setError('Die neuen Passwörter stimmen nicht überein.');
        if (new TextEncoder().encode(form.next).length > 72) return setError('Das Passwort darf höchstens 72 UTF-8-Bytes enthalten.');
        if (!window.confirm('Passwort speichern und alle bisherigen Sitzungen abmelden? Deine vorhandenen Passkeys bleiben erhalten.')) return;
        setSaving(true);
        try {
            if (status.passwordConfigured) await securityApi.changePassword(form.current, form.next);
            else await securityApi.setInitialPassword(form.next);
            setForm({ current: '', next: '', confirm: '' });
            await onChanged(status.passwordConfigured ? 'Dein Passwort wurde geändert.' : 'Dein zusätzliches Passwort wurde eingerichtet.');
        } catch (reason) {
            setError(reason.message);
        } finally {
            setSaving(false);
        }
    };
    return (
        <form onSubmit={submit} className="forum-panel rounded-3xl p-6 sm:p-8">
            <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-500/10 text-orange-300">
                    <FaKey />
                </span>
                <div>
                    <p className="eyebrow">PASSWORT</p>
                    <h2 className="mt-1 font-display text-2xl font-bold">{status.passwordConfigured ? 'Web-Zugang schützen' : 'Passwort ergänzen'}</h2>
                </div>
            </div>
            {!status.passwordConfigured && <p className="mt-5 text-sm leading-6 text-zinc-400">Dein Konto nutzt Passkeys. Mit einer höchstens fünf Minuten alten Passkey-Anmeldung kannst du ein zusätzliches Passwort einrichten. Ein bestehendes Passwort wird dabei niemals überschrieben.</p>}
            <div className="mt-7 grid gap-4">
                {status.passwordConfigured && <SecurityInput
                    label="Aktuelles Passwort"
                    value={form.current}
                    onChange={(current) => setForm({ ...form, current })}
                />}
                <SecurityInput
                    label="Neues Passwort (mindestens 12 Zeichen)"
                    value={form.next}
                    onChange={(next) => setForm({ ...form, next })}
                    minLength={12}
                    autoComplete="new-password"
                />
                <SecurityInput
                    label="Neues Passwort wiederholen"
                    value={form.confirm}
                    onChange={(confirm) => setForm({ ...form, confirm })}
                    minLength={12}
                    autoComplete="new-password"
                />
            </div>
            {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
            <button disabled={saving} className="forum-button-primary mt-6">
                <FaCheck /> {status.passwordConfigured ? 'Passwort ändern' : 'Passwort einrichten'}
            </button>
            <p className="mt-4 text-xs leading-5 text-zinc-500">Eine Passwortänderung widerruft alle bisherigen Sitzungen. Notfallzugang: Wiederherstellungscodes unten sichern.</p>
        </form>
    );
}

function TotpPanel({ status, setup, setSetup, onChanged }) {
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const run = async (task) => {
        setSaving(true);
        setError('');
        try {
            await task();
        } catch (reason) {
            setError(reason.message);
        } finally {
            setSaving(false);
        }
    };
    return (
        <section className="forum-panel rounded-3xl p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-500/10 text-orange-300">
                        <FaShieldHalved />
                    </span>
                    <div>
                        <p className="eyebrow">2-FAKTOR</p>
                        <h2 className="mt-1 font-display text-2xl font-bold">Authenticator-App</h2>
                    </div>
                </div>
                <StatusBadge active={status.twoFactorEnabled} />
            </div>
            <p className="mt-6 text-sm leading-6 text-zinc-500">
                Ein zeitbasierter Einmalcode wird zusätzlich zu deinem Passwort beim Web-Login verlangt.
            </p>
            {!status.passwordConfigured && <p className="mt-5 text-sm text-zinc-400">Authenticator-2FA ergänzt die Passwort-Anmeldung und wird bei diesem passwortlosen Konto nicht angeboten.</p>}
            {status.passwordConfigured && !status.twoFactorEnabled && !setup && (
                <button
                    disabled={saving}
                    onClick={() => run(async () => setSetup(await securityApi.setupTotp()))}
                    className="forum-button-primary mt-6"
                >
                    2FA einrichten
                </button>
            )}
            {!status.twoFactorEnabled && setup && (
                <div className="mt-6 rounded-2xl border border-orange-500/15 bg-orange-500/[.05] p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Schlüssel in der Authenticator-App hinterlegen
                    </p>
                    <code className="mt-3 block break-all rounded-xl bg-black/30 p-3 text-sm text-orange-200">
                        {setup.secret}
                    </code>
                    <label className="forum-label mt-5">
                        Bestätigungscode
                        <input
                            className="forum-input"
                            inputMode="numeric"
                            maxLength="6"
                            value={code}
                            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                        />
                    </label>
                    <button
                        disabled={saving || code.length !== 6}
                        onClick={() =>
                            run(() =>
                                securityApi
                                    .enableTotp(code)
                                    .then(() => onChanged('Zwei-Faktor-Anmeldung ist jetzt aktiv.'))
                            )
                        }
                        className="forum-button-primary mt-5"
                    >
                        Aktivieren
                    </button>
                </div>
            )}
            {status.twoFactorEnabled && (
                <div className="mt-6 grid gap-4">
                    <SecurityInput label="Passwort zur Bestätigung" value={password} onChange={setPassword} />
                    <label className="forum-label">
                        Aktueller Sicherheitscode
                        <input
                            className="forum-input"
                            inputMode="numeric"
                            maxLength="6"
                            value={code}
                            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                        />
                    </label>
                    <button
                        disabled={saving || code.length !== 6 || !password}
                        onClick={() =>
                            run(() =>
                                securityApi
                                    .disableTotp(password, code)
                                    .then(() => onChanged('Zwei-Faktor-Anmeldung wurde deaktiviert.'))
                            )
                        }
                        className="forum-button-secondary justify-self-start text-red-300"
                    >
                        2FA deaktivieren
                    </button>
                </div>
            )}
            {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
        </section>
    );
}

function RecoveryPanel({ remaining, onGenerated }) {
    const [codes, setCodes] = useState([]);
    const [confirmed, setConfirmed] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const generate = async () => {
        if (!confirmed || busy) return;
        setBusy(true); setError('');
        try {
            const next = await securityApi.generateRecoveryCodes();
            if (next.length !== 10) throw new Error('Die Codes wurden nicht vollständig zurückgegeben. Bitte erneut erzeugen.');
            setCodes(next); setConfirmed(false); onGenerated(next.length);
        } catch (reason) { setError(reason.message); }
        finally { setBusy(false); }
    };
    return <section className="forum-panel mt-6 rounded-3xl p-6 sm:p-8">
        <p className="eyebrow">NOTFALLZUGANG</p>
        <h2 className="mt-2 font-display text-2xl font-bold">Wiederherstellungscodes</h2>
        <p className="mt-4 text-sm leading-6 text-zinc-400">{remaining === 0 ? 'Noch keine Codes eingerichtet.' : `${remaining} unverbrauchte Codes vorhanden.`} Sichere sie getrennt von deinen Anmeldegeräten. Die vollständigen Codes werden nur einmal angezeigt und niemals im Browser gespeichert.</p>
        <p className="mt-3 text-sm leading-6 text-zinc-400">Eine Wiederherstellung setzt ein neues Passwort, entfernt alle bisherigen Passkeys und den Authenticator, entwertet das gesamte alte Code-Set und widerruft alle alten Sitzungen. Deine Minecraft-UUID und deine Kontodaten bleiben erhalten.</p>
        {codes.length > 0 ? <div className="mt-6 rounded-2xl border border-orange-500/20 bg-orange-500/[.05] p-5">
            <p className="text-sm font-bold text-orange-200" role="status">Jetzt sicher aufbewahren — diese Anzeige lässt sich nicht wieder öffnen.</p>
            <ol className="mt-4 grid gap-3 font-mono text-xs sm:grid-cols-2">
                {codes.map(code => <li key={code}><code className="block select-all break-all rounded-lg bg-black/25 p-3">{code}</code></li>)}
            </ol>
            <button className="forum-button-secondary mt-5" onClick={() => setCodes([])}>Ich habe die Codes sicher aufbewahrt</button>
        </div> : <div className="mt-6">
            <label className="flex items-start gap-3 text-sm leading-6 text-zinc-400">
                <input className="mt-1.5" type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />
                <span>Ich kann die Codes jetzt sicher aufbewahren. Neue Codes ersetzen alle bisherigen Codes.</span>
            </label>
            <button className="forum-button-primary mt-5" disabled={busy || !confirmed} onClick={generate}>{busy ? 'Codes werden erzeugt …' : 'Zehn neue Codes erzeugen'}</button>
        </div>}
        {error && <p className="mt-4 text-sm text-red-300" role="alert">{error}</p>}
        <a className="mt-5 inline-block text-sm text-orange-300 underline" href="https://auth.seriuxmod.net/login/recovery">Zur Wiederherstellung mit einem gesicherten Code</a>
    </section>;
}

function DevicePanel({ devices, onChanged, onSessionEnded }) {
    const [busy, setBusy] = useState('');
    const [error, setError] = useState('');
    const revoke = async (deviceId) => {
        if (
            !window.confirm(
                'Dieses Gerät und seine Browser-/Launcher-Sitzungen wirklich abmelden? Andere Geräte bleiben angemeldet.'
            )
        )
            return;
        setBusy(deviceId);
        setError('');
        try {
            await securityApi.revokeDevice(deviceId);
            if (devices.some(device => device.deviceId === deviceId && device.current)) await onSessionEnded('Dieses Gerät wurde abgemeldet. Bitte melde dich erneut an.');
            else await onChanged();
        } catch (reason) {
            setError(reason.message);
        } finally {
            setBusy('');
        }
    };
    const revokeOthers = async () => {
        if (!window.confirm('Alle anderen Geräte abmelden? Dieses Gerät bleibt angemeldet.')) return;
        setBusy('others'); setError('');
        try { await securityApi.revokeOthers(); await onChanged(); }
        catch (reason) { setError(reason.message); }
        finally { setBusy(''); }
    };
    return (
        <section className="forum-panel mt-6 overflow-hidden rounded-3xl">
            <header className="flex items-center gap-4 border-b border-white/[.06] p-6 sm:p-8">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500/10 text-orange-300">
                    <FaComputer />
                </span>
                <div>
                    <p className="eyebrow">SITZUNGEN</p>
                    <h2 className="mt-1 font-display text-2xl font-bold">Verbundene Geräte</h2>
                </div>
            </header>
            <div className="p-6 sm:px-8">
                <p className="text-sm leading-6 text-zinc-400">„Dieses Gerät“ wird serverseitig aus der bestätigten Sitzung ermittelt — nicht aus einer frei übermittelten Gerätekennung.</p>
                <button className="forum-button-secondary mt-4" disabled={Boolean(busy) || !devices.some(device => device.current)} onClick={revokeOthers}>Alle anderen Geräte abmelden</button>
                {error && <p className="mt-4 text-sm text-red-300" role="alert">{error}</p>}
            </div>
            {devices.length === 0 ? (
                <p className="p-8 text-sm text-zinc-500">
                    Noch keine Geräteinformationen vorhanden. Sie werden bei der nächsten Anmeldung erfasst.
                </p>
            ) : (
                devices.map((device) => (
                    <div
                        key={device.deviceId}
                        className="flex flex-col gap-5 border-b border-white/[.055] p-6 last:border-0 sm:flex-row sm:items-center sm:px-8"
                    >
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/[.04] text-zinc-400">
                            {device.deviceName?.includes('Launcher') ? <FaLaptop /> : <FaMobileScreen />}
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                                <b className="text-zinc-100">{device.deviceName || 'Unbekanntes Gerät'}</b>
                                <StatusBadge active={device.active} />
                                {device.current && <span className="text-xs font-bold text-orange-300">Dieses Gerät</span>}
                            </div>
                            <p className="mt-2 text-xs text-zinc-500">
                                {device.osName || 'Unbekanntes System'}
                                {device.appVersion ? ` · Version ${device.appVersion}` : ''} · {device.clientId}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-600">
                                <span className="flex items-center gap-2">
                                    <FaLocationDot /> {device.city}, {device.country}
                                </span>
                                <span className="flex items-center gap-2">
                                    <FaClockRotateLeft /> {formatDate(device.lastSeenAt)}
                                </span>
                            </div>
                        </div>
                        {device.active && (
                            <button
                                disabled={Boolean(busy)}
                                onClick={() => revoke(device.deviceId)}
                                className="forum-button-secondary text-red-300"
                            >
                                <FaTrash /> Sitzung beenden
                            </button>
                        )}
                    </div>
                ))
            )}
        </section>
    );
}

function SecurityInput({ label, value, onChange, minLength, autoComplete = 'current-password' }) {
    return (
        <label className="forum-label">
            {label}
            <input
                className="forum-input"
                type="password"
                autoComplete={autoComplete}
                maxLength={autoComplete === 'new-password' ? 72 : 256}
                required
                minLength={minLength}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </label>
    );
}

function StatusBadge({ active }) {
    return (
        <span
            className={`rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider ${active ? 'border-emerald-500/20 bg-emerald-500/[.08] text-emerald-300' : 'border-white/[.07] bg-white/[.03] text-zinc-600'}`}
        >
            {active ? 'Aktiv' : 'Inaktiv'}
        </span>
    );
}

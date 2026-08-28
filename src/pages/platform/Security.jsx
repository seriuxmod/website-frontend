import { useCallback, useEffect, useState } from 'react';
import {
    FaCheck,
    FaClockRotateLeft,
    FaComputer,
    FaKey,
    FaLaptop,
    FaLocationDot,
    FaMobileScreen,
    FaShieldHalved,
    FaTrash
} from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import { fetchAuthenticatedUser, getAuthenticatedUser } from '../../lib/auth';
import { securityApi } from '../../lib/securityApi';
import { ForumError, ForumLoading, ForumShell, formatDate } from '../forum/ForumComponents';

export default function Security() {
    const [user, setUser] = useState(() => getAuthenticatedUser());
    const [state, setState] = useState({ loading: true, status: null, devices: [], error: '' });
    const [totpSetup, setTotpSetup] = useState(null);
    const [message, setMessage] = useState('');

    const load = useCallback(async () => {
        setState((current) => ({ ...current, loading: true, error: '' }));
        try {
            const [status, devices] = await Promise.all([securityApi.status(), securityApi.devices()]);
            setState({ loading: false, status, devices, error: '' });
        } catch (error) {
            setState((current) => ({ ...current, loading: false, error: error.message }));
        }
    }, []);

    useEffect(() => {
        fetchAuthenticatedUser().then((profile) => {
            setUser(profile);
            if (profile) load();
            else setState((current) => ({ ...current, loading: false }));
        });
    }, [load]);

    if (!user)
        return (
            <ForumShell
                eyebrow="SERIUX-ID"
                title="Sicherheit"
                description="Melde dich an, um deine Zugangsdaten und Geräte zu verwalten."
                rootBreadcrumb={{ label: 'Sicherheit' }}
            >
                <Link className="forum-button-primary" to="/">
                    Zur Startseite
                </Link>
            </ForumShell>
        );
    if (state.loading)
        return (
            <ForumShell title="Sicherheit">
                <ForumLoading />
            </ForumShell>
        );
    if (state.error)
        return (
            <ForumShell title="Sicherheit">
                <ForumError message={state.error} onRetry={load} />
            </ForumShell>
        );

    return (
        <ForumShell
            eyebrow="SERIUX-ID"
            title="Sicherheit"
            description="Verwalte dein Web-Passwort, die Zwei-Faktor-Anmeldung und alle aktiven Launcher- und Browser-Sitzungen."
            rootBreadcrumb={{ label: 'Mein Konto' }}
            breadcrumbs={[{ label: 'Sicherheit' }]}
        >
            {message && (
                <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[.07] px-5 py-4 text-sm text-emerald-300">
                    {message}
                </div>
            )}
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <PasswordPanel status={state.status} onMessage={setMessage} />
                <TotpPanel
                    status={state.status}
                    setup={totpSetup}
                    setSetup={setTotpSetup}
                    onChanged={async (text) => {
                        setMessage(text);
                        setTotpSetup(null);
                        await load();
                    }}
                />
            </div>
            <DevicePanel devices={state.devices} onChanged={load} />
        </ForumShell>
    );
}

function PasswordPanel({ status, onMessage }) {
    const [form, setForm] = useState({ current: '', next: '', confirm: '' });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [resetSending, setResetSending] = useState(false);
    const submit = async (event) => {
        event.preventDefault();
        setError('');
        if (form.next !== form.confirm) return setError('Die neuen Passwörter stimmen nicht überein.');
        setSaving(true);
        try {
            await securityApi.changePassword(form.current, form.next);
            setForm({ current: '', next: '', confirm: '' });
            onMessage('Dein Passwort wurde geändert.');
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
                    <h2 className="mt-1 font-display text-2xl font-bold">Web-Zugang schützen</h2>
                </div>
            </div>
            <div className="mt-7 grid gap-4">
                <SecurityInput
                    label="Aktuelles Passwort"
                    value={form.current}
                    onChange={(current) => setForm({ ...form, current })}
                />
                <SecurityInput
                    label="Neues Passwort (mindestens 12 Zeichen)"
                    value={form.next}
                    onChange={(next) => setForm({ ...form, next })}
                    minLength={12}
                />
                <SecurityInput
                    label="Neues Passwort wiederholen"
                    value={form.confirm}
                    onChange={(confirm) => setForm({ ...form, confirm })}
                    minLength={12}
                />
            </div>
            {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
            <button disabled={saving} className="forum-button-primary mt-6">
                <FaCheck /> Passwort ändern
            </button>
            {status.recoveryEmail && (
                <div className="mt-6 border-t border-white/[.06] pt-5">
                    <p className="text-xs leading-5 text-zinc-600">
                        Passwort vergessen? Wir senden den Reset-Link an{' '}
                        <b className="text-zinc-400">{status.recoveryEmail}</b>.
                    </p>
                    <button
                        type="button"
                        disabled={resetSending}
                        onClick={async () => {
                            setResetSending(true);
                            setError('');
                            try {
                                await securityApi.requestPasswordReset(status.recoveryEmail);
                                onMessage('Der Passwort-Reset wurde an deine Wiederherstellungs-E-Mail gesendet.');
                            } catch (reason) {
                                setError(reason.message);
                            } finally {
                                setResetSending(false);
                            }
                        }}
                        className="forum-button-secondary mt-4"
                    >
                        <FaClockRotateLeft /> Reset-Link senden
                    </button>
                </div>
            )}
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
            {!status.twoFactorEnabled && !setup && (
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

function DevicePanel({ devices, onChanged }) {
    const [busy, setBusy] = useState('');
    const revoke = async (deviceId) => {
        if (
            !window.confirm(
                'Diese Sitzung wirklich abmelden? Der Launcher muss sich anschließend erneut mit Microsoft verbinden.'
            )
        )
            return;
        setBusy(deviceId);
        try {
            await securityApi.revokeDevice(deviceId);
            await onChanged();
        } finally {
            setBusy('');
        }
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
                                <StatusBadge active={!device.revokedAt} />
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
                        {!device.revokedAt && (
                            <button
                                disabled={busy === device.deviceId}
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

function SecurityInput({ label, value, onChange, minLength }) {
    return (
        <label className="forum-label">
            {label}
            <input
                className="forum-input"
                type="password"
                autoComplete="current-password"
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

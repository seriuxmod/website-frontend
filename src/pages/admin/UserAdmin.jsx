import { useEffect, useState } from 'react';
import {
    FaBan,
    FaClockRotateLeft,
    FaFloppyDisk,
    FaGavel,
    FaMagnifyingGlass,
    FaPlus,
    FaShieldHalved,
    FaTrashCan,
    FaUserGear,
    FaUsers,
    FaVolumeXmark,
    FaXmark
} from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import { fetchAuthenticatedUser, getAuthenticatedUser, isUserAdministrator } from '../../lib/auth';
import { playerAvatar } from '../../lib/userApi';
import { userAdminApi } from '../../lib/userAdminApi';

const emptyGroup = {
    key: '',
    displayName: '',
    description: '',
    badgeUrl: '',
    permissions: [],
    color: 16747520,
    defaultGroup: false,
    priority: 0
};
const emptyReason = { key: '', description: '', permanent: false, defaultDurationSeconds: 86400 };
const list = (page) => page?.content ?? [];
const when = (value) =>
    value
        ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
        : 'dauerhaft';

export default function UserAdmin() {
    const [user, setUser] = useState(() => getAuthenticatedUser());
    const [checking, setChecking] = useState(true);
    const [tab, setTab] = useState('users');
    const [groups, setGroups] = useState([]);
    const [banReasons, setBanReasons] = useState([]);
    const [muteReasons, setMuteReasons] = useState([]);
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');

    const reloadConfiguration = async () => {
        const [groupResult, banResult, muteResult] = await Promise.all([
            userAdminApi.groups(),
            userAdminApi.banReasons(),
            userAdminApi.muteReasons()
        ]);
        setGroups(groupResult ?? []);
        setBanReasons(list(banResult));
        setMuteReasons(list(muteResult));
    };

    useEffect(() => {
        fetchAuthenticatedUser().then(async (profile) => {
            setUser(profile);
            if (isUserAdministrator(profile)) {
                try {
                    await reloadConfiguration();
                } catch (failure) {
                    setError(failure.message);
                }
            }
            setChecking(false);
        });
    }, []);

    const action = async (work, success) => {
        setError('');
        setNotice('');
        try {
            const result = await work();
            setNotice(success);
            return result;
        } catch (failure) {
            setError(failure.message);
            throw failure;
        }
    };

    if (checking)
        return (
            <AdminFrame>
                <StateCard text="Berechtigungen werden geprüft …" />
            </AdminFrame>
        );
    if (!isUserAdministrator(user))
        return (
            <AdminFrame>
                <StateCard text="Dieser Bereich ist ausschließlich für die Benutzerverwaltung freigegeben." />
            </AdminFrame>
        );

    return (
        <AdminFrame>
            <header className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
                <div>
                    <Link to="/admin" className="text-xs font-bold text-zinc-600 transition hover:text-orange-300">
                        Administration / Benutzer
                    </Link>
                    <p className="eyebrow mt-6">IDENTITY & TRUST</p>
                    <h1 className="mt-2 font-display text-4xl font-bold tracking-[-.04em] sm:text-5xl">
                        Benutzerverwaltung
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500">
                        Konten, Ränge, individuelle Rechte und Moderation zentral verwalten. Änderungen greifen
                        unmittelbar im User-Service.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Tab active={tab === 'users'} onClick={() => setTab('users')} icon={FaUsers}>
                        Benutzer
                    </Tab>
                    <Tab active={tab === 'groups'} onClick={() => setTab('groups')} icon={FaShieldHalved}>
                        Gruppen
                    </Tab>
                    <Tab active={tab === 'moderation'} onClick={() => setTab('moderation')} icon={FaGavel}>
                        Moderation
                    </Tab>
                </div>
            </header>
            {(notice || error) && (
                <div
                    className={`mb-6 rounded-2xl border px-5 py-4 text-sm ${error ? 'border-red-500/20 bg-red-500/[.07] text-red-200' : 'border-emerald-500/20 bg-emerald-500/[.07] text-emerald-200'}`}
                >
                    {error || notice}
                </div>
            )}
            {tab === 'users' && (
                <UsersPanel groups={groups} banReasons={banReasons} muteReasons={muteReasons} action={action} />
            )}
            {tab === 'groups' && <GroupsPanel groups={groups} reload={reloadConfiguration} action={action} />}
            {tab === 'moderation' && (
                <ModerationPanel
                    banReasons={banReasons}
                    muteReasons={muteReasons}
                    reload={reloadConfiguration}
                    action={action}
                />
            )}
        </AdminFrame>
    );
}

function AdminFrame({ children }) {
    return <div className="text-white">{children}</div>;
}

function Tab({ active, onClick, icon: Icon, children }) {
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition ${active ? 'border-orange-500/25 bg-orange-500/10 text-orange-300' : 'border-white/[.07] bg-white/[.025] text-zinc-500 hover:text-white'}`}
        >
            <Icon />
            {children}
        </button>
    );
}

function StateCard({ text }) {
    return <div className="rounded-3xl border border-white/[.07] bg-[#111218] p-10 text-sm text-zinc-500">{text}</div>;
}

function UsersPanel({ groups, banReasons, muteReasons, action }) {
    const [query, setQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [selected, setSelected] = useState(null);
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(false);

    const search = async () => {
        setLoading(true);
        try {
            const page = await userAdminApi.users(query);
            setUsers(list(page));
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        search();
    }, []);

    const open = async (account) => {
        setSelected(account);
        setLoading(true);
        const optional = (promise) =>
            promise.catch((failure) => (failure.status === 404 ? null : Promise.reject(failure)));
        try {
            const [freshAccount, permissions, audits, activeBan, activeMute, banHistory, muteHistory] =
                await Promise.all([
                    userAdminApi.user(account.id),
                    userAdminApi.permissions(account.id),
                    userAdminApi.audits(account.id),
                    optional(userAdminApi.activeBan(account.id)),
                    optional(userAdminApi.activeMute(account.id)),
                    userAdminApi.banHistory(account.id),
                    userAdminApi.muteHistory(account.id)
                ]);
            setSelected(freshAccount);
            setDetail({ permissions, audits, activeBan, activeMute, banHistory, muteHistory });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid min-h-[720px] gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="self-start rounded-3xl border border-white/[.075] bg-[#111218] p-4 xl:sticky xl:top-32">
                <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        search();
                    }}
                >
                    <label className="flex flex-1 items-center gap-3 rounded-2xl border border-white/[.08] bg-black/20 px-4">
                        <FaMagnifyingGlass className="text-zinc-700" />
                        <input
                            className="min-w-0 flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-zinc-700"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Name suchen …"
                        />
                    </label>
                    <button className="forum-icon-button h-auto w-12" aria-label="Suchen">
                        <FaMagnifyingGlass />
                    </button>
                </form>
                <div className="mt-4 max-h-[620px] space-y-1 overflow-y-auto pr-1">
                    {users.map((account) => (
                        <button
                            key={account.id}
                            onClick={() => open(account)}
                            className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${selected?.id === account.id ? 'bg-orange-500/10' : 'hover:bg-white/[.035]'}`}
                        >
                            <img
                                className="h-11 w-11 rounded-xl [image-rendering:pixelated]"
                                src={playerAvatar(account.id)}
                                alt=""
                            />
                            <span className="min-w-0 flex-1">
                                <b className="block truncate text-sm">{account.username}</b>
                                <small className="block truncate text-[10px] text-zinc-600">{account.id}</small>
                            </span>
                            <span
                                className={`h-2 w-2 rounded-full ${account.locked ? 'bg-red-400' : 'bg-emerald-400'}`}
                            />
                        </button>
                    ))}
                    {!users.length && (
                        <p className="p-5 text-center text-xs text-zinc-600">
                            {loading ? 'Wird geladen …' : 'Keine Benutzer gefunden.'}
                        </p>
                    )}
                </div>
            </aside>
            <section>
                {selected && detail ? (
                    <UserDetail
                        account={selected}
                        initial={detail}
                        groups={groups}
                        banReasons={banReasons}
                        muteReasons={muteReasons}
                        action={action}
                        reload={() => open(selected)}
                    />
                ) : (
                    <div className="grid min-h-[520px] place-items-center rounded-3xl border border-dashed border-white/[.08] bg-white/[.012] text-center">
                        <div>
                            <FaUserGear className="mx-auto text-4xl text-zinc-800" />
                            <h2 className="mt-5 font-display text-2xl font-bold">Benutzer auswählen</h2>
                            <p className="mt-2 text-sm text-zinc-600">
                                Kontodetails und Werkzeuge erscheinen hier mit ausreichend Platz.
                            </p>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}

function UserDetail({ account, initial, groups, banReasons, muteReasons, action, reload }) {
    const [direct, setDirect] = useState((initial.permissions.userPermissions ?? []).join('\n'));
    const [groupKey, setGroupKey] = useState(groups[0]?.key ?? '');
    const [expiresAt, setExpiresAt] = useState('');
    const [reason, setReason] = useState('');
    const assignments = initial.permissions.assignedGroups ?? [];
    const activeGroups = assignments.filter((entry) => entry.active);
    const saveDirect = () =>
        action(
            () =>
                userAdminApi.setDirectPermissions(
                    account.id,
                    direct
                        .split(/\s+/)
                        .map((v) => v.trim())
                        .filter(Boolean)
                ),
            'Direkte Berechtigungen gespeichert.'
        ).then(reload);
    const assign = () =>
        action(
            () =>
                userAdminApi.assignGroup(account.id, {
                    groupKey,
                    startsAt: null,
                    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
                    source: 'ADMIN_PORTAL',
                    sourceReference: null
                }),
            'Gruppe zugewiesen.'
        ).then(reload);
    const lock = () =>
        action(
            () => userAdminApi.lock(account.id, !account.locked, reason),
            account.locked ? 'Konto entsperrt.' : 'Konto gesperrt und Sitzungen widerrufen.'
        ).then(reload);
    return (
        <div className="space-y-6">
            <article className="rounded-3xl border border-white/[.075] bg-gradient-to-br from-[#17191f] to-[#0f1015] p-6 sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                    <img
                        className="h-24 w-24 rounded-3xl [image-rendering:pixelated]"
                        src={playerAvatar(account.id, 128)}
                        alt=""
                    />
                    <div className="min-w-0 flex-1">
                        <p className="eyebrow">MINECRAFT ACCOUNT</p>
                        <h2 className="mt-2 truncate font-display text-4xl font-bold">{account.username}</h2>
                        <p className="mt-2 break-all font-mono text-xs text-zinc-600">{account.id}</p>
                    </div>
                    <span
                        className={`rounded-full border px-4 py-2 text-xs font-bold ${account.locked ? 'border-red-500/25 bg-red-500/10 text-red-300' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'}`}
                    >
                        {account.locked ? 'Gesperrt' : 'Aktiv'}
                    </span>
                </div>
                <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <input
                        className="forum-input mt-0"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Interne Begründung für die Kontostatusänderung"
                    />
                    <button
                        onClick={lock}
                        className={
                            account.locked
                                ? 'forum-button-secondary'
                                : 'rounded-xl bg-red-500/80 px-5 text-xs font-bold hover:bg-red-400'
                        }
                    >
                        {account.locked ? 'Konto entsperren' : 'Konto sperren'}
                    </button>
                </div>
            </article>
            <div className="grid gap-6 2xl:grid-cols-2">
                <Panel title="Gruppen & Laufzeiten" icon={FaShieldHalved}>
                    <div className="space-y-3">
                        {activeGroups.map((entry) => (
                            <div
                                key={`${entry.groupKey}-${entry.assignedAt}`}
                                className="flex items-center justify-between gap-4 rounded-2xl border border-white/[.06] bg-black/15 p-4"
                            >
                                <div>
                                    <b className="text-sm">{entry.groupKey}</b>
                                    <p className="mt-1 text-xs text-zinc-600">bis {when(entry.expiresAt)}</p>
                                </div>
                                <button
                                    onClick={() =>
                                        action(
                                            () => userAdminApi.removeGroup(account.id, entry.groupKey),
                                            'Gruppe entfernt.'
                                        ).then(reload)
                                    }
                                    className="forum-icon-button"
                                >
                                    <FaXmark />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                        <select
                            className="forum-input mt-0"
                            value={groupKey}
                            onChange={(e) => setGroupKey(e.target.value)}
                        >
                            {groups.map((g) => (
                                <option key={g.key} value={g.key}>
                                    {g.displayName}
                                </option>
                            ))}
                        </select>
                        <input
                            className="forum-input mt-0"
                            type="datetime-local"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                        />
                        <button className="forum-button-primary" onClick={assign}>
                            <FaPlus /> Zuweisen
                        </button>
                    </div>
                </Panel>
                <Panel title="Direkte Berechtigungen" icon={FaUserGear}>
                    <textarea
                        className="forum-input mt-0 min-h-48 font-mono"
                        value={direct}
                        onChange={(e) => setDirect(e.target.value)}
                        placeholder="users.example&#10;forum.example"
                    />
                    <button className="forum-button-primary mt-4" onClick={saveDirect}>
                        <FaFloppyDisk /> Speichern
                    </button>
                </Panel>
            </div>
            <ModerationActions
                account={account}
                initial={initial}
                banReasons={banReasons}
                muteReasons={muteReasons}
                action={action}
                reload={reload}
            />
            <ModerationHistory banHistory={initial.banHistory} muteHistory={initial.muteHistory} />
            <Panel title="Audit-Verlauf" icon={FaClockRotateLeft}>
                <div className="divide-y divide-white/[.05]">
                    {list(initial.audits).map((entry) => (
                        <div key={entry.id} className="grid gap-2 py-4 text-xs sm:grid-cols-[190px_1fr_auto]">
                            <b>{entry.action}</b>
                            <span className="text-zinc-500">
                                {Object.entries(entry.details ?? {})
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join(' · ') || 'Keine Zusatzdaten'}
                            </span>
                            <time className="text-zinc-700">{when(entry.timestamp)}</time>
                        </div>
                    ))}
                </div>
            </Panel>
        </div>
    );
}

function ModerationActions({ account, initial, banReasons, muteReasons, action, reload }) {
    const [banKey, setBanKey] = useState(banReasons[0]?.key ?? '');
    const [muteKey, setMuteKey] = useState(muteReasons[0]?.key ?? '');
    const [note, setNote] = useState('');
    const apply = (type) =>
        action(
            () =>
                type === 'ban'
                    ? userAdminApi.ban({ userId: account.id, reasonKey: banKey, customDurationSeconds: null, note })
                    : userAdminApi.mute({ userId: account.id, reasonKey: muteKey, customDurationSeconds: null, note }),
            type === 'ban' ? 'Ban erstellt und Sitzungen widerrufen.' : 'Mute erstellt.'
        ).then(reload);
    return (
        <Panel title="Moderation" icon={FaGavel}>
            <div className="grid gap-5 xl:grid-cols-2">
                <ModerationBox
                    title="Ban"
                    icon={FaBan}
                    active={initial.activeBan}
                    reasons={banReasons}
                    value={banKey}
                    setValue={setBanKey}
                    note={note}
                    setNote={setNote}
                    onApply={() => apply('ban')}
                    onRevoke={() =>
                        action(() => userAdminApi.revokeBan(initial.activeBan.id, note), 'Ban aufgehoben.').then(reload)
                    }
                />
                <ModerationBox
                    title="Mute"
                    icon={FaVolumeXmark}
                    active={initial.activeMute}
                    reasons={muteReasons}
                    value={muteKey}
                    setValue={setMuteKey}
                    note={note}
                    setNote={setNote}
                    onApply={() => apply('mute')}
                    onRevoke={() =>
                        action(() => userAdminApi.revokeMute(initial.activeMute.id, note), 'Mute aufgehoben.').then(
                            reload
                        )
                    }
                />
            </div>
        </Panel>
    );
}

function ModerationBox({ title, icon: Icon, active, reasons, value, setValue, note, setNote, onApply, onRevoke }) {
    return (
        <div
            className={`rounded-2xl border p-5 ${active ? 'border-red-500/20 bg-red-500/[.055]' : 'border-white/[.06] bg-black/15'}`}
        >
            <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold">
                    <Icon className="text-orange-400" />
                    {title}
                </h3>
                <span className="text-xs text-zinc-600">
                    {active ? `Aktiv bis ${when(active.expiresAt)}` : 'Nicht aktiv'}
                </span>
            </div>
            {!active && (
                <>
                    <select className="forum-input" value={value} onChange={(e) => setValue(e.target.value)}>
                        {reasons.map((r) => (
                            <option key={r.key} value={r.key}>
                                {r.description}
                            </option>
                        ))}
                    </select>
                    <input
                        className="forum-input"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Interne Notiz"
                    />
                    <button className="forum-button-primary mt-4" onClick={onApply}>
                        {title} setzen
                    </button>
                </>
            )}
            {active && (
                <button className="forum-button-secondary mt-5" onClick={onRevoke}>
                    {title} aufheben
                </button>
            )}
        </div>
    );
}

function ModerationHistory({ banHistory, muteHistory }) {
    return (
        <Panel title="Moderationsverlauf" icon={FaClockRotateLeft}>
            <div className="grid gap-6 xl:grid-cols-2">
                <HistoryList title="Bans" entries={list(banHistory)} />
                <HistoryList title="Mutes" entries={list(muteHistory)} />
            </div>
        </Panel>
    );
}

function HistoryList({ title, entries }) {
    return (
        <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[.14em] text-zinc-600">{title}</h3>
            <div className="max-h-72 divide-y divide-white/[.05] overflow-y-auto rounded-2xl border border-white/[.055] bg-black/15 px-4">
                {entries.map((entry) => (
                    <div key={entry.id} className="grid gap-1 py-4 text-xs sm:grid-cols-[100px_1fr_auto]">
                        <b className="text-zinc-300">{entry.action}</b>
                        <span className="min-w-0 truncate text-zinc-600">
                            {entry.reasonKey || '–'}
                            {entry.note ? ` · ${entry.note}` : ''}
                        </span>
                        <time className="text-zinc-700">{when(entry.createdAt)}</time>
                    </div>
                ))}
                {!entries.length && <p className="py-6 text-center text-xs text-zinc-700">Noch keine Einträge.</p>}
            </div>
        </section>
    );
}

function GroupsPanel({ groups, reload, action }) {
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyGroup);
    const choose = (group) => {
        setEditing(group?.key ?? null);
        setForm(group ? { ...group, permissions: group.permissions ?? [] } : emptyGroup);
    };
    const save = () =>
        action(
            () => (editing ? userAdminApi.updateGroup(editing, form) : userAdminApi.createGroup(form)),
            editing ? 'Gruppe aktualisiert.' : 'Gruppe erstellt.'
        ).then(async () => {
            await reload();
            choose(null);
        });
    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_520px]">
            <div className="grid content-start gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {[...groups]
                    .sort((a, b) => b.priority - a.priority)
                    .map((group) => (
                        <button
                            key={group.key}
                            onClick={() => choose(group)}
                            className="rounded-3xl border border-white/[.075] bg-[#111218] p-6 text-left transition hover:border-orange-500/25"
                        >
                            <div className="flex items-start justify-between">
                                <img className="h-12 w-12 object-contain" src={group.badgeUrl} alt="" />
                                <b className="text-xs text-zinc-600">#{group.priority}</b>
                            </div>
                            <h2 className="mt-6 font-display text-2xl font-bold">{group.displayName}</h2>
                            <p className="mt-2 min-h-10 text-xs leading-5 text-zinc-600">{group.description}</p>
                            <div className="mt-5 flex justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-700">
                                <span>{group.permissions?.length ?? 0} Rechte</span>
                                {group.defaultGroup && <span className="text-orange-300">Standard</span>}
                            </div>
                        </button>
                    ))}
            </div>
            <Panel title={editing ? `${form.displayName} bearbeiten` : 'Neue Gruppe'} icon={FaShieldHalved}>
                <GroupForm form={form} setForm={setForm} />
                <div className="mt-5 flex flex-wrap gap-3">
                    <button className="forum-button-primary" onClick={save}>
                        <FaFloppyDisk /> Speichern
                    </button>
                    <button className="forum-button-secondary" onClick={() => choose(null)}>
                        Neu
                    </button>
                    {editing && !form.defaultGroup && (
                        <button
                            className="rounded-xl border border-red-500/20 px-4 py-3 text-xs font-bold text-red-300"
                            onClick={() =>
                                action(() => userAdminApi.deleteGroup(editing), 'Gruppe gelöscht.').then(async () => {
                                    await reload();
                                    choose(null);
                                })
                            }
                        >
                            Löschen
                        </button>
                    )}
                </div>
            </Panel>
        </div>
    );
}

function GroupForm({ form, setForm }) {
    const field = (key) => (e) => setForm({ ...form, [key]: e.target.value });
    return (
        <div className="grid gap-4">
            <label className="forum-label">
                Technischer Key
                <input className="forum-input" disabled={Boolean(form.id)} value={form.key} onChange={field('key')} />
            </label>
            <label className="forum-label">
                Anzeigename
                <input className="forum-input" value={form.displayName} onChange={field('displayName')} />
            </label>
            <label className="forum-label">
                Beschreibung
                <textarea
                    className="forum-input min-h-24"
                    value={form.description ?? ''}
                    onChange={field('description')}
                />
            </label>
            <label className="forum-label">
                Badge URL
                <input className="forum-input" value={form.badgeUrl ?? ''} onChange={field('badgeUrl')} />
            </label>
            <div className="grid grid-cols-2 gap-4">
                <label className="forum-label">
                    Priorität
                    <input
                        className="forum-input"
                        type="number"
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                    />
                </label>
                <label className="forum-label">
                    Farbe (Dezimal)
                    <input
                        className="forum-input"
                        type="number"
                        value={form.color}
                        onChange={(e) => setForm({ ...form, color: Number(e.target.value) })}
                    />
                </label>
            </div>
            <label className="forum-label">
                Berechtigungen, eine pro Zeile
                <textarea
                    className="forum-input min-h-52 font-mono"
                    value={(form.permissions ?? []).join('\n')}
                    onChange={(e) => setForm({ ...form, permissions: e.target.value.split(/\s+/).filter(Boolean) })}
                />
            </label>
            <label className="flex items-center gap-3 text-sm text-zinc-400">
                <input
                    type="checkbox"
                    checked={form.defaultGroup}
                    onChange={(e) => setForm({ ...form, defaultGroup: e.target.checked })}
                />{' '}
                Standardgruppe für neue Spieler
            </label>
        </div>
    );
}

function ModerationPanel({ banReasons, muteReasons, reload, action }) {
    return (
        <div className="grid gap-6 xl:grid-cols-2">
            <ReasonEditor title="Ban-Gründe" type="ban" reasons={banReasons} reload={reload} action={action} />
            <ReasonEditor title="Mute-Gründe" type="mute" reasons={muteReasons} reload={reload} action={action} />
        </div>
    );
}

function ReasonEditor({ title, type, reasons, reload, action }) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(emptyReason);
    const choose = (reason) => {
        setEditing(Boolean(reason));
        setForm(reason ? { ...reason } : emptyReason);
    };
    const save = () =>
        action(
            () =>
                type === 'ban' ? userAdminApi.saveBanReason(form, editing) : userAdminApi.saveMuteReason(form, editing),
            'Moderationsgrund gespeichert.'
        ).then(async () => {
            await reload();
            choose(null);
        });
    const remove = () =>
        action(
            () => (type === 'ban' ? userAdminApi.deleteBanReason(form.key) : userAdminApi.deleteMuteReason(form.key)),
            'Moderationsgrund gelöscht.'
        ).then(async () => {
            await reload();
            choose(null);
        });
    return (
        <Panel title={title} icon={type === 'ban' ? FaBan : FaVolumeXmark}>
            <div className="grid gap-2 sm:grid-cols-2">
                {reasons.map((reason) => (
                    <button
                        key={reason.key}
                        onClick={() => choose(reason)}
                        className="rounded-2xl border border-white/[.06] bg-black/15 p-4 text-left"
                    >
                        <b className="text-sm">{reason.description}</b>
                        <p className="mt-2 text-[10px] text-zinc-600">
                            {reason.key} · {reason.permanent ? 'dauerhaft' : `${reason.defaultDurationSeconds}s`}
                        </p>
                    </button>
                ))}
            </div>
            <div className="mt-6 border-t border-white/[.06] pt-6">
                <div className="grid gap-4 sm:grid-cols-2">
                    <input
                        className="forum-input mt-0"
                        disabled={editing}
                        value={form.key}
                        onChange={(e) => setForm({ ...form, key: e.target.value })}
                        placeholder="Key"
                    />
                    <input
                        className="forum-input mt-0"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Beschreibung"
                    />
                    <input
                        className="forum-input mt-0"
                        type="number"
                        value={form.defaultDurationSeconds ?? 0}
                        onChange={(e) => setForm({ ...form, defaultDurationSeconds: Number(e.target.value) })}
                        placeholder="Sekunden"
                    />
                    <label className="flex items-center gap-3 text-sm text-zinc-400">
                        <input
                            type="checkbox"
                            checked={form.permanent}
                            onChange={(e) => setForm({ ...form, permanent: e.target.checked })}
                        />{' '}
                        Dauerhaft
                    </label>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                    <button className="forum-button-primary" onClick={save}>
                        Speichern
                    </button>
                    <button className="forum-button-secondary" onClick={() => choose(null)}>
                        Neu
                    </button>
                    {editing && (
                        <button
                            className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 px-4 py-3 text-xs font-bold text-red-300 transition hover:bg-red-500/10"
                            onClick={remove}
                        >
                            <FaTrashCan /> Löschen
                        </button>
                    )}
                </div>
            </div>
        </Panel>
    );
}

function Panel({ title, icon: Icon, children }) {
    return (
        <article className="rounded-3xl border border-white/[.075] bg-[#111218] p-6 sm:p-7">
            <h2 className="mb-6 flex items-center gap-3 font-display text-xl font-bold">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500/10 text-orange-300">
                    <Icon />
                </span>
                {title}
            </h2>
            {children}
        </article>
    );
}

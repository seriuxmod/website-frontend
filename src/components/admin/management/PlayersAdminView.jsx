import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import {
    FaBan,
    FaCalendarPlus,
    FaEye,
    FaKey,
    FaLock,
    FaShieldHalved,
    FaUnlock,
    FaUserGroup,
    FaUsers,
    FaXmark
} from 'react-icons/fa6';
import { AdminMetricCard } from '../AdminUi';
import { hasAnyPermission, hasPermission } from '../../../lib/auth';
import { userAdminApi } from '../../../lib/userAdminApi';
import {
    AdminDataTable,
    AdminManagementEmpty,
    AdminManagementError,
    AdminManagementLoading,
    AdminManagementPage,
    AdminPagination,
    AdminPanel,
    StatusPill,
    columnHelper,
    formatDate,
    useAdminResource
} from './AdminManagementShared';
import {
    AdminServerSearch,
    AdminTimelineChart,
    compactId,
    metric,
    pageRows,
    pageTotal,
    useServerSearch
} from './UserAdminShared';

const PAGE_SIZE = 30;
const REGISTRATION_SERIES = [{ key: 'registrations', label: 'Registrierungen', color: '#ff7417', area: true }];

export default function PlayersAdminView({ user }) {
    const [input, setInput] = useState('');
    const [query, debouncer] = useServerSearch(input);
    const [locked, setLocked] = useState('');
    const [websiteAccessEnabled, setWebsiteAccessEnabled] = useState('');
    const [twoFactorEnabled, setTwoFactorEnabled] = useState('');
    const [groupKey, setGroupKey] = useState('');
    const [page, setPage] = useState(0);
    const [selectedId, setSelectedId] = useState('');
    const [actionError, setActionError] = useState('');
    const canRead = hasAnyPermission(user, 'users.read.any');

    const overview = useAdminResource(
        useCallback(() => (canRead ? userAdminApi.playersOverview(30) : Promise.resolve(null)), [canRead]),
        [canRead]
    );
    const canReadGroups = hasAnyPermission(user, 'permissions.group.read', 'permissions.group.write');
    const groups = useAdminResource(
        useCallback(() => (canReadGroups ? userAdminApi.permissionGroups() : Promise.resolve([])), [canReadGroups]),
        [canReadGroups]
    );
    const loader = useCallback(
        () =>
            canRead
                ? userAdminApi.players({
                      q: query,
                      locked,
                      websiteAccessEnabled,
                      twoFactorEnabled,
                      groupKey,
                      page,
                      size: PAGE_SIZE
                  })
                : Promise.resolve(emptyPlayerPage()),
        [canRead, groupKey, locked, page, query, twoFactorEnabled, websiteAccessEnabled]
    );
    const players = useAdminResource(loader, [loader]);
    const rows = pageRows(players.data);

    useEffect(() => setPage(0), [groupKey, locked, query, twoFactorEnabled, websiteAccessEnabled]);

    const canReadDetail =
        hasPermission(user, 'users.admin') ||
        (hasPermission(user, 'users.read.any') && hasPermission(user, 'permissions.user.read'));
    const canLock = hasAnyPermission(user, 'users.lock');
    const canWriteDirect = hasAnyPermission(user, 'permissions.user.write');
    const canAssign = hasAnyPermission(user, 'permissions.assignment.write');
    const canReadAudits = hasPermission(user, 'users.admin') || hasAnyPermission(user, 'audits.read.any');
    const reload = () => (canRead ? Promise.all([overview.reload(), players.reload()]) : Promise.resolve());
    const error = overview.error || players.error;

    return (
        <AdminManagementPage
            backend="User-Service"
            description="Registrierte SeriuxMod-Konten, Sicherheitsmerkmale, Präsenz und Berechtigungszuweisungen aus dem produktiven User-Service."
            error={error}
            eyebrow="SPIELERVERZEICHNIS"
            icon={FaUsers}
            loading={canRead && (overview.loading || players.loading)}
            onRetry={reload}
            title="Spieler"
        >
            {!canRead ? (
                <ManualPlayerActions
                    canAssign={canAssign}
                    canLock={canLock}
                    canWriteDirect={canWriteDirect}
                    groups={groups.data || []}
                />
            ) : overview.loading && !overview.data ? (
                <AdminManagementLoading title="Spielerverzeichnis wird ausgewertet" />
            ) : (
                <>
                    <PlayerMetrics data={overview.data || {}} />
                    <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,.65fr)]">
                        <AdminTimelineChart
                            description="Neue SeriuxMod-Konten pro Tag im gewählten 30-Tage-Zeitraum."
                            id="player-registrations"
                            rows={overview.data?.registrations || []}
                            series={REGISTRATION_SERIES}
                            title="Registrierungsverlauf"
                        />
                        <SecuritySummary data={overview.data || {}} />
                    </section>

                    <section
                        className={`mt-6 grid gap-6 ${selectedId ? '2xl:grid-cols-[minmax(0,1.45fr)_minmax(380px,.55fr)]' : ''}`}
                    >
                        <AdminPanel
                            description="Suche und Filter werden serverseitig ausgeführt; die Tabelle filtert zusätzlich nur die geladene Seite."
                            eyebrow="LIVE-DATEN"
                            title="Benutzerkonten"
                        >
                            {actionError && (
                                <div
                                    className="border-b border-red-400/10 bg-red-400/[.04] px-5 py-3 text-xs text-red-300"
                                    role="alert"
                                >
                                    {actionError}
                                </div>
                            )}
                            <div className="grid gap-3 border-b border-white/[.05] p-5 lg:grid-cols-[minmax(260px,1fr)_repeat(4,minmax(135px,auto))]">
                                <AdminServerSearch
                                    onChange={setInput}
                                    pending={debouncer.state.isPending}
                                    placeholder="Minecraft-Name oder UUID …"
                                    value={input}
                                />
                                <FilterSelect label="Sperrstatus" onChange={setLocked} value={locked}>
                                    <option value="">Alle Konten</option>
                                    <option value="true">Gesperrt</option>
                                    <option value="false">Freigegeben</option>
                                </FilterSelect>
                                <FilterSelect
                                    label="Webzugang"
                                    onChange={setWebsiteAccessEnabled}
                                    value={websiteAccessEnabled}
                                >
                                    <option value="">Webzugang: alle</option>
                                    <option value="true">Aktiviert</option>
                                    <option value="false">Nicht aktiviert</option>
                                </FilterSelect>
                                <FilterSelect
                                    label="Zwei-Faktor"
                                    onChange={setTwoFactorEnabled}
                                    value={twoFactorEnabled}
                                >
                                    <option value="">2FA: alle</option>
                                    <option value="true">Aktiviert</option>
                                    <option value="false">Nicht aktiviert</option>
                                </FilterSelect>
                                <FilterSelect label="Berechtigungsgruppe" onChange={setGroupKey} value={groupKey}>
                                    <option value="">Alle Gruppen</option>
                                    {(groups.data || []).map((group) => (
                                        <option key={group.key} value={group.key}>
                                            {group.displayName}
                                        </option>
                                    ))}
                                </FilterSelect>
                            </div>
                            {players.loading ? (
                                <div className="p-6">
                                    <AdminManagementLoading title="Konten werden geladen" />
                                </div>
                            ) : (
                                <PlayerTable
                                    canLock={canLock}
                                    canReadDetail={canReadDetail}
                                    onChanged={reload}
                                    onError={setActionError}
                                    onSelect={setSelectedId}
                                    rows={rows}
                                    selectedId={selectedId}
                                />
                            )}
                            <AdminPagination
                                onPage={setPage}
                                page={Number(players.data?.page) || 0}
                                size={Number(players.data?.size) || PAGE_SIZE}
                                total={pageTotal(players.data)}
                            />
                        </AdminPanel>
                        {selectedId && (
                            <PlayerDetail
                                key={selectedId}
                                canAssign={canAssign}
                                canLock={canLock}
                                canReadAudits={canReadAudits}
                                canWriteDirect={canWriteDirect}
                                groups={groups.data || []}
                                onChanged={reload}
                                onClose={() => setSelectedId('')}
                                userId={selectedId}
                            />
                        )}
                    </section>
                </>
            )}
        </AdminManagementPage>
    );
}

function ManualPlayerActions({ canLock, canWriteDirect, canAssign, groups }) {
    const [userId, setUserId] = useState('');
    const [locked, setLocked] = useState('true');
    const [lockReason, setLockReason] = useState('');
    const [directPermissions, setDirectPermissions] = useState('');
    const [assignmentMode, setAssignmentMode] = useState('assign');
    const [assignmentGroup, setAssignmentGroup] = useState(groups[0]?.key || '');
    const [expiresAt, setExpiresAt] = useState('');
    const [result, setResult] = useState(null);

    useEffect(() => {
        if (!assignmentGroup && groups[0]?.key) setAssignmentGroup(groups[0].key);
    }, [assignmentGroup, groups]);

    const validateTarget = () => {
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId.trim())) {
            return true;
        }
        setResult({ error: true, text: 'Bitte gib eine vollständige Benutzer-UUID an.' });
        return false;
    };
    const run = async (operation, successText) => {
        setResult(null);
        try {
            await operation();
            setResult({ error: false, text: successText });
        } catch (error) {
            setResult({ error: true, text: error.message });
        }
    };

    return (
        <AdminPanel
            description="Du besitzt ein gezieltes Schreibrecht, aber kein Leserecht für das Spielerverzeichnis. Aktionen sind deshalb nur gegen eine bewusst eingegebene UUID möglich; Kontodaten werden nicht offengelegt."
            eyebrow="GRANULARE AKTIONEN"
            title="Spieler direkt bearbeiten"
        >
            <div className="space-y-5 p-5 sm:p-6">
                <label className="admin-forum-field max-w-2xl">
                    <span>Zielkonto (Benutzer-UUID)</span>
                    <input
                        className="admin-forum-input font-mono"
                        maxLength={36}
                        onChange={(event) => {
                            setUserId(event.target.value);
                            setResult(null);
                        }}
                        pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
                        placeholder="00000000-0000-0000-0000-000000000000"
                        required
                        value={userId}
                    />
                </label>
                {result && (
                    <p
                        className={`rounded-xl border p-3 text-xs ${
                            result.error
                                ? 'border-red-400/15 bg-red-400/[.05] text-red-300'
                                : 'border-emerald-400/15 bg-emerald-400/[.05] text-emerald-300'
                        }`}
                        role={result.error ? 'alert' : 'status'}
                    >
                        {result.text}
                    </p>
                )}
                <div className="grid gap-4 xl:grid-cols-3">
                    {canLock && (
                        <form
                            className="space-y-3 rounded-2xl border border-white/[.06] bg-black/10 p-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                if (!validateTarget()) return;
                                const reason = lockReason.trim();
                                if (locked === 'true' && !reason) {
                                    setResult({
                                        error: true,
                                        text: 'Für eine Sperre ist eine Begründung erforderlich.'
                                    });
                                    return;
                                }
                                if (reason.length > 500) {
                                    setResult({
                                        error: true,
                                        text: 'Die Sperrnotiz darf höchstens 500 Zeichen enthalten.'
                                    });
                                    return;
                                }
                                run(
                                    () => userAdminApi.setPlayerLocked(userId.trim(), locked === 'true', reason),
                                    locked === 'true' ? 'Das Konto wurde gesperrt.' : 'Das Konto wurde entsperrt.'
                                );
                            }}
                        >
                            <b className="flex items-center gap-2 text-sm text-zinc-200">
                                <FaLock /> Kontozugriff
                            </b>
                            <select
                                className="admin-forum-input"
                                onChange={(event) => setLocked(event.target.value)}
                                value={locked}
                            >
                                <option value="true">Sperren</option>
                                <option value="false">Entsperren</option>
                            </select>
                            <textarea
                                className="admin-forum-input min-h-24 resize-y"
                                maxLength={500}
                                onChange={(event) => setLockReason(event.target.value)}
                                placeholder="Begründung oder interne Notiz"
                                value={lockReason}
                            />
                            <button className="admin-forum-secondary w-full" type="submit">
                                Änderung ausführen
                            </button>
                        </form>
                    )}
                    {canWriteDirect && (
                        <form
                            className="space-y-3 rounded-2xl border border-white/[.06] bg-black/10 p-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                if (!validateTarget()) return;
                                const permissions = splitPermissions(directPermissions);
                                const validationError = validatePermissions(permissions);
                                if (validationError) {
                                    setResult({ error: true, text: validationError });
                                    return;
                                }
                                if (!window.confirm('Die direkten Berechtigungen des Zielkontos vollständig ersetzen?'))
                                    return;
                                run(
                                    () => userAdminApi.setDirectPermissions(userId.trim(), permissions),
                                    'Die direkten Berechtigungen wurden ersetzt.'
                                );
                            }}
                        >
                            <b className="flex items-center gap-2 text-sm text-zinc-200">
                                <FaKey /> Direkte Rechte
                            </b>
                            <p className="text-[9px] leading-4 text-zinc-600">
                                Ein Recht pro Zeile. Der vorhandene Satz wird vollständig ersetzt.
                            </p>
                            <textarea
                                className="admin-forum-input min-h-36 resize-y font-mono text-[10px]"
                                onChange={(event) => setDirectPermissions(event.target.value)}
                                placeholder="users.read.any"
                                value={directPermissions}
                            />
                            <button className="admin-forum-secondary w-full" type="submit">
                                Rechte ersetzen
                            </button>
                        </form>
                    )}
                    {canAssign && (
                        <form
                            className="space-y-3 rounded-2xl border border-white/[.06] bg-black/10 p-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                if (!validateTarget()) return;
                                const normalizedGroup = assignmentGroup.trim();
                                if (!/^[a-z0-9][a-z0-9._-]{0,63}$/.test(normalizedGroup)) {
                                    setResult({ error: true, text: 'Bitte gib einen gültigen Gruppenschlüssel an.' });
                                    return;
                                }
                                const expiration = expiresAt ? new Date(expiresAt) : null;
                                if (
                                    assignmentMode === 'assign' &&
                                    expiration &&
                                    (!Number.isFinite(expiration.getTime()) || expiration.getTime() <= Date.now())
                                ) {
                                    setResult({ error: true, text: 'Der Ablaufzeitpunkt muss in der Zukunft liegen.' });
                                    return;
                                }
                                if (
                                    assignmentMode === 'remove' &&
                                    !window.confirm(`Aktive Zuweisung der Gruppe ${normalizedGroup} entfernen?`)
                                )
                                    return;
                                run(
                                    () =>
                                        assignmentMode === 'assign'
                                            ? userAdminApi.assignGroup(userId.trim(), {
                                                  groupKey: normalizedGroup,
                                                  startsAt: null,
                                                  expiresAt: expiration ? expiration.toISOString() : null,
                                                  source: 'WEB_ADMIN',
                                                  sourceReference: 'homepage-admin'
                                              })
                                            : userAdminApi.removeGroup(userId.trim(), normalizedGroup),
                                    assignmentMode === 'assign'
                                        ? 'Die Gruppe wurde zugewiesen.'
                                        : 'Die aktive Gruppenzuweisung wurde entfernt.'
                                );
                            }}
                        >
                            <b className="flex items-center gap-2 text-sm text-zinc-200">
                                <FaUserGroup /> Gruppenzuweisung
                            </b>
                            <select
                                className="admin-forum-input"
                                onChange={(event) => setAssignmentMode(event.target.value)}
                                value={assignmentMode}
                            >
                                <option value="assign">Zuweisen</option>
                                <option value="remove">Aktive Zuweisung entfernen</option>
                            </select>
                            {groups.length ? (
                                <select
                                    className="admin-forum-input"
                                    onChange={(event) => setAssignmentGroup(event.target.value)}
                                    required
                                    value={assignmentGroup}
                                >
                                    <option disabled value="">
                                        Gruppe auswählen
                                    </option>
                                    {groups.map((group) => (
                                        <option key={group.key} value={group.key}>
                                            {group.displayName}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    className="admin-forum-input font-mono"
                                    maxLength={64}
                                    onChange={(event) => setAssignmentGroup(event.target.value)}
                                    pattern="[a-z0-9][a-z0-9._-]{0,63}"
                                    placeholder="moderator"
                                    required
                                    value={assignmentGroup}
                                />
                            )}
                            {assignmentMode === 'assign' && (
                                <input
                                    className="admin-forum-input"
                                    min={localDateTimeMin()}
                                    onChange={(event) => setExpiresAt(event.target.value)}
                                    type="datetime-local"
                                    value={expiresAt}
                                />
                            )}
                            <button className="admin-forum-secondary w-full" type="submit">
                                Gruppenaktion ausführen
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </AdminPanel>
    );
}

function PlayerMetrics({ data }) {
    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <AdminMetricCard
                detail="SeriuxMod-Konten"
                icon={FaUsers}
                label="Registriert"
                tone="sky"
                value={metric(data.registeredUsers)}
            />
            <AdminMetricCard
                detail="letzte 30 Tage"
                icon={FaCalendarPlus}
                label="Neu"
                tone="emerald"
                value={metric(data.newUsers)}
            />
            <AdminMetricCard
                detail="administrativ gesperrt"
                icon={FaBan}
                label="Gesperrt"
                tone="red"
                value={metric(data.lockedUsers)}
            />
            <AdminMetricCard
                detail="Anmeldung eingerichtet"
                icon={FaKey}
                label="Webzugang"
                tone="orange"
                value={metric(data.websiteAccessUsers)}
            />
            <AdminMetricCard
                detail="Konten mit TOTP"
                icon={FaShieldHalved}
                label="Zwei-Faktor"
                tone="violet"
                value={metric(data.twoFactorUsers)}
            />
            <AdminMetricCard
                detail="Konten mit WebAuthn"
                icon={FaKey}
                label="Passkeys"
                tone="amber"
                value={metric(data.passkeyUsers)}
            />
        </section>
    );
}

function SecuritySummary({ data }) {
    const total = Math.max(1, Number(data.registeredUsers) || 0);
    const items = [
        ['Webzugang', data.websiteAccessUsers, 'bg-orange-400'],
        ['Zwei-Faktor', data.twoFactorUsers, 'bg-violet-400'],
        ['Passkeys', data.passkeyUsers, 'bg-sky-400'],
        ['Gesperrt', data.lockedUsers, 'bg-red-400']
    ];
    return (
        <AdminPanel
            description="Anteil der Konten mit den jeweiligen Sicherheitsmerkmalen."
            eyebrow="SICHERHEIT"
            title="Kontoschutz"
        >
            <div className="space-y-5 p-6">
                {items.map(([label, value, color]) => {
                    const percentage = Math.min(100, (Number(value || 0) / total) * 100);
                    return (
                        <div key={label}>
                            <div className="mb-2 flex items-center justify-between text-xs">
                                <span className="font-bold text-zinc-400">{label}</span>
                                <span className="text-zinc-600">
                                    {metric(value)} · {percentage.toFixed(1)} %
                                </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/[.045]">
                                <div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </AdminPanel>
    );
}

function FilterSelect({ label, value, onChange, children }) {
    return (
        <label>
            <span className="sr-only">{label}</span>
            <select
                className="admin-forum-select-compact h-11 w-full"
                onChange={(event) => onChange(event.target.value)}
                value={value}
            >
                {children}
            </select>
        </label>
    );
}

function PlayerTable({ rows, selectedId, canReadDetail, canLock, onSelect, onChanged, onError }) {
    const columns = useMemo(
        () =>
            columnHelper.columns([
                columnHelper.accessor('username', {
                    header: 'Spieler',
                    cell: (context) => (
                        <div>
                            <b className="block text-sm text-zinc-200">{context.getValue()}</b>
                            <span className="mt-1 block font-mono text-[9px] text-zinc-600">
                                {compactId(context.row.original.id)}
                            </span>
                        </div>
                    )
                }),
                columnHelper.accessor('locked', {
                    header: 'Konto',
                    cell: (context) => <StatusPill value={context.getValue() ? 'Gesperrt' : 'Aktiv'} />
                }),
                columnHelper.accessor('presence', {
                    header: 'Präsenz',
                    cell: (context) => {
                        const presence = context.getValue();
                        return (
                            <div>
                                <StatusPill value={presence?.online ? 'Online' : 'Offline'} />
                                <span className="mt-1 block text-[9px] text-zinc-600">
                                    {[...(presence?.surfaces || [])].join(', ') || 'Keine Oberfläche'}
                                </span>
                            </div>
                        );
                    }
                }),
                columnHelper.accessor('activeGroups', {
                    header: 'Gruppen',
                    cell: (context) => (
                        <div className="flex max-w-64 flex-wrap gap-1.5">
                            {(context.getValue() || []).length ? (
                                context.getValue().map((group) => <StatusPill key={group} value={group} />)
                            ) : (
                                <span className="text-xs text-zinc-600">Keine</span>
                            )}
                        </div>
                    )
                }),
                columnHelper.display({
                    id: 'security',
                    header: 'Sicherheit',
                    cell: (context) => {
                        const row = context.row.original;
                        return (
                            <span className="text-xs text-zinc-500">
                                {row.websiteAccessEnabled ? 'Web' : '—'} · {row.twoFactorEnabled ? '2FA' : 'ohne 2FA'} ·{' '}
                                {row.passkeyCount || 0} Keys
                            </span>
                        );
                    }
                }),
                columnHelper.accessor('createdAt', {
                    header: 'Registriert',
                    cell: (context) => <time className="text-xs text-zinc-500">{formatDate(context.getValue())}</time>
                }),
                columnHelper.display({
                    id: 'actions',
                    header: '',
                    cell: (context) => (
                        <div className="flex justify-end gap-2">
                            {canLock && (
                                <button
                                    aria-label={context.row.original.locked ? 'Konto entsperren' : 'Konto sperren'}
                                    className={
                                        context.row.original.locked
                                            ? 'admin-forum-secondary !px-3'
                                            : 'admin-forum-danger !px-3'
                                    }
                                    onClick={async () => {
                                        try {
                                            const locking = !context.row.original.locked;
                                            const reason = window.prompt(
                                                locking ? 'Begründung für die Kontosperre:' : 'Notiz zur Entsperrung:'
                                            );
                                            if (reason === null || (locking && !reason.trim())) return;
                                            if (reason.trim().length > 500) {
                                                onError('Die Sperrnotiz darf höchstens 500 Zeichen enthalten.');
                                                return;
                                            }
                                            onError('');
                                            await userAdminApi.setPlayerLocked(
                                                context.row.original.id,
                                                locking,
                                                reason.trim()
                                            );
                                            await onChanged();
                                        } catch (error) {
                                            onError(error.message);
                                        }
                                    }}
                                    type="button"
                                >
                                    {context.row.original.locked ? <FaUnlock /> : <FaLock />}
                                </button>
                            )}
                            {canReadDetail && (
                                <button
                                    className={`admin-forum-secondary !px-3 ${selectedId === context.row.original.id ? '!border-orange-400/30 !text-orange-300' : ''}`}
                                    onClick={() => onSelect(context.row.original.id)}
                                    type="button"
                                >
                                    <FaEye /> Details
                                </button>
                            )}
                        </div>
                    )
                })
            ]),
        [canLock, canReadDetail, onChanged, onError, onSelect, selectedId]
    );
    return rows.length ? (
        <AdminDataTable
            columns={columns}
            getSearchValue={(row) => `${row.username} ${row.id} ${(row.activeGroups || []).join(' ')}`}
            rows={rows}
            searchPlaceholder="Geladene Seite filtern …"
        />
    ) : (
        <AdminManagementEmpty
            title="Keine Konten gefunden"
            text="Für die aktuelle Suche und Filterkombination existiert kein Benutzerkonto."
        />
    );
}

function PlayerDetail({ userId, groups, canLock, canAssign, canWriteDirect, canReadAudits, onClose, onChanged }) {
    const [auditPage, setAuditPage] = useState(0);
    const detail = useAdminResource(
        useCallback(() => userAdminApi.player(userId), [userId]),
        [userId]
    );
    const audits = useAdminResource(
        useCallback(
            () => (canReadAudits ? userAdminApi.playerAudits(userId, auditPage, 20) : Promise.resolve(null)),
            [auditPage, canReadAudits, userId]
        ),
        [auditPage, canReadAudits, userId]
    );
    const refresh = async () => {
        await Promise.all([detail.reload(), canReadAudits ? audits.reload() : Promise.resolve()]);
        await onChanged();
    };
    if (detail.loading && !detail.data)
        return (
            <AdminPanel className="h-fit">
                <div className="p-6">
                    <AdminManagementLoading title="Kontodetails werden geladen" />
                </div>
            </AdminPanel>
        );
    if (detail.error)
        return (
            <AdminPanel className="h-fit">
                <div className="p-6">
                    <AdminManagementError message={detail.error} retry={detail.reload} />
                </div>
            </AdminPanel>
        );
    const account = detail.data?.player;
    const permissions = detail.data?.permissions;
    return (
        <AdminPanel
            actions={
                <button
                    aria-label="Details schließen"
                    className="admin-forum-secondary !px-3"
                    onClick={onClose}
                    type="button"
                >
                    <FaXmark />
                </button>
            }
            className="h-fit"
            description={account?.id}
            eyebrow="KONTODETAILS"
            title={account?.username || 'Spieler'}
        >
            <div className="space-y-5 p-5 sm:p-6">
                <dl className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
                    <Detail label="Letzter Login" value={formatDate(account?.lastLoginAt)} />
                    <Detail label="Zuletzt gesehen" value={formatDate(account?.presence?.lastSeenAt)} />
                    <Detail label="Direkte Rechte" value={metric(permissions?.userPermissions?.length)} />
                    <Detail label="Effektive Rechte" value={metric(permissions?.effectivePermissions?.length)} />
                </dl>
                {canWriteDirect && <DirectPermissionsEditor detail={detail.data} onSaved={refresh} />}
                <GroupAssignments canAssign={canAssign} detail={detail.data} groups={groups} onSaved={refresh} />
                {canLock && <LockEditor account={account} onSaved={refresh} />}
                {canReadAudits && (
                    <AuditList loading={audits.loading} onPage={setAuditPage} page={auditPage} payload={audits.data} />
                )}
            </div>
        </AdminPanel>
    );
}

function DirectPermissionsEditor({ detail, onSaved }) {
    const [message, setMessage] = useState('');
    const form = useForm({
        defaultValues: { permissions: [...(detail?.permissions?.userPermissions || [])].sort().join('\n') },
        onSubmit: async ({ value }) => {
            setMessage('');
            try {
                const permissions = splitPermissions(value.permissions);
                const validationError = validatePermissions(permissions);
                if (validationError) {
                    setMessage(validationError);
                    return;
                }
                await userAdminApi.setDirectPermissions(detail.player.id, permissions);
                await onSaved();
            } catch (error) {
                setMessage(error.message);
            }
        }
    });
    return (
        <form
            className="border-t border-white/[.05] pt-5"
            onSubmit={(event) => {
                event.preventDefault();
                form.handleSubmit();
            }}
        >
            <form.Field name="permissions">
                {(field) => (
                    <label className="admin-forum-field">
                        <span>Direkte Berechtigungen</span>
                        <textarea
                            className="admin-forum-input min-h-28 resize-y font-mono text-[10px]"
                            onChange={(event) => field.handleChange(event.target.value)}
                            value={field.state.value}
                        />
                    </label>
                )}
            </form.Field>
            <p className="mt-2 text-[9px] leading-4 text-zinc-600">
                Ein Recht pro Zeile. Gruppenrechte werden hiervon nicht überschrieben.
            </p>
            {message && <p className="mt-2 text-xs text-red-300">{message}</p>}
            <button className="admin-forum-secondary mt-3" type="submit">
                <FaKey /> Direkte Rechte speichern
            </button>
        </form>
    );
}

function GroupAssignments({ detail, groups, canAssign, onSaved }) {
    const assignments = detail?.permissions?.assignedGroups || [];
    const [groupKey, setGroupKey] = useState(groups[0]?.key || '');
    const [expiresAt, setExpiresAt] = useState('');
    const [message, setMessage] = useState('');
    useEffect(() => {
        if (!groupKey && groups[0]?.key) setGroupKey(groups[0].key);
    }, [groupKey, groups]);
    const assign = async (event) => {
        event.preventDefault();
        setMessage('');
        const expiration = expiresAt ? new Date(expiresAt) : null;
        if (expiration && (!Number.isFinite(expiration.getTime()) || expiration.getTime() <= Date.now())) {
            setMessage('Der Ablaufzeitpunkt muss in der Zukunft liegen.');
            return;
        }
        try {
            await userAdminApi.assignGroup(detail.player.id, {
                groupKey,
                startsAt: null,
                expiresAt: expiration ? expiration.toISOString() : null,
                source: 'WEB_ADMIN',
                sourceReference: 'homepage-admin'
            });
            setExpiresAt('');
            await onSaved();
        } catch (error) {
            setMessage(error.message);
        }
    };
    return (
        <div className="border-t border-white/[.05] pt-5">
            <b className="text-xs text-zinc-300">Gruppenzuweisungen</b>
            <div className="mt-3 space-y-2">
                {assignments.length ? (
                    assignments.map((assignment) => (
                        <div
                            className="flex items-center justify-between gap-3 rounded-xl border border-white/[.055] bg-black/10 p-3"
                            key={`${assignment.groupKey}-${assignment.assignedAt}`}
                        >
                            <div>
                                <b className="block text-xs text-zinc-300">{assignment.groupKey}</b>
                                <span className="mt-1 block text-[9px] text-zinc-600">
                                    {assignment.active ? 'Aktiv' : 'Inaktiv'} · bis {formatDate(assignment.expiresAt)}
                                </span>
                            </div>
                            {canAssign && assignment.active && (
                                <button
                                    aria-label="Gruppe entfernen"
                                    className="admin-forum-danger !px-3 !py-2"
                                    onClick={async () => {
                                        if (!window.confirm(`Gruppe ${assignment.groupKey} entfernen?`)) return;
                                        try {
                                            setMessage('');
                                            await userAdminApi.removeGroup(detail.player.id, assignment.groupKey);
                                            await onSaved();
                                        } catch (error) {
                                            setMessage(error.message);
                                        }
                                    }}
                                    type="button"
                                >
                                    <FaXmark />
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-xs text-zinc-600">Keine Gruppen zugewiesen.</p>
                )}
            </div>
            {canAssign && (
                <form className="mt-4 grid gap-2" onSubmit={assign}>
                    <select
                        className="admin-forum-input !mt-0"
                        onChange={(event) => setGroupKey(event.target.value)}
                        required
                        value={groupKey}
                    >
                        <option disabled value="">
                            Gruppe auswählen
                        </option>
                        {groups.map((group) => (
                            <option key={group.key} value={group.key}>
                                {group.displayName}
                            </option>
                        ))}
                    </select>
                    <label className="admin-forum-field">
                        <span>Ablauf (optional)</span>
                        <input
                            className="admin-forum-input"
                            min={localDateTimeMin()}
                            onChange={(event) => setExpiresAt(event.target.value)}
                            type="datetime-local"
                            value={expiresAt}
                        />
                    </label>
                    {message && <p className="text-xs text-red-300">{message}</p>}
                    <button className="admin-forum-secondary" type="submit">
                        <FaUserGroup /> Gruppe zuweisen
                    </button>
                </form>
            )}
        </div>
    );
}

function LockEditor({ account, onSaved }) {
    const [reason, setReason] = useState('');
    const [message, setMessage] = useState('');
    const submit = async (event) => {
        event.preventDefault();
        if (!account.locked && !reason.trim()) {
            setMessage('Für eine Sperre ist eine nachvollziehbare Begründung erforderlich.');
            return;
        }
        try {
            await userAdminApi.setPlayerLocked(account.id, !account.locked, reason.trim());
            setReason('');
            await onSaved();
        } catch (error) {
            setMessage(error.message);
        }
    };
    return (
        <form className="border-t border-white/[.05] pt-5" onSubmit={submit}>
            <label className="admin-forum-field">
                <span>{account.locked ? 'Notiz zur Entsperrung' : 'Begründung der Sperre'}</span>
                <textarea
                    className="admin-forum-input min-h-20 resize-y"
                    maxLength={500}
                    onChange={(event) => setReason(event.target.value)}
                    value={reason}
                />
            </label>
            {message && <p className="mt-2 text-xs text-red-300">{message}</p>}
            <button className={account.locked ? 'admin-forum-secondary mt-3' : 'admin-forum-danger mt-3'} type="submit">
                {account.locked ? <FaUnlock /> : <FaLock />} {account.locked ? 'Konto entsperren' : 'Konto sperren'}
            </button>
        </form>
    );
}

function AuditList({ payload, loading, page, onPage }) {
    if (loading)
        return (
            <div className="border-t border-white/[.05] pt-5">
                <AdminManagementLoading title="Auditverlauf wird geladen" />
            </div>
        );
    const rows = pageRows(payload);
    return (
        <div className="border-t border-white/[.05] pt-5">
            <b className="text-xs text-zinc-300">Letzte Audit-Ereignisse</b>
            {rows.length ? (
                <div className="mt-3 space-y-2">
                    {rows.map((entry) => (
                        <div className="rounded-xl border border-white/[.05] bg-black/10 p-3" key={entry.id}>
                            <b className="block text-[10px] text-zinc-300">{entry.action}</b>
                            <span className="mt-1 block text-[9px] text-zinc-600">
                                {entry.actorUsername || compactId(entry.actorId)} · {formatDate(entry.timestamp)}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="mt-3 text-xs text-zinc-600">Noch keine Audit-Einträge.</p>
            )}
            <AdminPagination
                onPage={onPage}
                page={Number(payload?.page) || page || 0}
                size={Number(payload?.size) || 20}
                total={pageTotal(payload)}
            />
        </div>
    );
}

function Detail({ label, value }) {
    return (
        <div className="rounded-xl border border-white/[.05] bg-black/10 p-3">
            <dt className="text-[8px] font-extrabold uppercase tracking-wider text-zinc-600">{label}</dt>
            <dd className="mt-1 break-words text-xs font-bold text-zinc-300">{value}</dd>
        </div>
    );
}

function splitPermissions(value) {
    return [
        ...new Set(
            String(value || '')
                .split(/[\n,]/)
                .map((item) => item.trim())
                .filter(Boolean)
        )
    ];
}

function validatePermissions(permissions) {
    if (permissions.length > 256) return 'Es sind höchstens 256 direkte Berechtigungen erlaubt.';
    const invalid = permissions.find(
        (permission) => permission.length > 120 || !/^[a-z0-9][a-z0-9._:-]{0,119}$/.test(permission)
    );
    return invalid
        ? `Ungültige Berechtigung: ${invalid}. Erlaubt sind Kleinbuchstaben, Ziffern sowie . _ : - (maximal 120 Zeichen).`
        : '';
}

function localDateTimeMin() {
    const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000);
    return now.toISOString().slice(0, 16);
}

function emptyPlayerPage() {
    return { content: [], page: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 0, first: true, last: true };
}

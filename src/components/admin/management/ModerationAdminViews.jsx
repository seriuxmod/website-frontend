import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import {
    FaBan,
    FaClock,
    FaEye,
    FaFileShield,
    FaGavel,
    FaHourglassHalf,
    FaMicrophoneSlash,
    FaPen,
    FaPlus,
    FaScaleBalanced,
    FaTrash,
    FaXmark
} from 'react-icons/fa6';
import { hasAnyPermission, hasPermission } from '../../../lib/auth';
import { userAdminApi } from '../../../lib/userAdminApi';
import { AdminMetricCard } from '../AdminUi';
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
    durationLabel,
    humanize,
    metric,
    pageRows,
    pageTotal,
    useServerSearch
} from './UserAdminShared';

const PAGE_SIZE = 30;
const MODERATION_SERIES = [
    { key: 'bans', label: 'Bans', color: '#fb7185', area: true },
    { key: 'mutes', label: 'Mutes', color: '#a78bfa' }
];
const CASE_STATUSES = ['ACTIVE', 'REVOKED', 'EXPIRED'];

export function ModerationOverviewView() {
    const [auditPage, setAuditPage] = useState(0);
    const overview = useAdminResource(
        useCallback(() => userAdminApi.moderationOverview(30), []),
        []
    );
    const audit = useAdminResource(
        useCallback(() => userAdminApi.moderationAudit({ page: auditPage, size: 30 }), [auditPage]),
        [auditPage]
    );
    const reload = () => Promise.all([overview.reload(), audit.reload()]);
    const error = overview.error || audit.error;
    return (
        <AdminManagementPage
            area="MODERATION"
            backend="User-Service"
            description="Aktive Sanktionen, zeitliche Entwicklung und revisionssichere Moderationsereignisse aus dem User-Service."
            error={error}
            eyebrow="ÜBERSICHT"
            icon={FaGavel}
            loading={overview.loading || audit.loading}
            onRetry={reload}
            title="Moderation"
        >
            {overview.loading && !overview.data ? (
                <AdminManagementLoading title="Moderationslage wird ausgewertet" />
            ) : (
                <>
                    <ModerationMetrics data={overview.data || {}} />
                    <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,.6fr)]">
                        <AdminTimelineChart
                            description="Neue Ban- und Mute-Aktionen pro Tag in den vergangenen 30 Tagen."
                            id="moderation-cases"
                            rows={overview.data?.dailyCases || []}
                            series={MODERATION_SERIES}
                            title="Sanktionen im Zeitverlauf"
                        />
                        <TopReasons rows={overview.data?.topReasons || []} />
                    </section>
                    <AdminPanel
                        className="mt-6"
                        description="Serverseitig gefilterter, persistenter Audit-Trail für Moderationsänderungen."
                        eyebrow="AUDIT"
                        title="Letzte Moderationsaktionen"
                    >
                        {audit.loading ? (
                            <div className="p-6">
                                <AdminManagementLoading title="Audit-Trail wird geladen" />
                            </div>
                        ) : (
                            <ModerationAuditTable rows={pageRows(audit.data)} />
                        )}
                        <AdminPagination
                            onPage={setAuditPage}
                            page={Number(audit.data?.page) || auditPage}
                            size={Number(audit.data?.size) || 30}
                            total={pageTotal(audit.data)}
                        />
                    </AdminPanel>
                </>
            )}
        </AdminManagementPage>
    );
}

export function BansAdminView({ user }) {
    return <ModerationCasesView type="ban" user={user} />;
}

export function MutesAdminView({ user }) {
    return <ModerationCasesView type="mute" user={user} />;
}

export function ModerationSettingsView({ user }) {
    const canReadSettings =
        hasPermission(user, 'moderation.admin') ||
        (hasPermission(user, 'moderation.ban.read') && hasPermission(user, 'moderation.mute.read'));
    const canWriteBan = hasAnyPermission(user, 'moderation.ban.reason.write');
    const canWriteMute = hasAnyPermission(user, 'moderation.mute.reason.write');
    const settings = useAdminResource(
        useCallback(
            () => (canReadSettings ? userAdminApi.moderationSettings() : Promise.resolve(null)),
            [canReadSettings]
        ),
        [canReadSettings]
    );
    const [editor, setEditor] = useState(null);
    const [actionError, setActionError] = useState('');
    return (
        <AdminManagementPage
            area="MODERATION"
            backend="User-Service"
            description="Zentrale, versionierte Sanktionsgründe und Standardlaufzeiten für das Moderationsteam."
            error={settings.error}
            eyebrow="EINSTELLUNGEN"
            icon={FaScaleBalanced}
            loading={settings.loading}
            onRetry={settings.reload}
            title="Moderationseinstellungen"
        >
            {settings.loading && !settings.data ? (
                <AdminManagementLoading title="Moderationseinstellungen werden geladen" />
            ) : (
                <section
                    className={`grid gap-6 ${editor ? '2xl:grid-cols-[minmax(0,1.35fr)_minmax(400px,.65fr)]' : ''}`}
                >
                    <div className="grid gap-6">
                        {actionError && <ActionError message={actionError} />}
                        {!canReadSettings && (
                            <div className="rounded-xl border border-amber-400/15 bg-amber-400/[.05] p-4 text-xs leading-5 text-amber-200/80">
                                Dein Konto darf neue Gründe anlegen, besitzt aber nicht beide erforderlichen Leserechte.
                                Bestehende Gründe und deren Versionsstände bleiben deshalb verborgen.
                            </div>
                        )}
                        <ReasonList
                            canWrite={canWriteBan}
                            onCreate={() => setEditor({ type: 'ban', reason: null })}
                            onDelete={async (reason) => {
                                if (!window.confirm(`Ban-Grund „${reason.key}“ löschen?`)) return;
                                try {
                                    setActionError('');
                                    await userAdminApi.deleteBanReason(reason.key, reason.version);
                                    await settings.reload();
                                } catch (error) {
                                    setActionError(error.message);
                                }
                            }}
                            onEdit={(reason) => setEditor({ type: 'ban', reason })}
                            reasons={settings.data?.banReasons || []}
                            type="ban"
                        />
                        <ReasonList
                            canWrite={canWriteMute}
                            onCreate={() => setEditor({ type: 'mute', reason: null })}
                            onDelete={async (reason) => {
                                if (!window.confirm(`Mute-Grund „${reason.key}“ löschen?`)) return;
                                try {
                                    setActionError('');
                                    await userAdminApi.deleteMuteReason(reason.key, reason.version);
                                    await settings.reload();
                                } catch (error) {
                                    setActionError(error.message);
                                }
                            }}
                            onEdit={(reason) => setEditor({ type: 'mute', reason })}
                            reasons={settings.data?.muteReasons || []}
                            type="mute"
                        />
                    </div>
                    {editor && (
                        <ReasonEditor
                            key={`${editor.type}-${editor.reason?.key || 'new'}`}
                            onCancel={() => setEditor(null)}
                            onSaved={async () => {
                                setEditor(null);
                                if (canReadSettings) await settings.reload();
                            }}
                            reason={editor.reason}
                            type={editor.type}
                        />
                    )}
                </section>
            )}
        </AdminManagementPage>
    );
}

function ModerationMetrics({ data }) {
    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminMetricCard
                detail="derzeit wirksam"
                icon={FaBan}
                label="Aktive Bans"
                tone="red"
                value={metric(data.activeBans)}
            />
            <AdminMetricCard
                detail="derzeit wirksam"
                icon={FaMicrophoneSlash}
                label="Aktive Mutes"
                tone="violet"
                value={metric(data.activeMutes)}
            />
            <AdminMetricCard
                detail="innerhalb 24 Stunden"
                icon={FaHourglassHalf}
                label="Laufen aus"
                tone="amber"
                value={metric(data.expiringWithin24Hours)}
            />
            <AdminMetricCard
                detail={`letzte ${data.days || 30} Tage`}
                icon={FaGavel}
                label="Aktionen"
                tone="orange"
                value={metric(data.actionsInWindow)}
            />
        </section>
    );
}

function TopReasons({ rows }) {
    return (
        <AdminPanel
            description="Häufigste verwendete Gründe im ausgewerteten Zeitraum."
            eyebrow="SCHWERPUNKTE"
            title="Top-Gründe"
        >
            {rows.length ? (
                <div className="divide-y divide-white/[.045]">
                    {rows.map((row, index) => (
                        <div className="flex items-center gap-4 px-6 py-4" key={`${row.type}-${row.reasonKey}`}>
                            <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-400/[.08] font-display text-sm font-bold text-orange-300">
                                {index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                                <b className="block truncate font-mono text-[11px] text-zinc-300">{row.reasonKey}</b>
                                <span className="mt-1 block text-[9px] text-zinc-600">{humanize(row.type)}</span>
                            </div>
                            <StatusPill value={`${metric(row.cases)} Fälle`} />
                        </div>
                    ))}
                </div>
            ) : (
                <AdminManagementEmpty
                    title="Keine Schwerpunktdaten"
                    text="Im Zeitraum wurden keine Sanktionen erfasst."
                />
            )}
        </AdminPanel>
    );
}

function ModerationAuditTable({ rows }) {
    const columns = useMemo(
        () =>
            columnHelper.columns([
                columnHelper.accessor('timestamp', {
                    header: 'Zeitpunkt',
                    cell: (context) => <time className="text-xs text-zinc-500">{formatDate(context.getValue())}</time>
                }),
                columnHelper.accessor('action', {
                    header: 'Aktion',
                    cell: (context) => <StatusPill value={humanize(context.getValue())} />
                }),
                columnHelper.accessor('username', {
                    header: 'Spieler',
                    cell: (context) => (
                        <div>
                            <b className="block text-xs text-zinc-300">{context.getValue() || 'Unbekannt'}</b>
                            <span className="mt-1 block font-mono text-[9px] text-zinc-600">
                                {compactId(context.row.original.userId)}
                            </span>
                        </div>
                    )
                }),
                columnHelper.accessor('actorUsername', {
                    header: 'Bearbeitet von',
                    cell: (context) => (
                        <span className="text-xs text-zinc-500">
                            {context.getValue() || compactId(context.row.original.actorId)}
                        </span>
                    )
                }),
                columnHelper.accessor('details', {
                    header: 'Details',
                    cell: (context) => (
                        <span className="block max-w-md truncate font-mono text-[9px] text-zinc-600">
                            {Object.entries(context.getValue() || {})
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(' · ') || '—'}
                        </span>
                    )
                })
            ]),
        []
    );
    return rows.length ? (
        <AdminDataTable
            columns={columns}
            getSearchValue={(row) =>
                `${row.action} ${row.username} ${row.actorUsername} ${JSON.stringify(row.details)}`
            }
            rows={rows}
            searchPlaceholder="Audit-Einträge filtern …"
        />
    ) : (
        <AdminManagementEmpty
            title="Kein Audit-Eintrag"
            text="Es wurden noch keine Moderationsänderungen protokolliert."
        />
    );
}

function ModerationCasesView({ type, user }) {
    const plural = type === 'ban' ? 'bans' : 'mutes';
    const label = type === 'ban' ? 'Bans' : 'Mutes';
    const Icon = type === 'ban' ? FaBan : FaMicrophoneSlash;
    const [input, setInput] = useState('');
    const [query, debouncer] = useServerSearch(input);
    const [status, setStatus] = useState('');
    const [reasonKey, setReasonKey] = useState('');
    const [page, setPage] = useState(0);
    const [creating, setCreating] = useState(false);
    const [selected, setSelected] = useState(null);
    const [actionError, setActionError] = useState('');
    const canRead = hasAnyPermission(user, `moderation.${type}.read`);
    const canWrite = hasAnyPermission(user, `moderation.${type}.write`);
    const canReadSettings =
        hasPermission(user, 'moderation.admin') ||
        (hasPermission(user, 'moderation.ban.read') && hasPermission(user, 'moderation.mute.read'));
    const settings = useAdminResource(
        useCallback(
            () => (canReadSettings ? userAdminApi.moderationSettings() : Promise.resolve(null)),
            [canReadSettings]
        ),
        [canReadSettings]
    );
    const loader = useCallback(
        () =>
            canRead
                ? userAdminApi[plural]({ q: query, status, reasonKey, page, size: PAGE_SIZE })
                : Promise.resolve(emptyPage(PAGE_SIZE)),
        [canRead, page, plural, query, reasonKey, status]
    );
    const resource = useAdminResource(loader, [loader]);
    const rows = pageRows(resource.data);
    const reasons = (type === 'ban' ? settings.data?.banReasons : settings.data?.muteReasons) || [];
    useEffect(() => setPage(0), [query, reasonKey, status]);
    const reload = () => resource.reload();
    return (
        <AdminManagementPage
            actions={
                canWrite ? (
                    <button
                        className="forum-button-primary"
                        onClick={() => {
                            setSelected(null);
                            setCreating(true);
                        }}
                        type="button"
                    >
                        <FaPlus /> {type === 'ban' ? 'Ban' : 'Mute'} anlegen
                    </button>
                ) : null
            }
            area="MODERATION"
            backend="User-Service"
            description={`${label} werden serverseitig durchsucht, gefiltert und vollständig über den persistenten Moderationsvertrag verwaltet.`}
            error={resource.error}
            eyebrow={label.toLocaleUpperCase('de-DE')}
            icon={Icon}
            loading={resource.loading}
            onRetry={reload}
            title={label}
        >
            <section
                className={`grid gap-6 ${creating || selected ? '2xl:grid-cols-[minmax(0,1.4fr)_minmax(390px,.6fr)]' : ''}`}
            >
                <AdminPanel
                    description="Der Filter wird nicht aus lokalen Beispieldaten, sondern direkt aus der Moderationsdatenbank bedient."
                    eyebrow="FÄLLE"
                    title={`${label}-Verzeichnis`}
                >
                    {actionError && (
                        <div className="border-b border-white/[.05] p-4">
                            <ActionError message={actionError} />
                        </div>
                    )}
                    {canRead ? (
                        <>
                            <div className="grid gap-3 border-b border-white/[.05] p-5 lg:grid-cols-[minmax(260px,1fr)_180px_220px]">
                                <AdminServerSearch
                                    onChange={setInput}
                                    pending={debouncer.state.isPending}
                                    placeholder="Spielername oder UUID …"
                                    value={input}
                                />
                                <select
                                    className="admin-forum-select-compact h-11"
                                    onChange={(event) => setStatus(event.target.value)}
                                    value={status}
                                >
                                    <option value="">Alle Status</option>
                                    {CASE_STATUSES.map((value) => (
                                        <option key={value}>{value}</option>
                                    ))}
                                </select>
                                {canReadSettings ? (
                                    <select
                                        className="admin-forum-select-compact h-11"
                                        onChange={(event) => setReasonKey(event.target.value)}
                                        value={reasonKey}
                                    >
                                        <option value="">Alle Gründe</option>
                                        {reasons.map((reason) => (
                                            <option key={reason.key} value={reason.key}>
                                                {reason.description}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <span className="flex h-11 items-center rounded-xl border border-white/[.06] px-3 text-[9px] text-zinc-600">
                                        Grundfilter benötigt beide Leserechte
                                    </span>
                                )}
                            </div>
                            {resource.loading ? (
                                <div className="p-6">
                                    <AdminManagementLoading title={`${label} werden geladen`} />
                                </div>
                            ) : (
                                <CaseTable
                                    canWrite={canWrite}
                                    onChanged={reload}
                                    onError={setActionError}
                                    onSelect={(row) => {
                                        setCreating(false);
                                        setSelected(row);
                                    }}
                                    rows={rows}
                                    type={type}
                                />
                            )}
                            <AdminPagination
                                onPage={setPage}
                                page={Number(resource.data?.page) || 0}
                                size={Number(resource.data?.size) || PAGE_SIZE}
                                total={pageTotal(resource.data)}
                            />
                        </>
                    ) : (
                        <div className="p-6">
                            <AdminManagementEmpty
                                text="Du kannst neue Sanktionen anlegen. Das Fallverzeichnis bleibt ohne das zugehörige Leserecht verborgen."
                                title="Kein Leserecht für bestehende Fälle"
                            />
                        </div>
                    )}
                </AdminPanel>
                {creating && (
                    <CaseCreateEditor
                        key={`create-${type}`}
                        onCancel={() => setCreating(false)}
                        onSaved={async () => {
                            setCreating(false);
                            await reload();
                        }}
                        reasons={reasons}
                        type={type}
                    />
                )}
                {selected && (
                    <CaseDetail
                        key={`${type}-${selected.id}`}
                        caseValue={selected}
                        onClose={() => setSelected(null)}
                        type={type}
                    />
                )}
            </section>
        </AdminManagementPage>
    );
}

function CaseTable({ rows, type, canWrite, onChanged, onSelect, onError }) {
    const columns = useMemo(
        () =>
            columnHelper.columns([
                columnHelper.accessor('username', {
                    header: 'Spieler',
                    cell: (context) => (
                        <div>
                            <b className="block text-sm text-zinc-200">{context.getValue()}</b>
                            <span className="mt-1 block font-mono text-[9px] text-zinc-600">
                                {compactId(context.row.original.userId)}
                            </span>
                        </div>
                    )
                }),
                columnHelper.accessor('status', {
                    header: 'Status',
                    cell: (context) => <StatusPill value={humanize(context.getValue())} />
                }),
                columnHelper.accessor('reasonKey', {
                    header: 'Grund',
                    cell: (context) => (
                        <div>
                            <b className="block font-mono text-[10px] text-zinc-300">{context.getValue()}</b>
                            <span className="mt-1 block max-w-56 truncate text-[9px] text-zinc-600">
                                {context.row.original.reasonDescription}
                            </span>
                        </div>
                    )
                }),
                columnHelper.accessor('moderatorUsername', {
                    header: 'Moderiert von',
                    cell: (context) => (
                        <span className="text-xs text-zinc-500">
                            {context.getValue() || compactId(context.row.original.moderatorId)}
                        </span>
                    )
                }),
                columnHelper.accessor('expiresAt', {
                    header: 'Läuft aus',
                    cell: (context) => (
                        <time className="text-xs text-zinc-500">
                            {context.getValue() ? formatDate(context.getValue()) : 'Permanent'}
                        </time>
                    )
                }),
                columnHelper.accessor('createdAt', {
                    header: 'Erstellt',
                    cell: (context) => <time className="text-xs text-zinc-500">{formatDate(context.getValue())}</time>
                }),
                columnHelper.display({
                    id: 'actions',
                    header: '',
                    cell: (context) => (
                        <div className="flex justify-end gap-2">
                            <button
                                className="admin-forum-secondary !px-3"
                                onClick={() => onSelect(context.row.original)}
                                type="button"
                            >
                                <FaEye /> Verlauf
                            </button>
                            {canWrite && context.row.original.status === 'ACTIVE' && (
                                <button
                                    className="admin-forum-danger !px-3"
                                    onClick={async () => {
                                        try {
                                            const note = window.prompt(
                                                `${type === 'ban' ? 'Ban' : 'Mute'} aufheben – interne Notiz:`
                                            );
                                            if (note === null) return;
                                            const normalizedNote = note.trim();
                                            if (normalizedNote.length > 1000) {
                                                onError('Die interne Notiz darf höchstens 1.000 Zeichen enthalten.');
                                                return;
                                            }
                                            if (!window.confirm('Diese aktive Sanktion wirklich aufheben?')) return;
                                            onError('');
                                            if (type === 'ban')
                                                await userAdminApi.revokeBan(context.row.original.id, normalizedNote);
                                            else await userAdminApi.revokeMute(context.row.original.id, normalizedNote);
                                            await onChanged();
                                        } catch (error) {
                                            onError(error.message);
                                        }
                                    }}
                                    type="button"
                                >
                                    <FaXmark /> Aufheben
                                </button>
                            )}
                        </div>
                    )
                })
            ]),
        [canWrite, onChanged, onError, onSelect, type]
    );
    return rows.length ? (
        <AdminDataTable
            columns={columns}
            getSearchValue={(row) =>
                `${row.username} ${row.userId} ${row.reasonKey} ${row.moderatorUsername} ${row.status}`
            }
            rows={rows}
            searchPlaceholder="Geladene Fälle filtern …"
        />
    ) : (
        <AdminManagementEmpty
            title="Keine Sanktionen gefunden"
            text="Für die aktuelle Suche und Filterkombination existiert kein Fall."
        />
    );
}

function CaseCreateEditor({ type, reasons, onCancel, onSaved }) {
    const [message, setMessage] = useState('');
    const idempotencyKey = useRef(createIdempotencyKey());
    const form = useForm({
        defaultValues: { userId: '', reasonKey: reasons[0]?.key || '', customDurationSeconds: '', note: '' },
        onSubmit: async ({ value }) => {
            setMessage('');
            const validationError = validateCaseDraft(value, reasons);
            if (validationError) {
                setMessage(validationError);
                return;
            }
            try {
                const body = {
                    userId: value.userId.trim(),
                    reasonKey: value.reasonKey.trim(),
                    customDurationSeconds:
                        value.customDurationSeconds === '' ? null : Number(value.customDurationSeconds),
                    note: value.note.trim() || null
                };
                if (type === 'ban') await userAdminApi.createBan(body, idempotencyKey.current);
                else await userAdminApi.createMute(body, idempotencyKey.current);
                await onSaved();
            } catch (error) {
                setMessage(error.message);
            }
        }
    });
    return (
        <AdminPanel
            className="h-fit"
            description="UUID und Grund werden vom User-Service geprüft; doppelte Übermittlungen sind idempotent."
            eyebrow="NEUER FALL"
            title={type === 'ban' ? 'Ban anlegen' : 'Mute anlegen'}
        >
            <form
                className="space-y-4 p-5 sm:p-6"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.handleSubmit();
                }}
            >
                <TextField
                    form={form}
                    label="Benutzer-UUID"
                    maxLength={36}
                    name="userId"
                    pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
                    required
                />
                {reasons.length ? (
                    <SelectField
                        form={form}
                        label="Sanktionsgrund"
                        name="reasonKey"
                        options={reasons.map((reason) => ({ value: reason.key, label: reason.description }))}
                    />
                ) : (
                    <TextField
                        form={form}
                        label="Grundschlüssel"
                        maxLength={64}
                        name="reasonKey"
                        pattern="[a-z0-9][a-z0-9._-]{0,63}"
                        required
                    />
                )}
                <TextField
                    form={form}
                    label="Abweichende Dauer (Sekunden)"
                    max={315576000}
                    min={60}
                    name="customDurationSeconds"
                    step={1}
                    type="number"
                />
                <form.Field name="note">
                    {(field) => (
                        <label className="admin-forum-field">
                            <span>Interne Notiz</span>
                            <textarea
                                className="admin-forum-input min-h-24 resize-y"
                                maxLength={1000}
                                onChange={(event) => field.handleChange(event.target.value)}
                                value={field.state.value}
                            />
                        </label>
                    )}
                </form.Field>
                {message && (
                    <p className="rounded-xl border border-red-400/15 bg-red-400/[.05] p-3 text-xs text-red-300">
                        {message}
                    </p>
                )}
                <div className="flex justify-end gap-2 border-t border-white/[.05] pt-4">
                    <button className="admin-forum-secondary" onClick={onCancel} type="button">
                        Abbrechen
                    </button>
                    <button className="forum-button-primary" type="submit">
                        <FaGavel /> Sanktion anlegen
                    </button>
                </div>
            </form>
        </AdminPanel>
    );
}

function CaseDetail({ caseValue, type, onClose }) {
    const [historyPage, setHistoryPage] = useState(0);
    const loader = useCallback(
        () =>
            type === 'ban'
                ? userAdminApi.banCaseHistory(caseValue.id, historyPage, 50)
                : userAdminApi.muteCaseHistory(caseValue.id, historyPage, 50),
        [caseValue.id, historyPage, type]
    );
    const history = useAdminResource(loader, [loader]);
    return (
        <AdminPanel
            actions={
                <button
                    aria-label="Verlauf schließen"
                    className="admin-forum-secondary !px-3"
                    onClick={onClose}
                    type="button"
                >
                    <FaXmark />
                </button>
            }
            className="h-fit"
            description={caseValue.id}
            eyebrow="FALLVERLAUF"
            title={caseValue.username}
        >
            <div className="grid gap-3 border-b border-white/[.05] p-5 sm:grid-cols-2 2xl:grid-cols-1">
                <Detail label="Status" value={humanize(caseValue.status)} />
                <Detail label="Grund" value={caseValue.reasonDescription || caseValue.reasonKey} />
                <Detail label="Erstellt" value={formatDate(caseValue.createdAt)} />
                <Detail label="Läuft aus" value={caseValue.expiresAt ? formatDate(caseValue.expiresAt) : 'Permanent'} />
            </div>
            {history.loading ? (
                <div className="p-5">
                    <AdminManagementLoading title="Fallverlauf wird geladen" />
                </div>
            ) : history.error ? (
                <div className="p-5">
                    <AdminManagementError message={history.error} retry={history.reload} />
                </div>
            ) : pageRows(history.data).length ? (
                <div className="divide-y divide-white/[.045]">
                    {pageRows(history.data).map((entry) => (
                        <div className="px-5 py-4" key={entry.id}>
                            <div className="flex items-center justify-between gap-3">
                                <StatusPill value={humanize(entry.action)} />
                                <time className="text-[9px] text-zinc-600">{formatDate(entry.createdAt)}</time>
                            </div>
                            <p className="mt-2 text-xs text-zinc-400">
                                {entry.note || entry.reasonKey || 'Keine zusätzliche Notiz'}
                            </p>
                            <span className="mt-1 block text-[9px] text-zinc-600">
                                {entry.actorUsername || entry.actorReference || 'System'}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <AdminManagementEmpty
                    title="Noch kein Verlauf"
                    text="Für diesen Fall ist nur der aktuelle Stand vorhanden."
                />
            )}
            <AdminPagination
                onPage={setHistoryPage}
                page={Number(history.data?.page) || historyPage}
                size={Number(history.data?.size) || 50}
                total={pageTotal(history.data)}
            />
        </AdminPanel>
    );
}

function ReasonList({ type, reasons, canWrite, onCreate, onEdit, onDelete }) {
    const label = type === 'ban' ? 'Ban-Gründe' : 'Mute-Gründe';
    const columns = useMemo(
        () =>
            columnHelper.columns([
                columnHelper.accessor('key', {
                    header: 'Schlüssel',
                    cell: (context) => (
                        <div>
                            <b className="block font-mono text-[10px] text-zinc-300">{context.getValue()}</b>
                            <span className="mt-1 block max-w-md text-[9px] text-zinc-600">
                                {context.row.original.description}
                            </span>
                        </div>
                    )
                }),
                columnHelper.display({
                    id: 'duration',
                    header: 'Standarddauer',
                    cell: (context) => (
                        <span className="text-xs text-zinc-500">
                            {durationLabel(context.row.original.defaultDurationSeconds, context.row.original.permanent)}
                        </span>
                    )
                }),
                columnHelper.accessor('activeCases', {
                    header: 'Aktiv',
                    cell: (context) => <span className="text-xs text-zinc-500">{metric(context.getValue())}</span>
                }),
                columnHelper.accessor('totalCases', {
                    header: 'Gesamt',
                    cell: (context) => <span className="text-xs text-zinc-500">{metric(context.getValue())}</span>
                }),
                columnHelper.accessor('updatedAt', {
                    header: 'Geändert',
                    cell: (context) => <time className="text-xs text-zinc-500">{formatDate(context.getValue())}</time>
                }),
                columnHelper.display({
                    id: 'actions',
                    header: '',
                    cell: (context) =>
                        canWrite ? (
                            <div className="flex justify-end gap-2">
                                <button
                                    className="admin-forum-secondary !px-3"
                                    onClick={() => onEdit(context.row.original)}
                                    type="button"
                                >
                                    <FaPen />
                                </button>
                                <button
                                    aria-label="Grund löschen"
                                    className="admin-forum-danger !px-3"
                                    disabled={Number(context.row.original.totalCases) > 0}
                                    onClick={() => onDelete(context.row.original)}
                                    title={
                                        Number(context.row.original.totalCases) > 0
                                            ? 'Verwendete Gründe bleiben für die Fallhistorie erhalten.'
                                            : 'Sanktionsgrund löschen'
                                    }
                                    type="button"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        ) : null
                })
            ]),
        [canWrite, onDelete, onEdit]
    );
    return (
        <AdminPanel
            actions={
                canWrite ? (
                    <button className="admin-forum-secondary" onClick={onCreate} type="button">
                        <FaPlus /> Grund anlegen
                    </button>
                ) : null
            }
            description="Versionierte Vorgaben; bereits in einem Fall verwendete Gründe bleiben dauerhaft erhalten."
            eyebrow={type === 'ban' ? 'BANS' : 'MUTES'}
            title={label}
        >
            {reasons.length ? (
                <AdminDataTable
                    columns={columns}
                    getSearchValue={(row) => `${row.key} ${row.description}`}
                    rows={reasons}
                    searchPlaceholder={`${label} filtern …`}
                />
            ) : (
                <AdminManagementEmpty
                    title={`Keine ${label}`}
                    text="Es ist noch kein auswählbarer Sanktionsgrund konfiguriert."
                />
            )}
        </AdminPanel>
    );
}

function ReasonEditor({ type, reason, onCancel, onSaved }) {
    const [message, setMessage] = useState('');
    const form = useForm({
        defaultValues: {
            key: reason?.key || '',
            description: reason?.description || '',
            permanent: Boolean(reason?.permanent),
            defaultDurationSeconds: reason?.defaultDurationSeconds == null ? '' : String(reason.defaultDurationSeconds)
        },
        onSubmit: async ({ value }) => {
            setMessage('');
            const validationError = validateReasonDraft(value);
            if (validationError) {
                setMessage(validationError);
                return;
            }
            try {
                const body = {
                    key: value.key.trim(),
                    description: value.description.trim(),
                    permanent: value.permanent,
                    defaultDurationSeconds:
                        value.permanent || value.defaultDurationSeconds === ''
                            ? null
                            : Number(value.defaultDurationSeconds),
                    version: reason?.version ?? null
                };
                if (type === 'ban') await userAdminApi.saveBanReason(body, Boolean(reason));
                else await userAdminApi.saveMuteReason(body, Boolean(reason));
                await onSaved();
            } catch (error) {
                setMessage(error.message);
            }
        }
    });
    return (
        <AdminPanel
            className="h-fit"
            description="Schlüssel sind nach der Anlage stabil; Änderungen nutzen optimistisches Locking."
            eyebrow={reason ? 'BEARBEITEN' : 'NEU'}
            title={`${type === 'ban' ? 'Ban' : 'Mute'}-Grund`}
        >
            <form
                className="space-y-4 p-5 sm:p-6"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.handleSubmit();
                }}
            >
                <TextField
                    disabled={Boolean(reason)}
                    form={form}
                    label="Schlüssel"
                    maxLength={64}
                    name="key"
                    pattern="[a-z0-9][a-z0-9._-]{0,63}"
                    required
                />
                <form.Field name="description">
                    {(field) => (
                        <label className="admin-forum-field">
                            <span>Beschreibung</span>
                            <textarea
                                className="admin-forum-input min-h-24 resize-y"
                                maxLength={500}
                                onChange={(event) => field.handleChange(event.target.value)}
                                required
                                value={field.state.value}
                            />
                        </label>
                    )}
                </form.Field>
                <form.Field name="permanent">
                    {(field) => (
                        <label className="flex items-center gap-3 rounded-xl border border-white/[.06] bg-black/10 p-4 text-xs font-bold text-zinc-400">
                            <input
                                checked={field.state.value}
                                onChange={(event) => field.handleChange(event.target.checked)}
                                type="checkbox"
                            />{' '}
                            Permanente Sanktion
                        </label>
                    )}
                </form.Field>
                <form.Subscribe selector={(state) => state.values.permanent}>
                    {(permanent) => (
                        <TextField
                            disabled={permanent}
                            form={form}
                            label="Standarddauer in Sekunden"
                            max={315576000}
                            min={60}
                            name="defaultDurationSeconds"
                            required={!permanent}
                            step={1}
                            type="number"
                        />
                    )}
                </form.Subscribe>
                {message && (
                    <p className="rounded-xl border border-red-400/15 bg-red-400/[.05] p-3 text-xs text-red-300">
                        {message}
                    </p>
                )}
                <div className="flex justify-end gap-2 border-t border-white/[.05] pt-4">
                    <button className="admin-forum-secondary" onClick={onCancel} type="button">
                        Abbrechen
                    </button>
                    <button className="forum-button-primary" type="submit">
                        <FaFileShield /> Speichern
                    </button>
                </div>
            </form>
        </AdminPanel>
    );
}

function TextField({
    form,
    name,
    label,
    type = 'text',
    required = false,
    pattern,
    min,
    max,
    maxLength,
    step,
    disabled = false
}) {
    return (
        <form.Field name={name}>
            {(field) => (
                <label className="admin-forum-field">
                    <span>{label}</span>
                    <input
                        className="admin-forum-input"
                        disabled={disabled}
                        max={max}
                        maxLength={maxLength}
                        min={min}
                        onChange={(event) => field.handleChange(event.target.value)}
                        pattern={pattern}
                        required={required}
                        step={step}
                        type={type}
                        value={field.state.value}
                    />
                </label>
            )}
        </form.Field>
    );
}

function SelectField({ form, name, label, options }) {
    return (
        <form.Field name={name}>
            {(field) => (
                <label className="admin-forum-field">
                    <span>{label}</span>
                    <select
                        className="admin-forum-input"
                        onChange={(event) => field.handleChange(event.target.value)}
                        required
                        value={field.state.value}
                    >
                        <option disabled value="">
                            Bitte auswählen
                        </option>
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
            )}
        </form.Field>
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

function ActionError({ message }) {
    return (
        <div
            className="rounded-xl border border-red-400/15 bg-red-400/[.05] px-4 py-3 text-xs text-red-300"
            role="alert"
        >
            {message}
        </div>
    );
}

function emptyPage(size) {
    return { content: [], page: 0, size, totalElements: 0, totalPages: 0, first: true, last: true };
}

function createIdempotencyKey() {
    return (
        globalThis.crypto?.randomUUID?.() ||
        `moderation-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 18)}`
    );
}

function validateCaseDraft(value, reasons) {
    const userId = value.userId.trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
        return 'Bitte gib eine vollständige Benutzer-UUID im Format 00000000-0000-0000-0000-000000000000 ein.';
    }

    const reasonKey = value.reasonKey.trim();
    if (!/^[a-z0-9][a-z0-9._-]{0,63}$/.test(reasonKey)) {
        return 'Der Grundschlüssel muss 1–64 Zeichen lang sein und darf nur Kleinbuchstaben, Zahlen, Punkt, Unterstrich und Bindestrich enthalten.';
    }
    if (reasons.length && !reasons.some((reason) => reason.key === reasonKey)) {
        return 'Bitte wähle einen vorhandenen Sanktionsgrund aus.';
    }

    const hasCustomDuration = value.customDurationSeconds !== '';
    const customDuration = hasCustomDuration ? Number(value.customDurationSeconds) : null;
    if (hasCustomDuration && (!Number.isInteger(customDuration) || customDuration < 60 || customDuration > 315576000)) {
        return 'Die abweichende Dauer muss zwischen 60 und 315.576.000 ganzen Sekunden liegen.';
    }
    if (hasCustomDuration && reasons.find((reason) => reason.key === reasonKey)?.permanent) {
        return 'Für einen permanenten Sanktionsgrund darf keine abweichende Dauer angegeben werden.';
    }
    if (value.note.trim().length > 1000) return 'Die interne Notiz darf höchstens 1.000 Zeichen enthalten.';
    return '';
}

function validateReasonDraft(value) {
    const key = value.key.trim();
    if (!/^[a-z0-9][a-z0-9._-]{0,63}$/.test(key)) {
        return 'Der Grundschlüssel muss 1–64 Zeichen lang sein und darf nur Kleinbuchstaben, Zahlen, Punkt, Unterstrich und Bindestrich enthalten.';
    }
    const description = value.description.trim();
    if (!description || description.length > 500) {
        return 'Die Beschreibung muss zwischen 1 und 500 Zeichen lang sein.';
    }
    if (!value.permanent) {
        const duration = Number(value.defaultDurationSeconds);
        if (
            value.defaultDurationSeconds === '' ||
            !Number.isInteger(duration) ||
            duration < 60 ||
            duration > 315576000
        ) {
            return 'Temporäre Gründe benötigen eine Standarddauer zwischen 60 und 315.576.000 ganzen Sekunden.';
        }
    }
    return '';
}

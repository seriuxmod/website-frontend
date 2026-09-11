import { useCallback, useMemo, useRef, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useVirtualizer } from '@tanstack/react-virtual';
import { FaKey, FaLayerGroup, FaPen, FaPlus, FaShieldHalved, FaTrash, FaUserGroup } from 'react-icons/fa6';
import { hasAnyPermission } from '../../../lib/auth';
import { userAdminApi } from '../../../lib/userAdminApi';
import { AdminMetricCard } from '../AdminUi';
import {
    AdminDataTable,
    AdminManagementEmpty,
    AdminManagementLoading,
    AdminManagementPage,
    AdminPanel,
    StatusPill,
    columnHelper,
    formatDate,
    useAdminResource
} from './AdminManagementShared';
import { AdminBarChart, humanize, metric, rgbHex } from './UserAdminShared';

export default function PermissionsAdminView({ user }) {
    const canWrite = hasAnyPermission(user, 'permissions.group.write');
    const [editing, setEditing] = useState(null);
    const [creating, setCreating] = useState(false);
    const [actionError, setActionError] = useState('');
    const overview = useAdminResource(
        useCallback(() => userAdminApi.permissionsOverview(), []),
        []
    );
    const groups = useAdminResource(
        useCallback(() => userAdminApi.permissionGroups(), []),
        []
    );
    const catalog = useAdminResource(
        useCallback(() => userAdminApi.permissionCatalog(), []),
        []
    );
    const reload = () => Promise.all([overview.reload(), groups.reload(), catalog.reload()]);
    const error = overview.error || groups.error || catalog.error;
    const rows = groups.data || [];

    return (
        <AdminManagementPage
            actions={
                canWrite ? (
                    <button
                        className="forum-button-primary"
                        onClick={() => {
                            setEditing(null);
                            setCreating(true);
                        }}
                        type="button"
                    >
                        <FaPlus /> Gruppe anlegen
                    </button>
                ) : null
            }
            backend="User-Service"
            description="Berechtigungsgruppen, der zentrale Rechtekatalog und aktive Mitgliedschaften aus dem User-Service."
            error={error}
            eyebrow="RECHTEMODELL"
            icon={FaShieldHalved}
            loading={overview.loading || groups.loading || catalog.loading}
            onRetry={reload}
            title="Berechtigungen"
        >
            {overview.loading && !overview.data ? (
                <AdminManagementLoading title="Berechtigungsmodell wird geladen" />
            ) : (
                <>
                    <PermissionMetrics data={overview.data || {}} />
                    <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,.65fr)]">
                        <AdminBarChart
                            description="Aktive Gruppenzuweisungen pro Berechtigungsgruppe."
                            id="permission-members"
                            rows={rows.map((group) => ({ label: group.displayName, value: group.activeMembers }))}
                            title="Mitglieder je Gruppe"
                        />
                        <CatalogSummary catalog={catalog.data || []} />
                    </section>
                    <section
                        className={`mt-6 grid gap-6 ${editing || creating ? '2xl:grid-cols-[minmax(0,1.3fr)_minmax(420px,.7fr)]' : ''}`}
                    >
                        <AdminPanel
                            description="Priorität, Standardgruppe und Umfang werden direkt aus der persistenten Gruppenkonfiguration gelesen."
                            eyebrow="GRUPPEN"
                            title="Berechtigungsgruppen"
                        >
                            {actionError && (
                                <div
                                    className="border-b border-red-400/10 bg-red-400/[.04] px-5 py-3 text-xs text-red-300"
                                    role="alert"
                                >
                                    {actionError}
                                </div>
                            )}
                            {groups.loading ? (
                                <div className="p-6">
                                    <AdminManagementLoading title="Gruppen werden geladen" />
                                </div>
                            ) : (
                                <PermissionTable
                                    canWrite={canWrite}
                                    onDelete={async (group) => {
                                        if (
                                            !window.confirm(
                                                `Berechtigungsgruppe „${group.displayName}“ wirklich löschen?`
                                            )
                                        )
                                            return;
                                        try {
                                            setActionError('');
                                            await userAdminApi.deletePermissionGroup(group.key, group.version);
                                            if (editing?.key === group.key) setEditing(null);
                                            await reload();
                                        } catch (deleteError) {
                                            setActionError(deleteError.message);
                                        }
                                    }}
                                    onEdit={(group) => {
                                        setCreating(false);
                                        setEditing(group);
                                    }}
                                    rows={rows}
                                />
                            )}
                        </AdminPanel>
                        {(editing || creating) && (
                            <PermissionGroupEditor
                                catalog={catalog.data || []}
                                group={editing}
                                key={editing?.key || 'new-permission-group'}
                                onCancel={() => {
                                    setEditing(null);
                                    setCreating(false);
                                }}
                                onSaved={async () => {
                                    setEditing(null);
                                    setCreating(false);
                                    await reload();
                                }}
                            />
                        )}
                    </section>
                </>
            )}
        </AdminManagementPage>
    );
}

function PermissionMetrics({ data }) {
    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <AdminMetricCard
                detail="konfigurierte Gruppen"
                icon={FaLayerGroup}
                label="Gruppen"
                tone="orange"
                value={metric(data.groups)}
            />
            <AdminMetricCard
                detail="aktive Zuweisungen"
                icon={FaUserGroup}
                label="Mitgliedschaften"
                tone="sky"
                value={metric(data.assignedMemberships)}
            />
            <AdminMetricCard
                detail="außerhalb von Gruppen"
                icon={FaKey}
                label="Direkte Rechte"
                tone="violet"
                value={metric(data.usersWithDirectPermissions)}
            />
            <AdminMetricCard
                detail="zeitlich begrenzt"
                icon={FaUserGroup}
                label="Laufen aus"
                tone="amber"
                value={metric(data.expiringMemberships)}
            />
            <AdminMetricCard
                detail="im zentralen Katalog"
                icon={FaShieldHalved}
                label="Rechte"
                tone="emerald"
                value={metric(data.distinctPermissions)}
            />
        </section>
    );
}

function CatalogSummary({ catalog }) {
    const byArea = useMemo(() => {
        const values = new Map();
        catalog.forEach((entry) => values.set(entry.area || 'other', (values.get(entry.area || 'other') || 0) + 1));
        return [...values.entries()].sort((left, right) => right[1] - left[1]);
    }, [catalog]);
    return (
        <AdminPanel
            description="Der Katalog ist die verbindliche Auswahl für Gruppenrechte."
            eyebrow="KATALOG"
            title="Rechtebereiche"
        >
            {byArea.length ? (
                <div className="divide-y divide-white/[.045]">
                    {byArea.map(([area, count]) => (
                        <div className="flex items-center justify-between gap-4 px-6 py-4" key={area}>
                            <div>
                                <b className="block text-sm text-zinc-300">{humanize(area)}</b>
                                <span className="mt-1 block text-[9px] text-zinc-600">{area}</span>
                            </div>
                            <StatusPill value={`${metric(count)} Rechte`} />
                        </div>
                    ))}
                </div>
            ) : (
                <AdminManagementEmpty
                    title="Rechtekatalog ist leer"
                    text="Der User-Service hat noch keine registrierten Berechtigungsschlüssel geliefert."
                />
            )}
        </AdminPanel>
    );
}

function PermissionTable({ rows, canWrite, onEdit, onDelete }) {
    const columns = useMemo(
        () =>
            columnHelper.columns([
                columnHelper.accessor('displayName', {
                    header: 'Gruppe',
                    cell: (context) => {
                        const group = context.row.original;
                        return (
                            <div className="flex items-center gap-3">
                                <i className="h-3 w-3 rounded-full" style={{ backgroundColor: rgbHex(group.color) }} />
                                <div>
                                    <b className="block text-sm text-zinc-200">{context.getValue()}</b>
                                    <span className="mt-1 block font-mono text-[9px] text-zinc-600">{group.key}</span>
                                </div>
                            </div>
                        );
                    }
                }),
                columnHelper.accessor('priority', {
                    header: 'Priorität',
                    cell: (context) => <b className="text-xs text-zinc-400">{context.getValue()}</b>
                }),
                columnHelper.accessor('permissions', {
                    header: 'Rechte',
                    cell: (context) => (
                        <span className="text-xs text-zinc-500">{metric(context.getValue()?.length)}</span>
                    )
                }),
                columnHelper.accessor('activeMembers', {
                    header: 'Mitglieder',
                    cell: (context) => <span className="text-xs text-zinc-500">{metric(context.getValue())}</span>
                }),
                columnHelper.accessor('defaultGroup', {
                    header: 'Typ',
                    cell: (context) => <StatusPill value={context.getValue() ? 'Standardgruppe' : 'Manuell'} />
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
                                    <FaPen /> Bearbeiten
                                </button>
                                <button
                                    aria-label="Gruppe löschen"
                                    className="admin-forum-danger !px-3"
                                    disabled={
                                        context.row.original.defaultGroup ||
                                        Number(context.row.original.activeMembers || 0) > 0
                                    }
                                    onClick={() => onDelete(context.row.original)}
                                    title={
                                        context.row.original.defaultGroup
                                            ? 'Standardgruppen können nicht gelöscht werden.'
                                            : Number(context.row.original.activeMembers || 0) > 0
                                              ? 'Entferne zuerst alle aktiven Gruppenzuweisungen.'
                                              : 'Berechtigungsgruppe löschen'
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
    return rows.length ? (
        <AdminDataTable
            columns={columns}
            getSearchValue={(row) => `${row.displayName} ${row.key} ${(row.permissions || []).join(' ')}`}
            rows={rows}
            searchPlaceholder="Gruppen oder Rechte filtern …"
        />
    ) : (
        <AdminManagementEmpty
            title="Keine Gruppen vorhanden"
            text="Lege die erste Berechtigungsgruppe an, sobald das Rechtekonzept feststeht."
        />
    );
}

function PermissionGroupEditor({ group, catalog, onCancel, onSaved }) {
    const [message, setMessage] = useState('');
    const form = useForm({
        defaultValues: {
            key: group?.key || '',
            displayName: group?.displayName || '',
            description: group?.description || '',
            badgeUrl: group?.badgeUrl || '',
            color: rgbHex(group?.color ?? 0xff7417),
            defaultGroup: Boolean(group?.defaultGroup),
            priority: String(group?.priority ?? 0),
            permissions: [...(group?.permissions || [])]
        },
        onSubmit: async ({ value }) => {
            setMessage('');
            const validationError = validatePermissionGroupDraft(value);
            if (validationError) {
                setMessage(validationError);
                return;
            }
            try {
                const body = {
                    key: value.key.trim(),
                    displayName: value.displayName.trim(),
                    description: value.description.trim() || null,
                    badgeUrl: value.badgeUrl.trim() || null,
                    permissions: [...new Set(value.permissions)],
                    color: Number.parseInt(value.color.slice(1), 16),
                    defaultGroup: value.defaultGroup,
                    priority: Number(value.priority),
                    version: group?.version ?? null
                };
                if (group) await userAdminApi.updatePermissionGroup(group.key, body);
                else await userAdminApi.createPermissionGroup(body);
                await onSaved();
            } catch (error) {
                setMessage(error.message);
            }
        }
    });
    return (
        <AdminPanel
            className="h-fit"
            description="Änderungen greifen nach erfolgreicher Speicherung für neu ausgewertete Berechtigungen."
            eyebrow={group ? 'BEARBEITEN' : 'NEU'}
            title={group?.displayName || 'Gruppe anlegen'}
        >
            <form
                className="space-y-4 p-5 sm:p-6"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.handleSubmit();
                }}
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                        disabled={Boolean(group)}
                        form={form}
                        label="Schlüssel"
                        name="key"
                        maxLength={64}
                        pattern="[a-z0-9][a-z0-9._-]{0,63}"
                        required
                    />
                    <TextField form={form} label="Anzeigename" maxLength={80} name="displayName" required />
                    <TextField
                        form={form}
                        label="Priorität"
                        max={10000}
                        min={-10000}
                        name="priority"
                        step={1}
                        type="number"
                    />
                    <form.Field name="color">
                        {(field) => (
                            <label className="admin-forum-field">
                                <span>Gruppenfarbe</span>
                                <input
                                    className="admin-forum-input h-12 !p-1"
                                    onChange={(event) => field.handleChange(event.target.value)}
                                    type="color"
                                    value={field.state.value}
                                />
                            </label>
                        )}
                    </form.Field>
                </div>
                <TextField form={form} label="Badge-URL" maxLength={2048} name="badgeUrl" type="url" />
                <form.Field name="description">
                    {(field) => (
                        <label className="admin-forum-field">
                            <span>Beschreibung</span>
                            <textarea
                                className="admin-forum-input min-h-24 resize-y"
                                maxLength={500}
                                onChange={(event) => field.handleChange(event.target.value)}
                                value={field.state.value}
                            />
                        </label>
                    )}
                </form.Field>
                <form.Field name="defaultGroup">
                    {(field) => (
                        <label className="flex items-center gap-3 rounded-xl border border-white/[.06] bg-black/10 p-4 text-xs font-bold text-zinc-400">
                            <input
                                checked={field.state.value}
                                onChange={(event) => field.handleChange(event.target.checked)}
                                type="checkbox"
                            />{' '}
                            Automatisch als Standardgruppe zuweisen
                        </label>
                    )}
                </form.Field>
                <form.Field name="permissions">
                    {(field) => (
                        <PermissionCatalogField
                            catalog={catalog}
                            onChange={field.handleChange}
                            value={field.state.value}
                        />
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
                        Speichern
                    </button>
                </div>
            </form>
        </AdminPanel>
    );
}

function PermissionCatalogField({ catalog, value, onChange }) {
    const parentRef = useRef(null);
    const rows = useMemo(
        () => [...catalog].sort((a, b) => `${a.area}.${a.key}`.localeCompare(`${b.area}.${b.key}`)),
        [catalog]
    );
    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 46,
        overscan: 8
    });
    const selected = new Set(value || []);
    return (
        <div>
            <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-zinc-500">
                    Berechtigungen
                </span>
                <span className="text-[9px] text-zinc-600">{selected.size} ausgewählt</span>
            </div>
            {rows.length ? (
                <div className="h-72 overflow-auto rounded-xl border border-white/[.065] bg-[#0b0c10]" ref={parentRef}>
                    <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
                        {virtualizer.getVirtualItems().map((virtualRow) => {
                            const entry = rows[virtualRow.index];
                            return (
                                <label
                                    className="absolute left-0 top-0 flex w-full cursor-pointer items-center gap-3 border-b border-white/[.04] px-4 text-xs hover:bg-white/[.02]"
                                    key={entry.key}
                                    style={{
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`
                                    }}
                                >
                                    <input
                                        checked={selected.has(entry.key)}
                                        onChange={(event) => {
                                            const next = new Set(selected);
                                            if (event.target.checked) next.add(entry.key);
                                            else next.delete(entry.key);
                                            onChange([...next]);
                                        }}
                                        type="checkbox"
                                    />
                                    <span className="min-w-0">
                                        <b className="block truncate font-mono text-[10px] text-zinc-300">
                                            {entry.key}
                                        </b>
                                        <small className="text-[8px] uppercase tracking-wider text-zinc-700">
                                            {entry.area}
                                        </small>
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <AdminManagementEmpty
                    title="Katalog ist leer"
                    text="Ohne registrierte Rechte kann die Gruppe dennoch ohne Berechtigungen gespeichert werden."
                />
            )}
        </div>
    );
}

function TextField({
    form,
    name,
    label,
    type = 'text',
    required = false,
    pattern,
    disabled = false,
    maxLength,
    min,
    max,
    step
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

function validatePermissionGroupDraft(value) {
    const key = value.key.trim();
    if (!/^[a-z0-9][a-z0-9._-]{0,63}$/.test(key)) {
        return 'Der Gruppenschlüssel muss 1–64 Zeichen lang sein und darf nur Kleinbuchstaben, Zahlen, Punkt, Unterstrich und Bindestrich enthalten.';
    }
    if (!value.displayName.trim() || value.displayName.trim().length > 80) {
        return 'Der Anzeigename muss zwischen 1 und 80 Zeichen lang sein.';
    }
    if (value.description.trim().length > 500) return 'Die Beschreibung darf höchstens 500 Zeichen enthalten.';
    if (value.badgeUrl.trim().length > 2048) return 'Die Badge-URL darf höchstens 2.048 Zeichen enthalten.';

    const priority = Number(value.priority);
    if (!Number.isInteger(priority) || priority < -10000 || priority > 10000) {
        return 'Die Priorität muss eine ganze Zahl zwischen -10.000 und 10.000 sein.';
    }

    const permissions = [...new Set(value.permissions || [])];
    if (permissions.length > 256) return 'Eine Gruppe darf höchstens 256 Berechtigungen enthalten.';
    if (permissions.some((permission) => !/^[a-z0-9][a-z0-9._:-]{0,119}$/.test(permission))) {
        return 'Mindestens eine Berechtigung entspricht nicht dem erlaubten Format oder ist länger als 120 Zeichen.';
    }
    return '';
}

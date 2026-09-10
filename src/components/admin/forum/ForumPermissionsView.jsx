import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { FaEye, FaFloppyDisk, FaKey, FaLock, FaShieldHalved, FaTrash, FaUserGroup } from 'react-icons/fa6';
import { forumApi, getPermissionGroups } from '../../../lib/forumApi';
import { AdminEmptyState, AdminMetricCard } from '../AdminUi';
import {
    ForumAdminError,
    ForumAdminPage,
    ForumLoading,
    ForumPanel,
    LiveDataTable,
    StatusPill,
    columnHelper,
    formatNumber,
    useForumResource
} from './AdminForumShared';

const PERMISSION_SECTIONS = [
    {
        title: 'Sichtbarkeit',
        fields: [
            ['view', 'Forum sehen'],
            ['viewOtherTopics', 'Themen anderer Nutzer sehen']
        ]
    },
    {
        title: 'Veröffentlichen',
        fields: [
            ['createTopic', 'Themen erstellen'],
            ['createPost', 'Beiträge schreiben'],
            ['editTopic', 'Themen bearbeiten'],
            ['editPost', 'Beiträge bearbeiten']
        ]
    },
    {
        title: 'Moderation',
        fields: [
            ['deleteTopic', 'Themen löschen'],
            ['deletePost', 'Beiträge löschen'],
            ['lock', 'Themen sperren'],
            ['stick', 'Themen anpinnen'],
            ['move', 'Themen verschieben'],
            ['merge', 'Themen zusammenführen']
        ]
    },
    {
        title: 'Interaktion',
        fields: [
            ['react', 'Reaktionen verwenden'],
            ['report', 'Inhalte melden']
        ]
    }
];
const PERMISSION_KEYS = PERMISSION_SECTIONS.flatMap((section) => section.fields.map(([key]) => key));

export default function ForumPermissionsView() {
    const loader = useCallback(async () => {
        const [nodes, matrix] = await Promise.all([forumApi.admin.nodes(), forumApi.admin.permissionMatrix()]);
        let sourceGroups = [];
        let groupsError = '';
        try {
            const groups = await getPermissionGroups();
            sourceGroups = Array.isArray(groups) ? groups : groups?.items || groups?.groups || [];
        } catch (error) {
            groupsError = error.message || 'Berechtigungsgruppen sind vorübergehend nicht erreichbar.';
        }
        const normalizedGroups = [{ key: '0', displayName: 'Gäste' }, ...sourceGroups].filter(
            (group, index, entries) =>
                entries.findIndex((candidate) => getGroupId(candidate) === getGroupId(group)) === index
        );
        return {
            nodes: nodes.nodes || [],
            groups: normalizedGroups,
            groupsError,
            groupCatalogAvailable: Boolean(matrix.groupCatalogAvailable),
            orphanGroupIds: Array.isArray(matrix.orphanGroupIds) ? matrix.orphanGroupIds.map(String) : []
        };
    }, []);
    const resource = useForumResource(loader, [loader]);
    const [forumId, setForumId] = useState('');
    const [permissions, setPermissions] = useState({ loading: false, data: [], error: '' });
    const permissionRequestId = useRef(0);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const forums = (resource.data?.nodes || []).filter((node) => node.type === 'FORUM' && !node.deleted);
    const groups = resource.data?.groups || [];
    const orphanGroupIds = resource.data?.orphanGroupIds || [];

    useEffect(() => {
        if (!forumId && forums[0]) setForumId(forums[0].id);
    }, [forumId, forums]);

    const loadPermissions = useCallback(async () => {
        if (!forumId) return;
        const requestId = ++permissionRequestId.current;
        setPermissions((current) => ({ ...current, loading: true, error: '' }));
        try {
            const data = await forumApi.admin.permissions(forumId);
            if (requestId !== permissionRequestId.current) return;
            setPermissions({ loading: false, data: Array.isArray(data) ? data : data?.items || [], error: '' });
        } catch (error) {
            if (requestId !== permissionRequestId.current) return;
            setPermissions({ loading: false, data: [], error: error.message });
        }
    }, [forumId]);

    useEffect(() => {
        loadPermissions();
        return () => {
            permissionRequestId.current += 1;
        };
    }, [loadPermissions]);

    const rows = useMemo(() => {
        const permissionsByGroup = new Map(
            permissions.data
                .filter((permission) => permission?.groupId != null)
                .map((permission) => [String(permission.groupId), permission])
        );
        const knownGroupIds = new Set(groups.map(getGroupId));
        const knownRows = groups.map((group) => {
            const groupId = getGroupId(group);
            const permission = permissionsByGroup.get(groupId);
            return {
                group,
                groupId,
                name: getGroupName(group),
                orphaned: false,
                configured: Boolean(permission),
                enabled: permission ? PERMISSION_KEYS.filter((key) => permission[key]).length : 0,
                permission
            };
        });
        const orphanGroupIdSet = new Set(orphanGroupIds);
        const additionalRows = [...permissionsByGroup.entries()]
            .filter(([groupId]) => !knownGroupIds.has(groupId))
            .map(([groupId, permission]) => {
                const orphaned = orphanGroupIdSet.has(groupId);
                return {
                    group: null,
                    groupId,
                    name: orphaned ? 'Unbekannte Gruppe' : 'Gruppenname nicht verfügbar',
                    orphaned,
                    configured: true,
                    enabled: PERMISSION_KEYS.filter((key) => permission[key]).length,
                    permission
                };
            });
        return [...knownRows, ...additionalRows];
    }, [groups, orphanGroupIds, permissions.data]);
    const selectedRow = rows.find((row) => row.groupId === selectedGroupId) || null;
    const configured = rows.filter((row) => row.configured).length;
    const configuredKnown = rows.filter((row) => !row.orphaned && row.configured).length;
    const orphanedCount = rows.filter((row) => row.orphaned).length;
    const selectedForum = forums.find((forum) => forum.id === forumId);

    const columns = useMemo(
        () =>
            columnHelper.columns([
                columnHelper.accessor('name', {
                    header: 'Berechtigungsgruppe',
                    cell: (context) => (
                        <div>
                            <b
                                className={`text-sm ${context.row.original.orphaned ? 'text-red-200' : 'text-zinc-200'}`}
                            >
                                {context.getValue()}
                            </b>
                            <span className="mt-1 block font-mono text-[9px] text-zinc-700">
                                {context.row.original.groupId}
                            </span>
                            {context.row.original.orphaned && (
                                <span className="mt-1 block text-[9px] font-extrabold uppercase tracking-[.1em] text-red-300">
                                    Gruppe nicht mehr vorhanden
                                </span>
                            )}
                        </div>
                    )
                }),
                columnHelper.accessor('configured', {
                    header: 'Zustand',
                    cell: (context) => (
                        <StatusPill
                            value={
                                context.row.original.orphaned
                                    ? 'Verwaiste Regel'
                                    : context.getValue()
                                      ? 'Konfiguriert'
                                      : 'Keine Regel'
                            }
                            tone={
                                context.row.original.orphaned
                                    ? 'border-red-400/15 bg-red-400/[.07] text-red-300'
                                    : context.getValue()
                                      ? 'border-emerald-400/15 bg-emerald-400/[.07] text-emerald-300'
                                      : undefined
                            }
                        />
                    )
                }),
                columnHelper.accessor('enabled', {
                    header: 'Freigaben',
                    cell: (context) => (
                        <span className="text-xs font-bold text-zinc-400">
                            {context.getValue()} / {PERMISSION_KEYS.length}
                        </span>
                    )
                }),
                columnHelper.display({
                    id: 'actions',
                    header: '',
                    cell: (context) => (
                        <button
                            className="admin-forum-secondary py-2"
                            onClick={() => setSelectedGroupId(context.row.original.groupId)}
                            type="button"
                        >
                            {context.row.original.orphaned ? 'Bereinigen' : 'Bearbeiten'}
                        </button>
                    )
                })
            ]),
        []
    );

    return (
        <ForumAdminPage
            description="Explizite Gruppenregeln pro Forum prüfen und bearbeiten. Die Gastgruppe gilt zusätzlich für jeden angemeldeten Nutzer; weitere Gruppenfreigaben werden serverseitig zusammengeführt."
            error={resource.error}
            eyebrow="ZUGRIFFSSTEUERUNG"
            icon={FaShieldHalved}
            loading={resource.loading}
            onRetry={resource.reload}
            title="Forum-Gruppenrechte"
        >
            {resource.loading || !resource.data ? (
                <ForumLoading title="Berechtigungsmodell wird geladen" />
            ) : forums.length === 0 ? (
                <AdminEmptyState
                    title="Keine Foren vorhanden"
                    text="Lege zuerst in der Struktur mindestens ein Forum an."
                />
            ) : (
                <>
                    {resource.data.groupsError && (
                        <p className="mb-5 rounded-xl border border-amber-400/15 bg-amber-400/[.05] px-4 py-3 text-xs text-amber-200">
                            Der User-Service konnte nicht geladen werden. Die Gastgruppe bleibt bearbeitbar; weitere
                            Gruppen werden nach dem nächsten Aktualisieren ergänzt. ({resource.data.groupsError})
                        </p>
                    )}
                    <div className="mb-6 flex flex-col gap-3 rounded-[22px] border border-white/[.07] bg-[#111218] p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <span className="text-[9px] font-extrabold uppercase tracking-[.14em] text-zinc-600">
                                Regelwerk für
                            </span>
                            <b className="mt-1 block text-sm text-zinc-200">
                                {selectedForum?.title || 'Forum auswählen'}
                            </b>
                        </div>
                        <select
                            className="admin-forum-input mt-0 w-full sm:w-80"
                            onChange={(event) => {
                                setForumId(event.target.value);
                                setSelectedGroupId('');
                            }}
                            value={forumId}
                        >
                            {forums.map((forum) => (
                                <option key={forum.id} value={forum.id}>
                                    {forum.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <AdminMetricCard
                            detail="aus dem User-Service"
                            icon={FaUserGroup}
                            label="Gruppen"
                            tone="sky"
                            value={formatNumber(groups.length)}
                        />
                        <AdminMetricCard
                            detail={
                                orphanedCount > 0
                                    ? `${formatNumber(orphanedCount)} ${orphanedCount === 1 ? 'verwaiste Regel' : 'verwaiste Regeln'}`
                                    : 'explizite Regeln in diesem Forum'
                            }
                            icon={FaKey}
                            label="Konfiguriert"
                            tone="orange"
                            value={formatNumber(configured)}
                        />
                        <AdminMetricCard
                            detail="ohne eigene Regel"
                            icon={FaEye}
                            label="Standardauswertung"
                            tone="emerald"
                            value={formatNumber(Math.max(0, groups.length - configuredKnown))}
                        />
                        <AdminMetricCard
                            detail="verfügbare Einzelrechte"
                            icon={FaLock}
                            label="Rechte je Gruppe"
                            tone="violet"
                            value={formatNumber(PERMISSION_KEYS.length)}
                        />
                    </section>

                    <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(390px,.8fr)]">
                        <ForumPanel
                            description="Suche eine Gruppe und öffne anschließend ihr Regelwerk."
                            eyebrow="REGELMATRIX"
                            title="Gruppenübersicht"
                        >
                            {permissions.loading ? (
                                <div className="p-6">
                                    <ForumLoading title="Rechte werden geladen" />
                                </div>
                            ) : permissions.error ? (
                                <div className="p-6">
                                    <ForumAdminError message={permissions.error} retry={loadPermissions} />
                                </div>
                            ) : (
                                <LiveDataTable
                                    columns={columns}
                                    getSearchValue={(row) => `${row.name} ${row.groupId}`}
                                    rows={rows}
                                    searchPlaceholder="Gruppe suchen …"
                                />
                            )}
                        </ForumPanel>
                        {selectedRow ? (
                            <PermissionEditor
                                forumId={forumId}
                                initial={selectedRow.permission}
                                groupId={selectedRow.groupId}
                                groupName={selectedRow.name}
                                key={`${forumId}-${selectedRow.groupId}-${selectedRow.configured}-${selectedRow.orphaned}`}
                                onChanged={loadPermissions}
                                orphaned={selectedRow.orphaned}
                            />
                        ) : (
                            <ForumPanel eyebrow="GRUPPENREGEL" title="Gruppe auswählen">
                                <div className="p-6">
                                    <AdminEmptyState
                                        title="Keine Gruppe ausgewählt"
                                        text="Wähle in der Tabelle eine Gruppe aus, um die einzelnen Rechte zu bearbeiten."
                                    />
                                </div>
                            </ForumPanel>
                        )}
                    </section>
                </>
            )}
        </ForumAdminPage>
    );
}

function PermissionEditor({ forumId, groupId, groupName, initial, onChanged, orphaned }) {
    const [message, setMessage] = useState({ error: '', success: '' });
    const defaultValues = Object.fromEntries([
        ['groupId', groupId],
        ...PERMISSION_KEYS.map((key) => [key, Boolean(initial?.[key])])
    ]);
    const form = useForm({
        defaultValues,
        onSubmit: async ({ value }) => {
            setMessage({ error: '', success: '' });
            try {
                await forumApi.admin.savePermission(forumId, value);
                setMessage({ error: '', success: 'Gruppenrechte wurden gespeichert.' });
                await onChanged();
            } catch (error) {
                setMessage({ error: error.message, success: '' });
            }
        }
    });

    const remove = async () => {
        if (!initial || !window.confirm(`Explizite Rechte für „${groupName}“ entfernen?`)) return;
        try {
            await forumApi.admin.deletePermission(forumId, groupId);
            setMessage({ error: '', success: 'Explizite Regel wurde entfernt.' });
            await onChanged();
        } catch (error) {
            setMessage({ error: error.message, success: '' });
        }
    };

    return (
        <ForumPanel
            description={
                orphaned
                    ? `Verwaiste Regel für Gruppen-ID ${groupId}`
                    : initial
                      ? 'Bestehende explizite Regel'
                      : 'Neue explizite Regel'
            }
            eyebrow="GRUPPENREGEL"
            title={groupName}
        >
            <form
                className="p-5 sm:p-6"
                onSubmit={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    form.handleSubmit();
                }}
            >
                {orphaned ? (
                    <div className="rounded-xl border border-red-400/15 bg-red-400/[.05] px-4 py-4 text-xs leading-relaxed text-red-200">
                        Diese Berechtigungsgruppe existiert im User-Service nicht mehr. Entferne die verwaiste Regel,
                        damit sie bei einer späteren Wiederverwendung der Gruppen-ID nicht erneut wirksam wird.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {PERMISSION_SECTIONS.map((section) => (
                            <fieldset key={section.title}>
                                <legend className="text-[9px] font-extrabold uppercase tracking-[.15em] text-orange-300">
                                    {section.title}
                                </legend>
                                <div className="mt-3 grid gap-2 sm:grid-cols-2 2xl:grid-cols-1 min-[1650px]:grid-cols-2">
                                    {section.fields.map(([key, label]) => (
                                        <form.Field key={key} name={key}>
                                            {(field) => (
                                                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[.055] bg-black/15 px-3 py-3 text-xs text-zinc-400">
                                                    <input
                                                        checked={Boolean(field.state.value)}
                                                        className="h-4 w-4 accent-orange-500"
                                                        onChange={(event) => field.handleChange(event.target.checked)}
                                                        type="checkbox"
                                                    />
                                                    <span>{label}</span>
                                                </label>
                                            )}
                                        </form.Field>
                                    ))}
                                </div>
                            </fieldset>
                        ))}
                    </div>
                )}
                {(message.error || message.success) && (
                    <p
                        className={`mt-5 rounded-xl border px-4 py-3 text-xs ${message.error ? 'border-red-400/15 bg-red-400/[.05] text-red-300' : 'border-emerald-400/15 bg-emerald-400/[.05] text-emerald-300'}`}
                    >
                        {message.error || message.success}
                    </p>
                )}
                <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-white/[.055] pt-5">
                    <button
                        className="admin-forum-secondary text-red-300"
                        disabled={!initial}
                        onClick={remove}
                        type="button"
                    >
                        <FaTrash /> {orphaned ? 'Verwaiste Regel entfernen' : 'Regel entfernen'}
                    </button>
                    {!orphaned && (
                        <form.Subscribe
                            selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
                        >
                            {({ canSubmit, isSubmitting }) => (
                                <button
                                    className="admin-forum-primary"
                                    disabled={!canSubmit || isSubmitting}
                                    type="submit"
                                >
                                    <FaFloppyDisk /> {isSubmitting ? 'Speichert …' : 'Rechte speichern'}
                                </button>
                            )}
                        </form.Subscribe>
                    )}
                </div>
            </form>
        </ForumPanel>
    );
}

function getGroupId(group) {
    return String(group?.key || group?.id || group?.name || '');
}

function getGroupName(group) {
    return group?.displayName || group?.name || group?.key || group?.id || 'Unbenannte Gruppe';
}

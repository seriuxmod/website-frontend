import { useCallback, useMemo, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { FaCode, FaFloppyDisk, FaLayerGroup, FaPlus, FaTags } from 'react-icons/fa6';
import { forumApi, getPermissionGroups } from '../../../lib/forumApi';
import { AdminEmptyState, AdminMetricCard } from '../AdminUi';
import {
    ForumAdminPage,
    ForumLoading,
    ForumPanel,
    LiveDataTable,
    StatusPill,
    columnHelper,
    formatNumber,
    useForumResource
} from './AdminForumShared';

export default function ForumLabelsView() {
    const loader = useCallback(async () => {
        const [nodes, labels, labelTypes] = await Promise.all([
            forumApi.admin.nodes(),
            forumApi.admin.labels(true),
            forumApi.admin.labelTypes(true)
        ]);
        let groups = [];
        let groupsError = '';
        try {
            const response = await getPermissionGroups();
            groups = Array.isArray(response) ? response : response?.items || response?.groups || [];
        } catch (error) {
            groupsError = error.message || 'Berechtigungsgruppen sind vorübergehend nicht erreichbar.';
        }
        groups = [{ key: '0', displayName: 'Gäste' }, ...groups].filter(
            (group, index, entries) =>
                entries.findIndex((candidate) => getGroupId(candidate) === getGroupId(group)) === index
        );
        return {
            nodes: nodes.nodes || [],
            groups,
            groupsError,
            labels: Array.isArray(labels) ? labels : labels?.items || [],
            labelTypes: Array.isArray(labelTypes) ? labelTypes : labelTypes?.items || []
        };
    }, []);
    const resource = useForumResource(loader, [loader]);
    const [mode, setMode] = useState('labels');
    const [selectedId, setSelectedId] = useState('');

    const data = resource.data || { nodes: [], groups: [], labels: [], labelTypes: [] };
    const activeLabels = data.labels.filter((label) => !label.deleted);
    const activeTypes = data.labelTypes.filter((type) => !type.deleted);

    return (
        <ForumAdminPage
            actions={
                <div className="flex rounded-xl border border-white/[.07] bg-[#0b0c10] p-1">
                    <ModeButton
                        active={mode === 'labels'}
                        label="Topic-Labels"
                        onClick={() => {
                            setMode('labels');
                            setSelectedId('');
                        }}
                    />
                    <ModeButton
                        active={mode === 'types'}
                        label="Darstellungstypen"
                        onClick={() => {
                            setMode('types');
                            setSelectedId('');
                        }}
                    />
                </div>
            }
            description="Topic-Labels, ihre optische Vorlage und ihre Verfügbarkeit für Foren und Berechtigungsgruppen verwalten."
            error={resource.error}
            eyebrow="KLASSIFIZIERUNG"
            icon={FaTags}
            loading={resource.loading}
            onRetry={resource.reload}
            title="Labels"
        >
            {resource.loading || !resource.data ? (
                <ForumLoading title="Labels werden geladen" />
            ) : (
                <>
                    {resource.data.groupsError && (
                        <p className="mb-5 rounded-xl border border-amber-400/15 bg-amber-400/[.05] px-4 py-3 text-xs text-amber-200">
                            Labels sind verfügbar, aber zusätzliche Gruppen aus dem User-Service konnten nicht geladen
                            werden. Die Gastgruppe bleibt auswählbar. ({resource.data.groupsError})
                        </p>
                    )}
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <AdminMetricCard
                            detail="aktuell verwendbar"
                            icon={FaTags}
                            label="Aktive Labels"
                            tone="orange"
                            value={formatNumber(activeLabels.length)}
                        />
                        <AdminMetricCard
                            detail="HTML-Vorlagen für Badges"
                            icon={FaCode}
                            label="Darstellungstypen"
                            tone="sky"
                            value={formatNumber(activeTypes.length)}
                        />
                        <AdminMetricCard
                            detail="mit Forenzuordnung"
                            icon={FaLayerGroup}
                            label="Gezielt zugeordnet"
                            tone="violet"
                            value={formatNumber(activeLabels.filter((label) => label.forumIds?.length).length)}
                        />
                        <AdminMetricCard
                            detail="archiviert und unsichtbar"
                            icon={FaTags}
                            label="Archiviert"
                            tone="red"
                            value={formatNumber(
                                data.labels.filter((label) => label.deleted).length +
                                    data.labelTypes.filter((type) => type.deleted).length
                            )}
                        />
                    </section>
                    <section className="mt-6">
                        {mode === 'labels' ? (
                            <LabelsWorkspace
                                data={data}
                                onReload={resource.reload}
                                selectedId={selectedId}
                                setSelectedId={setSelectedId}
                            />
                        ) : (
                            <TypesWorkspace
                                data={data}
                                onReload={resource.reload}
                                selectedId={selectedId}
                                setSelectedId={setSelectedId}
                            />
                        )}
                    </section>
                </>
            )}
        </ForumAdminPage>
    );
}

function LabelsWorkspace({ data, selectedId, setSelectedId, onReload }) {
    const selected = data.labels.find((label) => label.id === selectedId) || null;
    const columns = useMemo(
        () =>
            columnHelper.columns([
                columnHelper.accessor('name', {
                    header: 'Label',
                    cell: (context) => <b className="text-sm text-zinc-200">{context.getValue()}</b>
                }),
                columnHelper.accessor('labelTypeId', {
                    header: 'Darstellung',
                    cell: (context) => (
                        <span className="text-xs text-zinc-500">
                            {data.labelTypes.find((type) => type.id === context.getValue())?.name || context.getValue()}
                        </span>
                    )
                }),
                columnHelper.accessor((row) => row.forumIds?.length || 0, {
                    id: 'forums',
                    header: 'Foren',
                    cell: (context) => <span className="text-xs font-bold text-zinc-400">{context.getValue()}</span>
                }),
                columnHelper.accessor((row) => row.groupIds?.length || 0, {
                    id: 'groups',
                    header: 'Gruppen',
                    cell: (context) => (
                        <span className="text-xs font-bold text-zinc-400">{context.getValue() || 'Alle'}</span>
                    )
                }),
                columnHelper.accessor('deleted', {
                    header: 'Status',
                    cell: (context) => <StatusPill value={context.getValue() ? 'Archiviert' : 'Aktiv'} />
                }),
                columnHelper.display({
                    id: 'actions',
                    header: '',
                    cell: (context) => (
                        <button
                            className="admin-forum-secondary py-2"
                            onClick={() => setSelectedId(context.row.original.id)}
                            type="button"
                        >
                            Bearbeiten
                        </button>
                    )
                })
            ]),
        [data.labelTypes, setSelectedId]
    );

    return (
        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(390px,.8fr)]">
            <ForumPanel
                actions={
                    <button className="admin-forum-primary" onClick={() => setSelectedId('new')} type="button">
                        <FaPlus /> Label anlegen
                    </button>
                }
                description="Alle Labels inklusive archivierter Einträge."
                eyebrow="TOPIC-LABELS"
                title="Label-Verzeichnis"
            >
                <LiveDataTable
                    columns={columns}
                    emptyText="Lege das erste Label für die Themenklassifizierung an."
                    emptyTitle="Keine Labels vorhanden"
                    getSearchValue={(row) => `${row.name} ${row.labelTypeId}`}
                    rows={data.labels}
                    searchPlaceholder="Labels durchsuchen …"
                />
            </ForumPanel>
            {selected || selectedId === 'new' ? (
                <LabelEditor data={data} initial={selected} key={selected?.id || 'new-label'} onReload={onReload} />
            ) : (
                <ForumPanel eyebrow="EDITOR" title="Label auswählen">
                    <div className="p-6">
                        <AdminEmptyState
                            title="Kein Label ausgewählt"
                            text="Öffne ein vorhandenes Label oder lege ein neues an."
                        />
                    </div>
                </ForumPanel>
            )}
        </div>
    );
}

function LabelEditor({ data, initial, onReload }) {
    const [message, setMessage] = useState({ error: '', success: '' });
    const initialForumIds = normalizeIds(initial?.forumIds);
    const initialGroupIds = normalizeIds(initial?.groupIds);
    const form = useForm({
        defaultValues: {
            name: initial?.name || '',
            labelTypeId: initial?.labelTypeId || data.labelTypes.find((type) => !type.deleted)?.id || '',
            forumIds: initialForumIds,
            groupIds: initialGroupIds,
            deleted: initial?.deleted || false
        },
        onSubmit: async ({ value }) => {
            setMessage({ error: '', success: '' });
            try {
                await forumApi.admin.saveLabel(initial?.id || 'new', { ...value, name: value.name.trim() });
                setMessage({ error: '', success: 'Label wurde gespeichert.' });
                await onReload();
            } catch (error) {
                setMessage({ error: error.message, success: '' });
            }
        }
    });
    const forumOptions = buildReferenceOptions({
        catalog: data.nodes.filter((node) => node.type === 'FORUM'),
        selectedIds: initialForumIds,
        getId: (forum) => forum.id,
        getLabel: (forum) => forum.title,
        isArchived: (forum) => Boolean(forum.deleted),
        archivedDetail: 'Archiviertes Forum · durch Abwahl entfernen',
        missingLabel: 'Unbekanntes Forum',
        missingDetail: 'Forum nicht mehr vorhanden · durch Abwahl entfernen'
    });
    const groupOptions = buildReferenceOptions({
        catalog: data.groups,
        selectedIds: initialGroupIds,
        getId: getGroupId,
        getLabel: getGroupName,
        isArchived: (group) => Boolean(group.deleted || group.archived),
        archivedDetail: 'Archivierte Gruppe · durch Abwahl entfernen',
        missingLabel: 'Unbekannte Berechtigungsgruppe',
        missingDetail: data.groupsError
            ? 'Gruppenstatus nicht verfügbar · Referenz kann abgewählt werden'
            : 'Gruppe nicht mehr vorhanden · durch Abwahl entfernen'
    });
    return (
        <ForumPanel
            description="Leere Forum- oder Gruppenauswahl gilt jeweils global. Veraltete Referenzen lassen sich gezielt entfernen."
            eyebrow="LABEL-EDITOR"
            title={initial?.name || 'Neues Label'}
        >
            <form
                className="p-5 sm:p-6"
                onSubmit={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <div className="grid gap-5 sm:grid-cols-2">
                    <form.Field name="name">
                        {(field) => (
                            <label className="admin-forum-field">
                                <span>Name</span>
                                <input
                                    className="admin-forum-input"
                                    maxLength={32}
                                    required
                                    value={field.state.value}
                                    onChange={(event) => field.handleChange(event.target.value)}
                                />
                            </label>
                        )}
                    </form.Field>
                    <form.Field name="labelTypeId">
                        {(field) => (
                            <label className="admin-forum-field">
                                <span>Darstellungstyp</span>
                                <select
                                    className="admin-forum-input"
                                    required
                                    value={field.state.value}
                                    onChange={(event) => field.handleChange(event.target.value)}
                                >
                                    <option value="">Bitte wählen</option>
                                    {data.labelTypes
                                        .filter((type) => !type.deleted || type.id === initial?.labelTypeId)
                                        .map((type) => (
                                            <option key={type.id} value={type.id}>
                                                {type.name}
                                            </option>
                                        ))}
                                </select>
                            </label>
                        )}
                    </form.Field>
                </div>
                <form.Field name="forumIds">
                    {(field) => (
                        <SelectionGrid
                            hint="Keine Auswahl = in allen Foren verfügbar"
                            items={forumOptions}
                            label="Verfügbare Foren"
                            onChange={field.handleChange}
                            selected={field.state.value}
                        />
                    )}
                </form.Field>
                <form.Field name="groupIds">
                    {(field) => (
                        <SelectionGrid
                            hint="Keine Auswahl = alle Gruppen"
                            items={groupOptions}
                            label="Berechtigungsgruppen"
                            onChange={field.handleChange}
                            selected={field.state.value}
                        />
                    )}
                </form.Field>
                {initial && (
                    <form.Field name="deleted">
                        {(field) => (
                            <label className="mt-5 flex cursor-pointer items-center justify-between rounded-2xl border border-red-400/15 bg-red-400/[.035] p-4 text-xs font-bold text-red-200">
                                <span>Label archivieren</span>
                                <input
                                    checked={field.state.value}
                                    className="accent-orange-500"
                                    onChange={(event) => field.handleChange(event.target.checked)}
                                    type="checkbox"
                                />
                            </label>
                        )}
                    </form.Field>
                )}
                <SaveFooter form={form} message={message} />
            </form>
        </ForumPanel>
    );
}

function TypesWorkspace({ data, selectedId, setSelectedId, onReload }) {
    const selected = data.labelTypes.find((type) => type.id === selectedId) || null;
    const columns = useMemo(
        () =>
            columnHelper.columns([
                columnHelper.accessor('name', {
                    header: 'Darstellungstyp',
                    cell: (context) => <b className="text-sm text-zinc-200">{context.getValue()}</b>
                }),
                columnHelper.accessor('htmlTemplate', {
                    header: 'Vorlage',
                    cell: (context) => (
                        <code className="block max-w-md truncate text-[10px] text-zinc-500">{context.getValue()}</code>
                    )
                }),
                columnHelper.accessor((row) => data.labels.filter((label) => label.labelTypeId === row.id).length, {
                    id: 'usage',
                    header: 'Labels',
                    cell: (context) => <span className="text-xs font-bold text-zinc-400">{context.getValue()}</span>
                }),
                columnHelper.accessor('deleted', {
                    header: 'Status',
                    cell: (context) => <StatusPill value={context.getValue() ? 'Archiviert' : 'Aktiv'} />
                }),
                columnHelper.display({
                    id: 'actions',
                    header: '',
                    cell: (context) => (
                        <button
                            className="admin-forum-secondary py-2"
                            onClick={() => setSelectedId(context.row.original.id)}
                            type="button"
                        >
                            Bearbeiten
                        </button>
                    )
                })
            ]),
        [data.labels, setSelectedId]
    );
    return (
        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(390px,.8fr)]">
            <ForumPanel
                actions={
                    <button className="admin-forum-primary" onClick={() => setSelectedId('new')} type="button">
                        <FaPlus /> Typ anlegen
                    </button>
                }
                description="HTML-Vorlagen nutzen {x} als Platzhalter für den Labelnamen."
                eyebrow="DARSTELLUNG"
                title="Label-Typen"
            >
                <LiveDataTable
                    columns={columns}
                    emptyText="Lege die erste Badge-Darstellung an."
                    emptyTitle="Keine Darstellungstypen vorhanden"
                    getSearchValue={(row) => `${row.name} ${row.htmlTemplate}`}
                    rows={data.labelTypes}
                    searchPlaceholder="Darstellung durchsuchen …"
                />
            </ForumPanel>
            {selected || selectedId === 'new' ? (
                <TypeEditor initial={selected} key={selected?.id || 'new-type'} onReload={onReload} />
            ) : (
                <ForumPanel eyebrow="EDITOR" title="Typ auswählen">
                    <div className="p-6">
                        <AdminEmptyState
                            title="Kein Typ ausgewählt"
                            text="Öffne einen Darstellungstyp oder lege einen neuen an."
                        />
                    </div>
                </ForumPanel>
            )}
        </div>
    );
}

function TypeEditor({ initial, onReload }) {
    const [message, setMessage] = useState({ error: '', success: '' });
    const form = useForm({
        defaultValues: {
            name: initial?.name || '',
            htmlTemplate: initial?.htmlTemplate || '<span>{x}</span>',
            deleted: initial?.deleted || false
        },
        onSubmit: async ({ value }) => {
            setMessage({ error: '', success: '' });
            try {
                await forumApi.admin.saveLabelType(initial?.id || 'new', {
                    ...value,
                    name: value.name.trim(),
                    htmlTemplate: value.htmlTemplate.trim()
                });
                setMessage({ error: '', success: 'Darstellungstyp wurde gespeichert.' });
                await onReload();
            } catch (error) {
                setMessage({ error: error.message, success: '' });
            }
        }
    });
    return (
        <ForumPanel
            description="Die Vorlage wird serverseitig gespeichert; {x} wird durch den Labelnamen ersetzt."
            eyebrow="TYP-EDITOR"
            title={initial?.name || 'Neuer Darstellungstyp'}
        >
            <form
                className="p-5 sm:p-6"
                onSubmit={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <form.Field name="name">
                    {(field) => (
                        <label className="admin-forum-field">
                            <span>Name</span>
                            <input
                                className="admin-forum-input"
                                maxLength={64}
                                required
                                value={field.state.value}
                                onChange={(event) => field.handleChange(event.target.value)}
                            />
                        </label>
                    )}
                </form.Field>
                <form.Field name="htmlTemplate">
                    {(field) => (
                        <label className="admin-forum-field mt-5">
                            <span>HTML-Vorlage</span>
                            <textarea
                                className="admin-forum-input min-h-36 resize-y font-mono text-xs"
                                required
                                value={field.state.value}
                                onChange={(event) => field.handleChange(event.target.value)}
                            />
                        </label>
                    )}
                </form.Field>
                <form.Subscribe selector={(state) => state.values}>
                    {(values) => (
                        <div className="mt-5 rounded-2xl border border-white/[.06] bg-black/20 p-4">
                            <span className="text-[9px] font-extrabold uppercase tracking-[.14em] text-zinc-600">
                                Vorschau-Inhalt
                            </span>
                            <div className="mt-3">
                                <StatusPill value={(values.name || 'Beispiel').replace('{x}', 'Beispiel')} />
                            </div>
                        </div>
                    )}
                </form.Subscribe>
                {initial && (
                    <form.Field name="deleted">
                        {(field) => (
                            <label className="mt-5 flex cursor-pointer items-center justify-between rounded-2xl border border-red-400/15 bg-red-400/[.035] p-4 text-xs font-bold text-red-200">
                                <span>Darstellungstyp archivieren</span>
                                <input
                                    checked={field.state.value}
                                    className="accent-orange-500"
                                    onChange={(event) => field.handleChange(event.target.checked)}
                                    type="checkbox"
                                />
                            </label>
                        )}
                    </form.Field>
                )}
                <SaveFooter form={form} message={message} />
            </form>
        </ForumPanel>
    );
}

function SelectionGrid({ label, hint, items, selected = [], onChange }) {
    const toggle = (id) =>
        onChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);
    return (
        <fieldset className="mt-5">
            <legend className="text-[10px] font-extrabold uppercase tracking-[.12em] text-zinc-500">{label}</legend>
            <p className="mt-1 text-[10px] text-zinc-700">{hint}</p>
            <div className="mt-3 grid max-h-44 gap-2 overflow-y-auto rounded-2xl border border-white/[.06] bg-black/15 p-3 sm:grid-cols-2">
                {items.length ? (
                    items.map((item) => (
                        <label
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2 text-xs transition ${
                                item.warning
                                    ? item.tone === 'red'
                                        ? 'border-red-400/15 bg-red-400/[.045] text-red-200 hover:bg-red-400/[.08]'
                                        : 'border-amber-400/15 bg-amber-400/[.045] text-amber-200 hover:bg-amber-400/[.08]'
                                    : 'border-transparent text-zinc-400 hover:bg-white/[.03]'
                            }`}
                            key={item.id}
                        >
                            <input
                                checked={selected.includes(item.id)}
                                className="mt-0.5 accent-orange-500"
                                onChange={() => toggle(item.id)}
                                type="checkbox"
                            />
                            <span className="min-w-0">
                                <span className="block truncate font-bold">{item.label}</span>
                                {item.detail && (
                                    <span className="mt-1 block break-all text-[9px] leading-4 opacity-70">
                                        {item.detail}
                                        {item.warning ? ` · ID ${item.id}` : ''}
                                    </span>
                                )}
                            </span>
                        </label>
                    ))
                ) : (
                    <span className="p-3 text-xs text-zinc-700">Keine Optionen vorhanden.</span>
                )}
            </div>
        </fieldset>
    );
}

function SaveFooter({ form, message }) {
    return (
        <>
            <div className="mt-6 min-h-5">
                {(message.error || message.success) && (
                    <p className={`text-xs ${message.error ? 'text-red-300' : 'text-emerald-300'}`}>
                        {message.error || message.success}
                    </p>
                )}
            </div>
            <div className="mt-3 flex justify-end border-t border-white/[.055] pt-5">
                <form.Subscribe
                    selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
                >
                    {({ canSubmit, isSubmitting }) => (
                        <button className="admin-forum-primary" disabled={!canSubmit || isSubmitting} type="submit">
                            <FaFloppyDisk /> {isSubmitting ? 'Speichert …' : 'Speichern'}
                        </button>
                    )}
                </form.Subscribe>
            </div>
        </>
    );
}

function ModeButton({ active, label, onClick }) {
    return (
        <button
            className={`rounded-lg px-3 py-2 text-[10px] font-extrabold transition ${active ? 'bg-orange-500 text-white' : 'text-zinc-500 hover:text-white'}`}
            onClick={onClick}
            type="button"
        >
            {label}
        </button>
    );
}

function getGroupId(group) {
    return String(group?.key || group?.id || group?.name || '');
}

function getGroupName(group) {
    return group?.displayName || group?.name || group?.key || group?.id || 'Unbenannte Gruppe';
}

function normalizeIds(values) {
    return Array.isArray(values) ? [...new Set(values.filter((value) => value != null).map(String))] : [];
}

function buildReferenceOptions({
    catalog,
    selectedIds,
    getId,
    getLabel,
    isArchived,
    archivedDetail,
    missingLabel,
    missingDetail
}) {
    const selected = new Set(selectedIds);
    const knownIds = new Set();
    const options = [];

    for (const entry of catalog) {
        const id = String(getId(entry) || '');
        if (!id || knownIds.has(id)) continue;
        knownIds.add(id);
        const archived = isArchived(entry);
        if (archived && !selected.has(id)) continue;
        options.push({
            id,
            label: getLabel(entry) || id,
            detail: archived ? archivedDetail : '',
            warning: archived,
            tone: 'amber'
        });
    }

    for (const id of selectedIds) {
        if (knownIds.has(id)) continue;
        knownIds.add(id);
        options.push({
            id,
            label: missingLabel,
            detail: missingDetail,
            warning: true,
            tone: 'red'
        });
    }

    return options;
}

import { useCallback, useMemo, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import {
    FaArrowRight,
    FaCircleNodes,
    FaFloppyDisk,
    FaFolder,
    FaFolderPlus,
    FaNewspaper,
    FaPlus,
    FaUpRightFromSquare
} from 'react-icons/fa6';
import { forumApi } from '../../../lib/forumApi';
import { AdminEmptyState, AdminMetricCard } from '../AdminUi';
import {
    ForumAdminPage,
    ForumLoading,
    ForumPanel,
    StatusPill,
    formatNumber,
    useForumResource
} from './AdminForumShared';

const EMPTY_NODE = {
    type: 'FORUM',
    parentId: '',
    order: 0,
    title: '',
    description: '',
    icon: '',
    displayAsNews: false,
    redirect: false,
    redirectUrl: '',
    hookIds: [],
    deleted: false
};

export default function ForumStructureView() {
    const loader = useCallback(() => forumApi.admin.nodes(), []);
    const resource = useForumResource(loader, [loader]);
    const [selectedId, setSelectedId] = useState('');
    const [creating, setCreating] = useState(false);
    const nodes = resource.data?.nodes || [];
    const selected = nodes.find((node) => node.id === selectedId) || null;
    const categories = nodes.filter((node) => node.type === 'CATEGORY' && !node.deleted);
    const forums = nodes.filter((node) => node.type === 'FORUM' && !node.deleted);
    const news = forums.filter((node) => node.displayAsNews);

    const beginCreate = (parentId = '', type = 'FORUM') => {
        setSelectedId('');
        setCreating({ parentId, type });
    };

    const selectNode = (node) => {
        setCreating(false);
        setSelectedId(node.id);
    };

    return (
        <ForumAdminPage
            actions={
                <button className="admin-forum-primary" onClick={() => beginCreate()} type="button">
                    <FaPlus /> Element anlegen
                </button>
            }
            description="Kategorien, Foren, Newsbereiche und Weiterleitungen hierarchisch verwalten. Neue Foren bleiben bis zur Freigabe unter Gruppenrechte privat."
            error={resource.error}
            eyebrow="INFORMATIONSARCHITEKTUR"
            icon={FaCircleNodes}
            loading={resource.loading}
            onRetry={resource.reload}
            title="Forum-Struktur"
        >
            {resource.loading || !resource.data ? (
                <ForumLoading title="Forum-Struktur wird geladen" />
            ) : (
                <>
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <AdminMetricCard
                            detail="oberste Gliederungsebenen"
                            icon={FaFolder}
                            label="Kategorien"
                            tone="orange"
                            value={formatNumber(categories.length)}
                        />
                        <AdminMetricCard
                            detail="aktive Inhaltsbereiche"
                            icon={FaCircleNodes}
                            label="Foren"
                            tone="sky"
                            value={formatNumber(forums.length)}
                        />
                        <AdminMetricCard
                            detail="als Newsstream markiert"
                            icon={FaNewspaper}
                            label="Newsbereiche"
                            tone="violet"
                            value={formatNumber(news.length)}
                        />
                        <AdminMetricCard
                            detail="Themen über alle Foren"
                            icon={FaFolderPlus}
                            label="Themenbestand"
                            tone="emerald"
                            value={formatNumber(forums.reduce((sum, node) => sum + (Number(node.topics) || 0), 0))}
                        />
                    </section>

                    <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(360px,.72fr)_minmax(0,1.28fr)]">
                        <StructureTree
                            nodes={nodes}
                            onCreate={beginCreate}
                            onSelect={selectNode}
                            selectedId={selectedId}
                        />
                        {selected || creating ? (
                            <NodeEditor
                                initial={selected || { ...EMPTY_NODE, ...creating }}
                                key={selected?.id || `new-${creating?.parentId}-${creating?.type}`}
                                nodes={nodes}
                                onSaved={async (saved) => {
                                    await resource.reload();
                                    setCreating(false);
                                    if (saved?.id) setSelectedId(saved.id);
                                }}
                            />
                        ) : (
                            <ForumPanel
                                eyebrow="EDITOR"
                                title="Element auswählen"
                                description="Wähle links ein Element aus oder lege ein neues an."
                            >
                                <div className="p-6">
                                    <AdminEmptyState
                                        title="Kein Element ausgewählt"
                                        text="Der Editor zeigt anschließend alle Eigenschaften und Veröffentlichungsoptionen."
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

function StructureTree({ nodes, selectedId, onSelect, onCreate }) {
    const roots = useMemo(() => nodes.filter((node) => !node.parentId).sort(compareNodes), [nodes]);
    const children = useMemo(() => {
        const map = new Map();
        nodes.forEach((node) => {
            if (!node.parentId) return;
            const siblings = map.get(node.parentId) || [];
            siblings.push(node);
            siblings.sort(compareNodes);
            map.set(node.parentId, siblings);
        });
        return map;
    }, [nodes]);

    return (
        <ForumPanel
            actions={
                <button
                    className="admin-forum-icon"
                    onClick={() => onCreate('', 'CATEGORY')}
                    title="Kategorie anlegen"
                    type="button"
                >
                    <FaFolderPlus />
                </button>
            }
            description="Die Reihenfolge entspricht der Darstellung im Forum."
            eyebrow="NAVIGATIONSBAUM"
            title="Bereiche"
        >
            {roots.length ? (
                <div className="space-y-3 p-4 sm:p-5">
                    {roots.map((node) => (
                        <TreeNode
                            childrenMap={children}
                            key={node.id}
                            node={node}
                            onCreate={onCreate}
                            onSelect={onSelect}
                            selectedId={selectedId}
                        />
                    ))}
                </div>
            ) : (
                <div className="p-5">
                    <AdminEmptyState
                        title="Noch keine Struktur"
                        text="Lege zuerst eine Kategorie oder ein eigenständiges Forum an."
                    />
                </div>
            )}
        </ForumPanel>
    );
}

function TreeNode({ node, childrenMap, selectedId, onSelect, onCreate, depth = 0 }) {
    const children = childrenMap.get(node.id) || [];
    const Icon = node.redirect ? FaUpRightFromSquare : node.type === 'CATEGORY' ? FaFolder : FaCircleNodes;
    return (
        <div>
            <div
                className={`group flex items-center gap-3 rounded-2xl border px-3 py-3 transition ${selectedId === node.id ? 'border-orange-400/25 bg-orange-400/[.08]' : 'border-white/[.055] bg-black/15 hover:border-white/[.1]'}`}
                style={{ marginLeft: Math.min(depth, 3) * 14 }}
            >
                <button
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    onClick={() => onSelect(node)}
                    type="button"
                >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[.04] text-xs text-orange-300">
                        <Icon />
                    </span>
                    <span className="min-w-0">
                        <b className="block truncate text-xs text-zinc-200">{node.title}</b>
                        <span className="text-zinc-650 mt-1 block text-[9px] font-bold uppercase tracking-wider">
                            {node.type === 'CATEGORY' ? 'Kategorie' : node.redirect ? 'Weiterleitung' : 'Forum'} ·
                            Position {node.order}
                        </span>
                    </span>
                </button>
                {node.type === 'CATEGORY' && (
                    <button
                        className="admin-forum-icon opacity-70 group-hover:opacity-100"
                        onClick={() => onCreate(node.id, 'FORUM')}
                        title="Unterforum anlegen"
                        type="button"
                    >
                        <FaPlus />
                    </button>
                )}
            </div>
            {children.map((child) => (
                <div className="mt-2" key={child.id}>
                    <TreeNode
                        childrenMap={childrenMap}
                        depth={depth + 1}
                        node={child}
                        onCreate={onCreate}
                        onSelect={onSelect}
                        selectedId={selectedId}
                    />
                </div>
            ))}
        </div>
    );
}

function NodeEditor({ initial, nodes, onSaved }) {
    const [result, setResult] = useState({ saving: false, error: '', success: '' });
    const isExisting = Boolean(initial.id);
    const form = useForm({
        defaultValues: {
            ...EMPTY_NODE,
            ...initial,
            parentId: initial.parentId || '',
            hookIdsText: (initial.hookIds || []).join(', ')
        },
        onSubmit: async ({ value }) => {
            setResult({ saving: true, error: '', success: '' });
            const body = {
                type: value.type,
                parentId: value.parentId || null,
                order: Number(value.order) || 0,
                title: value.title.trim(),
                description: value.description.trim() || null,
                icon: value.icon.trim() || null,
                displayAsNews: Boolean(value.displayAsNews),
                redirect: Boolean(value.redirect),
                redirectUrl: value.redirect ? value.redirectUrl.trim() || null : null,
                hookIds: value.hookIdsText
                    .split(',')
                    .map((entry) => entry.trim())
                    .filter(Boolean),
                deleted: Boolean(value.deleted)
            };
            try {
                const saved = isExisting
                    ? await forumApi.admin.updateNode(initial.id, body)
                    : await forumApi.admin.createNode(body);
                setResult({
                    saving: false,
                    error: '',
                    success: 'Struktur wurde gespeichert. Die Sichtbarkeit steuerst du separat unter Gruppenrechte.'
                });
                await onSaved(saved);
            } catch (error) {
                setResult({ saving: false, error: error.message, success: '' });
            }
        }
    });

    const parentOptions = nodes.filter((node) => node.type === 'CATEGORY' && !node.deleted && node.id !== initial.id);

    return (
        <ForumPanel
            description="Alle Änderungen werden unmittelbar über die Forum-Admin-API gespeichert."
            eyebrow="EDITOR"
            title={isExisting ? initial.title : 'Neues Strukturelement'}
        >
            <form
                className="p-5 sm:p-6"
                onSubmit={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <div className="grid gap-5 md:grid-cols-2">
                    <SelectField
                        form={form}
                        label="Typ"
                        name="type"
                        options={[
                            ['CATEGORY', 'Kategorie'],
                            ['FORUM', 'Forum']
                        ]}
                    />
                    <SelectField
                        form={form}
                        label="Übergeordnete Kategorie"
                        name="parentId"
                        options={[['', 'Keine / oberste Ebene'], ...parentOptions.map((node) => [node.id, node.title])]}
                    />
                    <TextField form={form} label="Titel" name="title" required />
                    <TextField form={form} label="Position" name="order" type="number" />
                    <div className="md:col-span-2">
                        <TextField form={form} label="Beschreibung" name="description" />
                    </div>
                    <TextField form={form} label="Icon / Schlüssel" name="icon" />
                    <TextField form={form} label="Hook-IDs (kommagetrennt)" name="hookIdsText" />
                    <form.Field name="displayAsNews">
                        {(field) => (
                            <ToggleField
                                checked={field.state.value}
                                label="Als Newsbereich darstellen"
                                onChange={field.handleChange}
                            />
                        )}
                    </form.Field>
                    <form.Field name="redirect">
                        {(field) => (
                            <ToggleField
                                checked={field.state.value}
                                label="Als Weiterleitung verwenden"
                                onChange={field.handleChange}
                            />
                        )}
                    </form.Field>
                    <form.Subscribe selector={(state) => state.values.redirect}>
                        {(redirect) =>
                            redirect ? (
                                <div className="md:col-span-2">
                                    <TextField form={form} label="Ziel-URL" name="redirectUrl" type="url" required />
                                </div>
                            ) : null
                        }
                    </form.Subscribe>
                    {isExisting && Object.hasOwn(initial, 'deleted') && (
                        <form.Field name="deleted">
                            {(field) => (
                                <ToggleField
                                    danger
                                    checked={field.state.value}
                                    label="Element archivieren"
                                    onChange={field.handleChange}
                                />
                            )}
                        </form.Field>
                    )}
                </div>
                {(result.error || result.success) && (
                    <p
                        className={`mt-5 rounded-xl border px-4 py-3 text-xs ${result.error ? 'border-red-400/15 bg-red-400/[.05] text-red-300' : 'border-emerald-400/15 bg-emerald-400/[.05] text-emerald-300'}`}
                    >
                        {result.error || result.success}
                    </p>
                )}
                <div className="mt-7 flex items-center justify-between gap-4 border-t border-white/[.055] pt-5">
                    <StatusPill value={isExisting ? 'Bestehendes Element' : 'Neuer Eintrag'} />
                    <form.Subscribe
                        selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
                    >
                        {({ canSubmit, isSubmitting }) => (
                            <button
                                className="admin-forum-primary"
                                disabled={!canSubmit || isSubmitting || result.saving}
                                type="submit"
                            >
                                <FaFloppyDisk /> {isSubmitting || result.saving ? 'Speichert …' : 'Speichern'}{' '}
                                <FaArrowRight />
                            </button>
                        )}
                    </form.Subscribe>
                </div>
            </form>
        </ForumPanel>
    );
}

function TextField({ form, name, label, type = 'text', required = false }) {
    return (
        <form.Field name={name}>
            {(field) => (
                <label className="admin-forum-field">
                    <span>{label}</span>
                    <input
                        className="admin-forum-input"
                        required={required}
                        type={type}
                        value={field.state.value ?? ''}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                            field.handleChange(type === 'number' ? Number(event.target.value) : event.target.value)
                        }
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
                        value={field.state.value ?? ''}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                    >
                        {options.map(([value, text]) => (
                            <option key={value} value={value}>
                                {text}
                            </option>
                        ))}
                    </select>
                </label>
            )}
        </form.Field>
    );
}

function ToggleField({ checked, onChange, label, danger = false }) {
    return (
        <label
            className={`flex min-h-[72px] cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 text-xs font-bold ${danger ? 'border-red-400/15 bg-red-400/[.035] text-red-200' : 'border-white/[.065] bg-black/15 text-zinc-300'}`}
        >
            <span>{label}</span>
            <input
                checked={Boolean(checked)}
                className="h-4 w-4 accent-orange-500"
                onChange={(event) => onChange(event.target.checked)}
                type="checkbox"
            />
        </label>
    );
}

function compareNodes(left, right) {
    return (
        (Number(left.order) || 0) - (Number(right.order) || 0) ||
        String(left.title).localeCompare(String(right.title), 'de')
    );
}

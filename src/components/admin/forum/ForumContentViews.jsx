import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import {
    FaBan,
    FaFileLines,
    FaFloppyDisk,
    FaGear,
    FaNewspaper,
    FaPlus,
    FaRocket,
    FaTags,
    FaBoxArchive
} from 'react-icons/fa6';
import { blogApi } from '../../../lib/communityApi';
import { forumApi } from '../../../lib/forumApi';
import { AdminEmptyState, AdminMetricCard } from '../AdminUi';
import {
    ForumAdminPage,
    ForumAdminError,
    ForumLoading,
    ForumPanel,
    LiveDataTable,
    StatusPill,
    columnHelper,
    formatDate,
    formatNumber,
    useForumResource
} from './AdminForumShared';

const EMPTY_POST = {
    slug: '',
    title: '',
    excerpt: '',
    content: '',
    thumbnailUrl: '',
    categoriesText: '',
    tagsText: '',
    status: 'DRAFT'
};

export function ForumBlogView() {
    const [page, setPage] = useState(0);
    const loader = useCallback(() => blogApi.admin.list({ page, size: 25 }), [page]);
    const resource = useForumResource(loader, [loader]);
    const [selectedId, setSelectedId] = useState('');
    const [selectedPost, setSelectedPost] = useState(null);
    const [editorState, setEditorState] = useState({ loading: false, error: '' });
    const editorRequestId = useRef(0);
    const [actionError, setActionError] = useState('');
    const posts = resource.data?.items || [];

    const loadSelected = useCallback(async () => {
        if (!selectedId || selectedId === 'new') {
            editorRequestId.current += 1;
            setSelectedPost(null);
            setEditorState({ loading: false, error: '' });
            return null;
        }
        const requestId = ++editorRequestId.current;
        setEditorState({ loading: true, error: '' });
        try {
            const post = await blogApi.admin.byId(selectedId);
            if (requestId !== editorRequestId.current) return null;
            setSelectedPost(post);
            setEditorState({ loading: false, error: '' });
            return post;
        } catch (error) {
            if (requestId !== editorRequestId.current) return null;
            setSelectedPost(null);
            setEditorState({ loading: false, error: error.message || 'Der Beitrag konnte nicht geladen werden.' });
            return null;
        }
    }, [selectedId]);

    useEffect(() => {
        loadSelected();
        return () => {
            editorRequestId.current += 1;
        };
    }, [loadSelected]);

    const archive = useCallback(
        async (post) => {
            if (!window.confirm(`Blogbeitrag „${post.title}“ archivieren?`)) return;
            setActionError('');
            try {
                await blogApi.patch(post.id, { status: 'ARCHIVED' });
                if (selectedId === post.id) setSelectedId('');
                await resource.reload();
            } catch (error) {
                setActionError(error.message);
            }
        },
        [resource, selectedId]
    );

    const handleSaved = useCallback(
        async (saved) => {
            await resource.reload();
            if (saved?.id) {
                setSelectedPost(saved);
                setSelectedId(saved.id);
                setEditorState({ loading: false, error: '' });
            }
        },
        [resource]
    );

    const columns = useMemo(
        () =>
            columnHelper.columns([
                columnHelper.accessor('title', {
                    header: 'Beitrag',
                    cell: (context) => (
                        <div>
                            <b className="block max-w-80 truncate text-sm text-zinc-200">{context.getValue()}</b>
                            <span className="mt-1 block font-mono text-[9px] text-zinc-700">
                                /{context.row.original.slug}
                            </span>
                        </div>
                    )
                }),
                columnHelper.accessor('status', {
                    header: 'Status',
                    cell: (context) => <StatusPill value={translateBlogStatus(context.getValue())} />
                }),
                columnHelper.accessor((row) => row.categories?.length || 0, {
                    id: 'categories',
                    header: 'Kategorien',
                    cell: (context) => <span className="text-xs font-bold text-zinc-400">{context.getValue()}</span>
                }),
                columnHelper.accessor('updatedAt', {
                    header: 'Aktualisiert',
                    cell: (context) => (
                        <time className="whitespace-nowrap text-xs text-zinc-500">
                            {formatDate(context.getValue())}
                        </time>
                    )
                }),
                columnHelper.display({
                    id: 'actions',
                    header: '',
                    cell: (context) => (
                        <div className="flex gap-2">
                            <button
                                className="admin-forum-secondary py-2"
                                onClick={() => setSelectedId(context.row.original.id)}
                                type="button"
                            >
                                Bearbeiten
                            </button>
                            {context.row.original.status !== 'ARCHIVED' && (
                                <button
                                    className="admin-forum-icon text-red-300"
                                    onClick={() => archive(context.row.original)}
                                    title="Archivieren"
                                    type="button"
                                >
                                    <FaBoxArchive />
                                </button>
                            )}
                        </div>
                    )
                })
            ]),
        [archive]
    );

    const counts = Object.fromEntries(
        ['DRAFT', 'PUBLISHED', 'UNLISTED', 'ARCHIVED'].map((status) => [
            status,
            posts.filter((post) => post.status === status).length
        ])
    );
    const total = Number(resource.data?.total);
    const totalPages = Number.isFinite(total) ? Math.max(1, Math.ceil(total / 25)) : 1;

    return (
        <ForumAdminPage
            actions={
                <button className="admin-forum-primary" onClick={() => setSelectedId('new')} type="button">
                    <FaPlus /> Beitrag erstellen
                </button>
            }
            description="Newsbeiträge entwerfen, klassifizieren und kontrolliert veröffentlichen. Alle Zustände stammen aus dem Blog-Modul des Forum-Service."
            error={resource.error}
            eyebrow="REDAKTION"
            icon={FaNewspaper}
            loading={resource.loading}
            onRetry={resource.reload}
            title="Blog"
        >
            {resource.loading || !resource.data ? (
                <ForumLoading title="Blogbeiträge werden geladen" />
            ) : (
                <>
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <AdminMetricCard
                            detail="auf dieser Seite"
                            icon={FaFileLines}
                            label="Entwürfe"
                            tone="orange"
                            value={formatNumber(counts.DRAFT)}
                        />
                        <AdminMetricCard
                            detail="auf dieser Seite"
                            icon={FaRocket}
                            label="Veröffentlicht"
                            tone="emerald"
                            value={formatNumber(counts.PUBLISHED)}
                        />
                        <AdminMetricCard
                            detail="auf dieser Seite"
                            icon={FaTags}
                            label="Nicht gelistet"
                            tone="sky"
                            value={formatNumber(counts.UNLISTED)}
                        />
                        <AdminMetricCard
                            detail="auf dieser Seite"
                            icon={FaBoxArchive}
                            label="Archiviert"
                            tone="red"
                            value={formatNumber(counts.ARCHIVED)}
                        />
                    </section>
                    {actionError && (
                        <p className="mt-5 rounded-xl border border-red-400/15 bg-red-400/[.05] px-4 py-3 text-xs text-red-300">
                            {actionError}
                        </p>
                    )}
                    <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(440px,.9fr)]">
                        <ForumPanel
                            description={`${formatNumber(resource.data.total)} Beiträge im Backend`}
                            eyebrow="BEITRÄGE"
                            title="Redaktionsübersicht"
                        >
                            <LiveDataTable
                                columns={columns}
                                emptyText="Erstelle den ersten Beitrag als Entwurf."
                                emptyTitle="Noch keine Blogbeiträge"
                                getSearchValue={(row) =>
                                    `${row.title} ${row.slug} ${row.status} ${(row.categories || []).join(' ')} ${(row.tags || []).join(' ')}`
                                }
                                rows={posts}
                                searchPlaceholder="Geladene Beiträge durchsuchen …"
                            />
                            <div className="flex items-center justify-between border-t border-white/[.055] px-5 py-4 text-xs text-zinc-500">
                                <span>
                                    Seite {page + 1} von {totalPages}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        className="admin-forum-secondary py-2"
                                        disabled={page === 0}
                                        onClick={() => setPage((current) => Math.max(0, current - 1))}
                                        type="button"
                                    >
                                        Zurück
                                    </button>
                                    <button
                                        className="admin-forum-secondary py-2"
                                        disabled={page + 1 >= totalPages}
                                        onClick={() => setPage((current) => current + 1)}
                                        type="button"
                                    >
                                        Weiter
                                    </button>
                                </div>
                            </div>
                        </ForumPanel>
                        {selectedId === 'new' ? (
                            <BlogEditor initial={null} key="new-post" onSaved={handleSaved} />
                        ) : editorState.loading ? (
                            <ForumPanel eyebrow="EDITOR" title="Beitrag wird geladen">
                                <div className="p-6">
                                    <ForumLoading title="Beitragsinhalt wird geladen" />
                                </div>
                            </ForumPanel>
                        ) : editorState.error ? (
                            <ForumPanel eyebrow="EDITOR" title="Beitrag nicht verfügbar">
                                <div className="p-6">
                                    <ForumAdminError message={editorState.error} retry={loadSelected} />
                                </div>
                            </ForumPanel>
                        ) : selectedPost ? (
                            <BlogEditor
                                initial={selectedPost}
                                key={`${selectedPost.id}-${selectedPost.updatedAt || ''}`}
                                onSaved={handleSaved}
                            />
                        ) : (
                            <ForumPanel eyebrow="EDITOR" title="Beitrag auswählen">
                                <div className="p-6">
                                    <AdminEmptyState
                                        title="Kein Beitrag ausgewählt"
                                        text="Öffne einen Beitrag aus der Tabelle oder beginne einen neuen Entwurf."
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

function BlogEditor({ initial, onSaved }) {
    const [message, setMessage] = useState({ error: '', success: '' });
    const form = useForm({
        defaultValues: initial
            ? {
                  slug: initial.slug || '',
                  title: initial.title || '',
                  excerpt: initial.excerpt || '',
                  content: initial.content || '',
                  thumbnailUrl: initial.thumbnailUrl || '',
                  categoriesText: (initial.categories || []).join(', '),
                  tagsText: (initial.tags || []).join(', '),
                  status: initial.status || 'DRAFT'
              }
            : EMPTY_POST,
        onSubmit: async ({ value }) => {
            setMessage({ error: '', success: '' });
            const body = {
                slug: value.slug.trim().toLocaleLowerCase('de-DE'),
                title: value.title.trim(),
                excerpt: value.excerpt.trim() || null,
                content: value.content,
                thumbnailUrl: value.thumbnailUrl.trim() || null,
                categories: splitList(value.categoriesText),
                tags: splitList(value.tagsText),
                status: value.status
            };
            try {
                let saved;
                if (initial) {
                    saved = await blogApi.update(initial.id, body);
                } else {
                    saved = await blogApi.create(body);
                }
                setMessage({ error: '', success: 'Blogbeitrag wurde gespeichert.' });
                await onSaved(saved);
            } catch (error) {
                setMessage({ error: error.message, success: '' });
            }
        }
    });

    return (
        <ForumPanel
            description={
                initial
                    ? `Zuletzt aktualisiert ${formatDate(initial.updatedAt)}`
                    : 'Der gewählte Status wird gemeinsam mit dem neuen Beitrag gespeichert; für redaktionelle Arbeit empfiehlt sich ein Entwurf.'
            }
            eyebrow="BEITRAGS-EDITOR"
            title={initial?.title || 'Neuer Blogbeitrag'}
        >
            <form
                className="p-5 sm:p-6"
                onSubmit={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField form={form} label="Titel" name="title" required />
                    <TextField form={form} label="Slug" name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required />
                </div>
                <form.Field name="excerpt">
                    {(field) => (
                        <label className="admin-forum-field mt-4">
                            <span>Kurzbeschreibung</span>
                            <textarea
                                className="admin-forum-input min-h-24 resize-y"
                                maxLength={600}
                                value={field.state.value}
                                onChange={(event) => field.handleChange(event.target.value)}
                            />
                        </label>
                    )}
                </form.Field>
                <form.Field name="content">
                    {(field) => (
                        <label className="admin-forum-field mt-4">
                            <span>Inhalt</span>
                            <textarea
                                className="admin-forum-input min-h-60 resize-y font-mono text-xs"
                                maxLength={200000}
                                required
                                value={field.state.value}
                                onChange={(event) => field.handleChange(event.target.value)}
                            />
                        </label>
                    )}
                </form.Field>
                <TextField form={form} label="Titelbild (HTTPS)" name="thumbnailUrl" type="url" />
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <TextField form={form} label="Kategorien (kommagetrennt)" name="categoriesText" />
                    <TextField form={form} label="Tags (kommagetrennt)" name="tagsText" />
                </div>
                <form.Field name="status">
                    {(field) => (
                        <label className="admin-forum-field mt-4">
                            <span>Status</span>
                            <select
                                className="admin-forum-input"
                                value={field.state.value}
                                onChange={(event) => field.handleChange(event.target.value)}
                            >
                                <option value="DRAFT">Entwurf</option>
                                <option value="PUBLISHED">Veröffentlicht</option>
                                <option value="UNLISTED">Nicht gelistet</option>
                                <option value="ARCHIVED">Archiviert</option>
                            </select>
                        </label>
                    )}
                </form.Field>
                {(message.error || message.success) && (
                    <p
                        className={`mt-5 rounded-xl border px-4 py-3 text-xs ${message.error ? 'border-red-400/15 bg-red-400/[.05] text-red-300' : 'border-emerald-400/15 bg-emerald-400/[.05] text-emerald-300'}`}
                    >
                        {message.error || message.success}
                    </p>
                )}
                <div className="mt-6 flex justify-end border-t border-white/[.055] pt-5">
                    <form.Subscribe
                        selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
                    >
                        {({ canSubmit, isSubmitting }) => (
                            <button className="admin-forum-primary" disabled={!canSubmit || isSubmitting} type="submit">
                                <FaFloppyDisk /> {isSubmitting ? 'Speichert …' : 'Beitrag speichern'}
                            </button>
                        )}
                    </form.Subscribe>
                </div>
            </form>
        </ForumPanel>
    );
}

export function ForumSettingsView() {
    const loader = useCallback(() => forumApi.admin.settings(), []);
    const resource = useForumResource(loader, [loader]);
    return (
        <ForumAdminPage
            description="Globale Inhaltsgrenzen, Reaktionen und serverseitig gesperrte Begriffe zentral konfigurieren."
            error={resource.error}
            eyebrow="KONFIGURATION"
            icon={FaGear}
            loading={resource.loading}
            onRetry={resource.reload}
            title="Forum-Einstellungen"
        >
            {resource.loading || !resource.data ? (
                <ForumLoading title="Forum-Einstellungen werden geladen" />
            ) : (
                <SettingsWorkspace initial={resource.data} onReload={resource.reload} />
            )}
        </ForumAdminPage>
    );
}

function SettingsWorkspace({ initial, onReload }) {
    const [message, setMessage] = useState({ error: '', success: '' });
    const form = useForm({
        defaultValues: {
            reactionsEnabled: Boolean(initial.reactionsEnabled),
            maxTopicTitleLength: initial.maxTopicTitleLength,
            maxPostLength: initial.maxPostLength,
            bannedTermsText: (initial.bannedTerms || []).join('\n')
        },
        onSubmit: async ({ value }) => {
            setMessage({ error: '', success: '' });
            try {
                await forumApi.admin.saveSettings({
                    reactionsEnabled: value.reactionsEnabled,
                    maxTopicTitleLength: Number(value.maxTopicTitleLength),
                    maxPostLength: Number(value.maxPostLength),
                    bannedTerms: value.bannedTermsText
                        .split('\n')
                        .map((term) => term.trim())
                        .filter(Boolean)
                });
                setMessage({ error: '', success: 'Forum-Einstellungen wurden gespeichert.' });
                await onReload();
            } catch (error) {
                setMessage({ error: error.message, success: '' });
            }
        }
    });
    return (
        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,.7fr)]">
            <ForumPanel
                description="Validierung erfolgt zusätzlich serverseitig. Grenzwerte gelten für alle neuen oder bearbeiteten Inhalte."
                eyebrow="GLOBALE REGELN"
                title="Inhalts- und Interaktionsregeln"
            >
                <form
                    className="p-5 sm:p-6"
                    onSubmit={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <form.Field name="reactionsEnabled">
                        {(field) => (
                            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/[.065] bg-black/15 p-4">
                                <div>
                                    <b className="text-sm text-zinc-200">Reaktionen aktivieren</b>
                                    <p className="mt-1 text-xs text-zinc-600">
                                        Erlaubt Nutzern, auf Beiträge zu reagieren.
                                    </p>
                                </div>
                                <input
                                    checked={field.state.value}
                                    className="h-5 w-5 accent-orange-500"
                                    onChange={(event) => field.handleChange(event.target.checked)}
                                    type="checkbox"
                                />
                            </label>
                        )}
                    </form.Field>
                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                        <NumberField
                            form={form}
                            label="Maximale Titellänge"
                            max={300}
                            min={10}
                            name="maxTopicTitleLength"
                        />
                        <NumberField
                            form={form}
                            label="Maximale Beitragslänge"
                            max={500000}
                            min={1000}
                            name="maxPostLength"
                        />
                    </div>
                    <form.Field name="bannedTermsText">
                        {(field) => (
                            <label className="admin-forum-field mt-5">
                                <span>Gesperrte Begriffe · ein Eintrag pro Zeile</span>
                                <textarea
                                    className="admin-forum-input min-h-56 resize-y"
                                    value={field.state.value}
                                    onChange={(event) => field.handleChange(event.target.value)}
                                />
                            </label>
                        )}
                    </form.Field>
                    {(message.error || message.success) && (
                        <p
                            className={`mt-5 rounded-xl border px-4 py-3 text-xs ${message.error ? 'border-red-400/15 bg-red-400/[.05] text-red-300' : 'border-emerald-400/15 bg-emerald-400/[.05] text-emerald-300'}`}
                        >
                            {message.error || message.success}
                        </p>
                    )}
                    <div className="mt-6 flex justify-end border-t border-white/[.055] pt-5">
                        <form.Subscribe
                            selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
                        >
                            {({ canSubmit, isSubmitting }) => (
                                <button
                                    className="admin-forum-primary"
                                    disabled={!canSubmit || isSubmitting}
                                    type="submit"
                                >
                                    <FaFloppyDisk /> {isSubmitting ? 'Speichert …' : 'Einstellungen speichern'}
                                </button>
                            )}
                        </form.Subscribe>
                    </div>
                </form>
            </ForumPanel>
            <aside className="space-y-6">
                <ForumPanel
                    description="Tatsächlich vom Backend geladene Konfiguration."
                    eyebrow="AKTUELLER STAND"
                    title="Regelprofil"
                >
                    <div className="space-y-3 p-5 sm:p-6">
                        <SettingRow label="Reaktionen" value={initial.reactionsEnabled ? 'Aktiv' : 'Deaktiviert'} />
                        <SettingRow label="Titellimit" value={`${formatNumber(initial.maxTopicTitleLength)} Zeichen`} />
                        <SettingRow label="Beitragslimit" value={`${formatNumber(initial.maxPostLength)} Zeichen`} />
                        <SettingRow label="Gesperrte Begriffe" value={formatNumber(initial.bannedTerms?.length || 0)} />
                    </div>
                </ForumPanel>
                <div className="rounded-[24px] border border-amber-400/15 bg-amber-400/[.045] p-5">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/10 text-amber-300">
                        <FaBan />
                    </span>
                    <b className="mt-4 block text-sm text-amber-100">Auswirkung sofort aktiv</b>
                    <p className="mt-2 text-xs leading-5 text-amber-100/55">
                        Neue Grenzwerte und gesperrte Begriffe gelten unmittelbar nach dem Speichern. Bestehende Inhalte
                        werden dadurch nicht automatisch verändert.
                    </p>
                </div>
            </aside>
        </div>
    );
}

function TextField({ form, name, label, type = 'text', required = false, pattern }) {
    return (
        <form.Field name={name}>
            {(field) => (
                <label className="admin-forum-field mt-4">
                    <span>{label}</span>
                    <input
                        className="admin-forum-input"
                        pattern={pattern}
                        required={required}
                        type={type}
                        value={field.state.value || ''}
                        onChange={(event) => field.handleChange(event.target.value)}
                    />
                </label>
            )}
        </form.Field>
    );
}

function NumberField({ form, name, label, min, max }) {
    return (
        <form.Field name={name}>
            {(field) => (
                <label className="admin-forum-field">
                    <span>{label}</span>
                    <input
                        className="admin-forum-input"
                        max={max}
                        min={min}
                        required
                        type="number"
                        value={field.state.value}
                        onChange={(event) => field.handleChange(Number(event.target.value))}
                    />
                </label>
            )}
        </form.Field>
    );
}

function SettingRow({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[.055] bg-black/15 px-4 py-3">
            <span className="text-xs text-zinc-500">{label}</span>
            <b className="text-xs text-zinc-200">{value}</b>
        </div>
    );
}

function splitList(value) {
    return String(value || '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
}

function translateBlogStatus(status) {
    return (
        { DRAFT: 'Entwurf', PUBLISHED: 'Veröffentlicht', UNLISTED: 'Nicht gelistet', ARCHIVED: 'Archiviert' }[status] ||
        status
    );
}

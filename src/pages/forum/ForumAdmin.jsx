import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    FaArrowLeft,
    FaCheck,
    FaFloppyDisk,
    FaFolderPlus,
    FaGear,
    FaLightbulb,
    FaNewspaper,
    FaShieldHalved,
    FaTags,
    FaTriangleExclamation
} from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import { fetchAuthenticatedUser, getAuthenticatedUser, isForumAdministrator } from '../../lib/auth';
import { forumApi, getPermissionGroups } from '../../lib/forumApi';
import { ForumError, ForumLoading, ForumShell, Pagination, UserIdentity, formatDate } from './ForumComponents';
import { BlogAdmin, SuggestionAdmin } from './ForumContentAdmin';

const permissionFields = [
    ['view', 'Forum sehen'],
    ['viewOtherTopics', 'Alle Themen sehen'],
    ['createTopic', 'Themen erstellen'],
    ['createPost', 'Antworten'],
    ['editTopic', 'Themen bearbeiten'],
    ['editPost', 'Beiträge bearbeiten'],
    ['deleteTopic', 'Themen löschen'],
    ['deletePost', 'Beiträge löschen'],
    ['lock', 'Sperren'],
    ['stick', 'Anpinnen'],
    ['move', 'Verschieben'],
    ['merge', 'Zusammenführen'],
    ['react', 'Reagieren'],
    ['report', 'Melden']
];

const emptyNode = {
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
const emptyPermission = (groupId) =>
    Object.fromEntries([['groupId', groupId], ...permissionFields.map(([key]) => [key, false])]);

export default function ForumAdmin() {
    const [user, setUser] = useState(() => getAuthenticatedUser());
    const [checking, setChecking] = useState(true);
    const [tab, setTab] = useState('structure');
    const [state, setState] = useState({
        loading: true,
        nodes: [],
        groups: [],
        settings: null,
        labels: [],
        labelTypes: [],
        error: ''
    });

    const load = useCallback(async () => {
        setState((current) => ({ ...current, loading: true, error: '' }));
        try {
            const [nodes, groups, settings, labels, labelTypes] = await Promise.all([
                forumApi.admin.nodes(),
                getPermissionGroups(),
                forumApi.admin.settings(),
                forumApi.admin.labels(),
                forumApi.admin.labelTypes()
            ]);
            setState({
                loading: false,
                nodes: nodes.nodes ?? [],
                groups,
                settings,
                labels,
                labelTypes,
                error: ''
            });
        } catch (error) {
            setState({
                loading: false,
                nodes: [],
                groups: [],
                settings: null,
                labels: [],
                labelTypes: [],
                error: error.message
            });
        }
    }, []);

    useEffect(() => {
        fetchAuthenticatedUser().then((profile) => {
            setUser(profile);
            setChecking(false);
        });
    }, []);
    useEffect(() => {
        if (!checking && isForumAdministrator(user)) load();
    }, [checking, load, user]);

    if (checking)
        return (
            <ForumShell embedded title="Administration">
                <ForumLoading label="Berechtigungen werden geprüft …" />
            </ForumShell>
        );
    if (!isForumAdministrator(user))
        return (
            <ForumShell
                embedded
                title="Kein Zugriff"
                description="Für diesen Bereich benötigst du die Berechtigung forum.admin."
            >
                <Link className="forum-button-secondary" to="/forum">
                    <FaArrowLeft /> Zurück zum Forum
                </Link>
            </ForumShell>
        );

    const tabs = [
        ['structure', FaFolderPlus, 'Struktur'],
        ['permissions', FaShieldHalved, 'Gruppenrechte'],
        ['labels', FaTags, 'Labels'],
        ['reports', FaTriangleExclamation, 'Meldungen'],
        ['suggestions', FaLightbulb, 'Vorschläge'],
        ['blog', FaNewspaper, 'Blog'],
        ['settings', FaGear, 'Einstellungen']
    ];

    return (
        <ForumShell
            embedded
            eyebrow="ADMINISTRATION"
            title="Forum verwalten"
            description="Erstelle Kategorien und Foren, ordne Benutzergruppen zu und passe globale Forum-Einstellungen an."
            rootBreadcrumb={{ label: 'Administration', to: '/admin' }}
            breadcrumbs={[{ label: 'Forum' }]}
            actions={
                <div className="flex flex-wrap gap-2">
                    <Link className="forum-button-secondary" to="/admin">
                        <FaArrowLeft /> Admin-Zentrale
                    </Link>
                    <Link className="forum-button-secondary" to="/forum">
                        Forum öffnen
                    </Link>
                </div>
            }
        >
            <div className="mb-7 flex flex-wrap gap-2 rounded-2xl border border-white/[.06] bg-white/[.025] p-2">
                {tabs.map(([key, Icon, label]) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`forum-admin-tab ${tab === key ? 'forum-admin-tab-active' : ''}`}
                    >
                        <Icon /> {label}
                    </button>
                ))}
            </div>
            {state.loading && <ForumLoading label="Administration wird geladen …" />}
            {state.error && <ForumError message={state.error} retry={load} />}
            {!state.loading && !state.error && tab === 'structure' && (
                <StructureEditor nodes={state.nodes} onChanged={load} />
            )}
            {!state.loading && !state.error && tab === 'permissions' && (
                <PermissionEditor nodes={state.nodes} groups={state.groups} />
            )}
            {!state.loading && !state.error && tab === 'labels' && (
                <LabelsEditor
                    nodes={state.nodes}
                    groups={state.groups}
                    labels={state.labels}
                    labelTypes={state.labelTypes}
                    onChanged={load}
                />
            )}
            {!state.loading && !state.error && tab === 'settings' && (
                <SettingsEditor initial={state.settings} onChanged={load} />
            )}
            {!state.loading && !state.error && tab === 'reports' && <ReportsEditor />}
            {!state.loading && !state.error && tab === 'suggestions' && <SuggestionAdmin />}
            {!state.loading && !state.error && tab === 'blog' && <BlogAdmin />}
        </ForumShell>
    );
}

function ReportsEditor() {
    const [status, setStatus] = useState('OPEN');
    const [page, setPage] = useState(0);
    const [state, setState] = useState({ loading: true, response: null, error: '' });

    const load = useCallback(async () => {
        setState((current) => ({ ...current, loading: true, error: '' }));
        try {
            const response = await forumApi.admin.reports(page, 20, status);
            setState({ loading: false, response, error: '' });
        } catch (error) {
            setState({ loading: false, response: null, error: error.message });
        }
    }, [page, status]);

    useEffect(() => {
        load();
    }, [load]);

    const update = async (report, nextStatus) => {
        try {
            await forumApi.admin.updateReport(report.id, nextStatus);
            await load();
        } catch (error) {
            setState((current) => ({ ...current, error: error.message }));
        }
    };

    return (
        <section className="forum-panel overflow-hidden rounded-3xl">
            <header className="flex flex-col justify-between gap-4 border-b border-white/[.06] p-6 sm:flex-row sm:items-end">
                <div>
                    <p className="eyebrow">MODERATION</p>
                    <h2 className="mt-2 font-display text-2xl font-bold">Gemeldete Inhalte</h2>
                    <p className="mt-2 text-sm text-zinc-500">Prüfe Meldungen und dokumentiere deren Bearbeitung.</p>
                </div>
                <label className="forum-label w-full sm:w-56">
                    Status
                    <select
                        className="forum-input"
                        value={status}
                        onChange={(event) => {
                            setStatus(event.target.value);
                            setPage(0);
                        }}
                    >
                        <option value="OPEN">Offen</option>
                        <option value="CLOSED">Erledigt</option>
                        <option value="">Alle</option>
                    </select>
                </label>
            </header>
            {state.loading && (
                <div className="p-6">
                    <ForumLoading label="Meldungen werden geladen …" />
                </div>
            )}
            {state.error && (
                <div className="p-6">
                    <ForumError message={state.error} retry={load} />
                </div>
            )}
            {!state.loading && !state.error && !(state.response?.items?.length > 0) && (
                <p className="p-8 text-center text-sm text-zinc-600">Keine Meldungen mit diesem Status vorhanden.</p>
            )}
            {!state.loading &&
                !state.error &&
                (state.response?.items ?? []).map((report) => (
                    <article className="border-b border-white/[.05] p-6 last:border-0" key={report.id}>
                        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                                    <span
                                        className={`rounded-full px-2 py-1 font-semibold ${report.status === 'OPEN' ? 'bg-red-500/10 text-red-300' : 'bg-emerald-500/10 text-emerald-300'}`}
                                    >
                                        {report.status === 'OPEN' ? 'OFFEN' : 'ERLEDIGT'}
                                    </span>
                                    <span>{report.targetType === 'POST' ? 'Beitrag' : 'Thema'}</span>
                                    <span>·</span>
                                    <span>{formatDate(report.createdAt)}</span>
                                </div>
                                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                                    {report.reason}
                                </p>
                                <div className="mt-5 flex flex-wrap items-center gap-4">
                                    <UserIdentity playerId={report.reporterUserId} linked />
                                    <Link
                                        className="text-sm font-semibold text-orange-300 hover:text-orange-200"
                                        to={`/forum/topic/${report.topicId}${report.postId ? `#post-${report.postId}` : ''}`}
                                    >
                                        Inhalt öffnen →
                                    </Link>
                                </div>
                            </div>
                            <button
                                className={report.status === 'OPEN' ? 'forum-button-primary' : 'forum-button-secondary'}
                                onClick={() => update(report, report.status === 'OPEN' ? 'CLOSED' : 'OPEN')}
                            >
                                <FaCheck /> {report.status === 'OPEN' ? 'Als erledigt markieren' : 'Wieder öffnen'}
                            </button>
                        </div>
                        {report.handledAt && (
                            <p className="mt-4 text-xs text-zinc-700">Bearbeitet {formatDate(report.handledAt)}</p>
                        )}
                    </article>
                ))}
            {state.response && (
                <div className="border-t border-white/[.05] px-6">
                    <Pagination
                        page={state.response.page}
                        size={state.response.size}
                        total={state.response.total}
                        onPage={setPage}
                    />
                </div>
            )}
        </section>
    );
}

function StructureEditor({ nodes, onChanged }) {
    const [selectedId, setSelectedId] = useState('new');
    const selected = nodes.find((node) => node.id === selectedId);
    const [form, setForm] = useState(emptyNode);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const categories = nodes.filter((node) => node.type === 'CATEGORY');

    useEffect(() => {
        setForm(selected ? { ...emptyNode, ...selected, parentId: selected.parentId || '' } : emptyNode);
        setMessage('');
    }, [selected]);

    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage('');
        const body = {
            ...form,
            parentId: form.parentId || null,
            redirectUrl: form.redirectUrl || null,
            icon: form.icon || null
        };
        try {
            if (selected) await forumApi.admin.updateNode(selected.id, body);
            else await forumApi.admin.createNode(body);
            setMessage('Gespeichert.');
            await onChanged();
        } catch (error) {
            setMessage(error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="grid gap-7 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="forum-panel h-fit overflow-hidden rounded-3xl">
                <button
                    className={`forum-admin-list-item ${selectedId === 'new' ? 'bg-orange-500/10 text-orange-300' : ''}`}
                    onClick={() => setSelectedId('new')}
                >
                    <FaFolderPlus /> Neues Element
                </button>
                {[...nodes]
                    .sort((a, b) => a.order - b.order)
                    .map((node) => (
                        <button
                            key={node.id}
                            className={`forum-admin-list-item ${selectedId === node.id ? 'bg-white/[.05] text-white' : ''}`}
                            onClick={() => setSelectedId(node.id)}
                        >
                            <span className="truncate">
                                <small>{node.type === 'CATEGORY' ? 'Kategorie' : 'Forum'}</small>
                                {node.title}
                            </span>
                        </button>
                    ))}
            </aside>
            <form onSubmit={save} className="forum-panel rounded-3xl p-6 sm:p-8">
                <p className="eyebrow">{selected ? 'ELEMENT BEARBEITEN' : 'NEUES ELEMENT'}</p>
                <h2 className="mt-2 font-display text-2xl font-bold">
                    {selected?.title || 'Kategorie oder Forum erstellen'}
                </h2>
                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <label className="forum-label">
                        Typ
                        <select
                            className="forum-input"
                            value={form.type}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    type: event.target.value,
                                    parentId: event.target.value === 'CATEGORY' ? '' : form.parentId
                                })
                            }
                        >
                            <option value="CATEGORY">Kategorie</option>
                            <option value="FORUM">Forum</option>
                        </select>
                    </label>
                    <label className="forum-label">
                        Sortierung
                        <input
                            className="forum-input"
                            type="number"
                            value={form.order}
                            onChange={(event) => setForm({ ...form, order: Number(event.target.value) })}
                        />
                    </label>
                </div>
                <label className="forum-label mt-5">
                    Titel
                    <input
                        className="forum-input"
                        required
                        minLength={2}
                        value={form.title}
                        onChange={(event) => setForm({ ...form, title: event.target.value })}
                    />
                </label>
                <label className="forum-label mt-5">
                    Beschreibung
                    <textarea
                        className="forum-input min-h-24 resize-y"
                        maxLength={255}
                        value={form.description || ''}
                        onChange={(event) => setForm({ ...form, description: event.target.value })}
                    />
                </label>
                {form.type === 'FORUM' && (
                    <>
                        <label className="forum-label mt-5">
                            Übergeordnete Kategorie
                            <select
                                className="forum-input"
                                value={form.parentId}
                                onChange={(event) => setForm({ ...form, parentId: event.target.value })}
                            >
                                <option value="">Keine Kategorie</option>
                                {categories
                                    .filter((category) => category.id !== selectedId)
                                    .map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.title}
                                        </option>
                                    ))}
                            </select>
                        </label>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            <Toggle
                                checked={form.displayAsNews}
                                onChange={(value) => setForm({ ...form, displayAsNews: value })}
                                label="Als News-Bereich anzeigen"
                            />
                            <Toggle
                                checked={form.redirect}
                                onChange={(value) => setForm({ ...form, redirect: value })}
                                label="Als Weiterleitung verwenden"
                            />
                        </div>
                        {form.redirect && (
                            <label className="forum-label mt-5">
                                Weiterleitungs-URL
                                <input
                                    className="forum-input"
                                    type="url"
                                    value={form.redirectUrl || ''}
                                    onChange={(event) => setForm({ ...form, redirectUrl: event.target.value })}
                                />
                            </label>
                        )}
                    </>
                )}
                {message && (
                    <p className={`mt-5 text-sm ${message === 'Gespeichert.' ? 'text-emerald-400' : 'text-red-300'}`}>
                        {message}
                    </p>
                )}
                <div className="mt-7 flex justify-end">
                    <button className="forum-button-primary" disabled={saving}>
                        <FaFloppyDisk /> {saving ? 'Speichert …' : 'Speichern'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function PermissionEditor({ nodes, groups }) {
    const forums = nodes.filter((node) => node.type === 'FORUM');
    const [forumId, setForumId] = useState(forums[0]?.id || '');
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const rows = useMemo(
        () => [
            { key: '0', displayName: 'Gäste' },
            ...groups.map((group) => ({ key: group.key, displayName: group.displayName }))
        ],
        [groups]
    );

    useEffect(() => {
        if (!forumId) return;
        setLoading(true);
        setMessage('');
        forumApi.admin
            .permissions(forumId)
            .then((items) => {
                const mapped = Object.fromEntries(items.map((item) => [item.groupId, item]));
                setPermissions(
                    Object.fromEntries(
                        rows.map((group) => [
                            group.key,
                            { ...emptyPermission(group.key), ...(mapped[group.key] || {}) }
                        ])
                    )
                );
            })
            .catch((error) => setMessage(error.message))
            .finally(() => setLoading(false));
    }, [forumId, rows]);

    const toggle = (groupId, field) =>
        setPermissions((current) => ({
            ...current,
            [groupId]: { ...current[groupId], [field]: !current[groupId]?.[field] }
        }));
    const save = async () => {
        setLoading(true);
        setMessage('');
        try {
            await Promise.all(
                rows.map((group) =>
                    forumApi.admin.savePermission(forumId, permissions[group.key] || emptyPermission(group.key))
                )
            );
            setMessage('Gruppenrechte gespeichert.');
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="forum-panel overflow-hidden rounded-3xl">
            <header className="flex flex-col justify-between gap-4 border-b border-white/[.06] p-6 sm:flex-row sm:items-end">
                <label className="forum-label w-full max-w-md">
                    Forum
                    <select
                        className="forum-input"
                        value={forumId}
                        onChange={(event) => setForumId(event.target.value)}
                    >
                        {forums.map((forum) => (
                            <option key={forum.id} value={forum.id}>
                                {forum.title}
                            </option>
                        ))}
                    </select>
                </label>
                <button className="forum-button-primary" onClick={save} disabled={loading || !forumId}>
                    <FaFloppyDisk /> Alle Rechte speichern
                </button>
            </header>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-xs">
                    <thead className="border-b border-white/[.06] bg-black/15 text-zinc-600">
                        <tr>
                            <th className="sticky left-0 bg-[#111218] px-5 py-4">Gruppe</th>
                            {permissionFields.map(([, label]) => (
                                <th className="px-3 py-4 text-center font-medium" key={label}>
                                    {label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((group) => (
                            <tr className="border-b border-white/[.045] last:border-0" key={group.key}>
                                <th className="sticky left-0 bg-[#111218] px-5 py-4">
                                    <b className="block text-zinc-200">{group.displayName}</b>
                                    <span className="text-[10px] text-zinc-700">{group.key}</span>
                                </th>
                                {permissionFields.map(([field]) => (
                                    <td className="px-3 py-4 text-center" key={field}>
                                        <button
                                            onClick={() => toggle(group.key, field)}
                                            className={`mx-auto grid h-7 w-7 place-items-center rounded-lg border ${permissions[group.key]?.[field] ? 'border-orange-500/30 bg-orange-500/15 text-orange-300' : 'border-white/[.08] bg-black/20 text-transparent'}`}
                                        >
                                            <FaCheck />
                                        </button>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {message && <p className="border-t border-white/[.05] p-5 text-sm text-zinc-400">{message}</p>}
        </section>
    );
}

function LabelsEditor({ nodes, groups, labels, labelTypes, onChanged }) {
    const [selectedTypeId, setSelectedTypeId] = useState('new');
    const [selectedLabelId, setSelectedLabelId] = useState('new');
    const selectedType = labelTypes.find((type) => type.id === selectedTypeId);
    const selectedLabel = labels.find((label) => label.id === selectedLabelId);
    const [typeForm, setTypeForm] = useState({ name: '', htmlTemplate: '{x}', deleted: false });
    const [labelForm, setLabelForm] = useState({
        name: '',
        labelTypeId: '',
        forumIds: [],
        groupIds: [],
        deleted: false
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const forums = nodes.filter((node) => node.type === 'FORUM' && !node.deleted);

    useEffect(() => {
        setTypeForm(
            selectedType
                ? {
                      name: selectedType.name || '',
                      htmlTemplate: selectedType.htmlTemplate || '{x}',
                      deleted: Boolean(selectedType.deleted)
                  }
                : { name: '', htmlTemplate: '{x}', deleted: false }
        );
        setMessage('');
    }, [selectedType]);

    useEffect(() => {
        setLabelForm(
            selectedLabel
                ? {
                      name: selectedLabel.name || '',
                      labelTypeId: selectedLabel.labelTypeId || '',
                      forumIds: selectedLabel.forumIds ?? [],
                      groupIds: selectedLabel.groupIds ?? [],
                      deleted: Boolean(selectedLabel.deleted)
                  }
                : { name: '', labelTypeId: labelTypes[0]?.id || '', forumIds: [], groupIds: [], deleted: false }
        );
        setMessage('');
    }, [labelTypes, selectedLabel]);

    const saveType = async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            await forumApi.admin.saveLabelType(selectedType?.id || `type-${crypto.randomUUID()}`, typeForm);
            setSelectedTypeId('new');
            setMessage('Label-Typ gespeichert.');
            await onChanged();
        } catch (error) {
            setMessage(error.message);
        } finally {
            setSaving(false);
        }
    };

    const saveLabel = async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            await forumApi.admin.saveLabel(selectedLabel?.id || `label-${crypto.randomUUID()}`, labelForm);
            setSelectedLabelId('new');
            setMessage('Topic-Label gespeichert.');
            await onChanged();
        } catch (error) {
            setMessage(error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="grid gap-7 xl:grid-cols-2">
            <form className="forum-panel rounded-3xl p-6" onSubmit={saveType}>
                <p className="eyebrow">DARSTELLUNG</p>
                <h2 className="mt-2 font-display text-2xl font-bold">Label-Typen</h2>
                <label className="forum-label mt-6">
                    Typ auswählen
                    <select
                        className="forum-input"
                        value={selectedTypeId}
                        onChange={(event) => setSelectedTypeId(event.target.value)}
                    >
                        <option value="new">Neuen Typ anlegen</option>
                        {labelTypes.map((type) => (
                            <option value={type.id} key={type.id}>
                                {type.name}
                                {type.deleted ? ' (gelöscht)' : ''}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="forum-label mt-5">
                    Name
                    <input
                        className="forum-input"
                        required
                        maxLength={64}
                        value={typeForm.name}
                        onChange={(event) => setTypeForm({ ...typeForm, name: event.target.value })}
                    />
                </label>
                <label className="forum-label mt-5">
                    HTML-Vorlage <span className="font-normal normal-case text-zinc-700">(mit {'{x}'})</span>
                    <input
                        className="forum-input font-mono"
                        required
                        value={typeForm.htmlTemplate}
                        onChange={(event) => setTypeForm({ ...typeForm, htmlTemplate: event.target.value })}
                    />
                </label>
                {selectedType && (
                    <Toggle
                        checked={typeForm.deleted}
                        onChange={(value) => setTypeForm({ ...typeForm, deleted: value })}
                        label="Typ deaktivieren"
                    />
                )}
                <button className="forum-button-primary mt-6" disabled={saving}>
                    <FaFloppyDisk /> Typ speichern
                </button>
            </form>

            <form className="forum-panel rounded-3xl p-6" onSubmit={saveLabel}>
                <p className="eyebrow">THEMEN-SORTIERUNG</p>
                <h2 className="mt-2 font-display text-2xl font-bold">Topic-Labels</h2>
                <label className="forum-label mt-6">
                    Label auswählen
                    <select
                        className="forum-input"
                        value={selectedLabelId}
                        onChange={(event) => setSelectedLabelId(event.target.value)}
                    >
                        <option value="new">Neues Label anlegen</option>
                        {labels.map((label) => (
                            <option value={label.id} key={label.id}>
                                {label.name}
                                {label.deleted ? ' (gelöscht)' : ''}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <label className="forum-label">
                        Name
                        <input
                            className="forum-input"
                            required
                            maxLength={32}
                            value={labelForm.name}
                            onChange={(event) => setLabelForm({ ...labelForm, name: event.target.value })}
                        />
                    </label>
                    <label className="forum-label">
                        Label-Typ
                        <select
                            className="forum-input"
                            required
                            value={labelForm.labelTypeId}
                            onChange={(event) => setLabelForm({ ...labelForm, labelTypeId: event.target.value })}
                        >
                            <option value="">Bitte wählen</option>
                            {labelTypes
                                .filter((type) => !type.deleted)
                                .map((type) => (
                                    <option value={type.id} key={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                        </select>
                    </label>
                </div>
                <SelectionGrid
                    title="In diesen Foren verwendbar"
                    items={forums.map((forum) => [forum.id, forum.title])}
                    selected={labelForm.forumIds}
                    onChange={(forumIds) => setLabelForm({ ...labelForm, forumIds })}
                />
                <SelectionGrid
                    title="Auf diese Gruppen begrenzen"
                    hint="Keine Auswahl bedeutet: alle Gruppen"
                    items={groups.map((group) => [group.key || group.id, group.displayName || group.name || group.key])}
                    selected={labelForm.groupIds}
                    onChange={(groupIds) => setLabelForm({ ...labelForm, groupIds })}
                />
                {selectedLabel && (
                    <Toggle
                        checked={labelForm.deleted}
                        onChange={(value) => setLabelForm({ ...labelForm, deleted: value })}
                        label="Label deaktivieren"
                    />
                )}
                <button className="forum-button-primary mt-6" disabled={saving || !labelForm.labelTypeId}>
                    <FaFloppyDisk /> Label speichern
                </button>
            </form>
            {message && <p className="text-sm text-zinc-400 xl:col-span-2">{message}</p>}
        </div>
    );
}

function SelectionGrid({ title, hint, items, selected, onChange }) {
    const toggle = (id) =>
        onChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);
    return (
        <fieldset className="mt-6">
            <legend className="forum-label">
                {title} {hint && <span className="font-normal normal-case text-zinc-700">({hint})</span>}
            </legend>
            <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto rounded-2xl border border-white/[.06] bg-black/15 p-3 sm:grid-cols-2">
                {items.map(([id, label]) => (
                    <label
                        className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-zinc-400 hover:bg-white/[.035]"
                        key={id}
                    >
                        <input
                            className="accent-orange-500"
                            type="checkbox"
                            checked={selected.includes(id)}
                            onChange={() => toggle(id)}
                        />
                        <span className="truncate">{label}</span>
                    </label>
                ))}
            </div>
        </fieldset>
    );
}

function SettingsEditor({ initial, onChanged }) {
    const [form, setForm] = useState({
        reactionsEnabled: initial?.reactionsEnabled ?? true,
        maxTopicTitleLength: initial?.maxTopicTitleLength ?? 150,
        maxPostLength: initial?.maxPostLength ?? 200000,
        bannedTerms: (initial?.bannedTerms ?? []).join('\n')
    });
    const [message, setMessage] = useState('');
    const save = async (event) => {
        event.preventDefault();
        setMessage('');
        try {
            await forumApi.admin.saveSettings({
                ...form,
                bannedTerms: form.bannedTerms
                    .split('\n')
                    .map((term) => term.trim())
                    .filter(Boolean)
            });
            setMessage('Einstellungen gespeichert.');
            await onChanged();
        } catch (error) {
            setMessage(error.message);
        }
    };
    return (
        <form onSubmit={save} className="forum-panel rounded-3xl p-6 sm:p-8">
            <p className="eyebrow">GLOBALE REGELN</p>
            <h2 className="mt-2 font-display text-2xl font-bold">Forum-Einstellungen</h2>
            <div className="mt-7">
                <Toggle
                    checked={form.reactionsEnabled}
                    onChange={(value) => setForm({ ...form, reactionsEnabled: value })}
                    label="Reaktionen aktivieren"
                />
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <label className="forum-label">
                    Maximale Titellänge
                    <input
                        className="forum-input"
                        type="number"
                        min="10"
                        max="300"
                        value={form.maxTopicTitleLength}
                        onChange={(event) => setForm({ ...form, maxTopicTitleLength: Number(event.target.value) })}
                    />
                </label>
                <label className="forum-label">
                    Maximale Beitragslänge
                    <input
                        className="forum-input"
                        type="number"
                        min="1000"
                        max="500000"
                        value={form.maxPostLength}
                        onChange={(event) => setForm({ ...form, maxPostLength: Number(event.target.value) })}
                    />
                </label>
            </div>
            <label className="forum-label mt-5">
                Gesperrte Begriffe{' '}
                <span className="font-normal normal-case text-zinc-700">(ein Begriff pro Zeile)</span>
                <textarea
                    className="forum-input min-h-48 resize-y"
                    value={form.bannedTerms}
                    onChange={(event) => setForm({ ...form, bannedTerms: event.target.value })}
                />
            </label>
            {message && <p className="mt-5 text-sm text-zinc-400">{message}</p>}
            <div className="mt-7 flex justify-end">
                <button className="forum-button-primary">
                    <FaFloppyDisk /> Speichern
                </button>
            </div>
        </form>
    );
}

function Toggle({ checked, onChange, label }) {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/[.06] bg-black/15 p-4 text-sm text-zinc-300">
            <span>{label}</span>
            <input
                className="h-5 w-5 accent-orange-500"
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
            />
        </label>
    );
}

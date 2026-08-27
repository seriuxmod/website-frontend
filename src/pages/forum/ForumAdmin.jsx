import { useCallback, useEffect, useMemo, useState } from 'react';
import { FaArrowLeft, FaCheck, FaFloppyDisk, FaFolderPlus, FaGear, FaShieldHalved } from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import { fetchAuthenticatedUser, getAuthenticatedUser, isForumAdministrator } from '../../lib/auth';
import { forumApi, getPermissionGroups } from '../../lib/forumApi';
import { ForumError, ForumLoading, ForumShell } from './ForumComponents';

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
    const [state, setState] = useState({ loading: true, nodes: [], groups: [], settings: null, error: '' });

    const load = useCallback(async () => {
        setState((current) => ({ ...current, loading: true, error: '' }));
        try {
            const [nodes, groups, settings] = await Promise.all([
                forumApi.admin.nodes(),
                getPermissionGroups(),
                forumApi.admin.settings()
            ]);
            setState({ loading: false, nodes: nodes.nodes ?? [], groups, settings, error: '' });
        } catch (error) {
            setState({ loading: false, nodes: [], groups: [], settings: null, error: error.message });
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
            <ForumShell title="Administration">
                <ForumLoading label="Berechtigungen werden geprüft …" />
            </ForumShell>
        );
    if (!isForumAdministrator(user))
        return (
            <ForumShell
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
        ['settings', FaGear, 'Einstellungen']
    ];

    return (
        <ForumShell
            eyebrow="ADMINISTRATION"
            title="Forum verwalten"
            description="Erstelle Kategorien und Foren, ordne Benutzergruppen zu und passe globale Forum-Einstellungen an."
            breadcrumbs={[{ label: 'Administration' }]}
            actions={
                <Link className="forum-button-secondary" to="/forum">
                    <FaArrowLeft /> Forum öffnen
                </Link>
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
            {!state.loading && !state.error && tab === 'settings' && (
                <SettingsEditor initial={state.settings} onChanged={load} />
            )}
        </ForumShell>
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

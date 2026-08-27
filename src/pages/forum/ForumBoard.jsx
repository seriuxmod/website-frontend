import { useCallback, useEffect, useState } from 'react';
import { FaArrowLeft, FaCirclePlus, FaComments, FaEye, FaMessage, FaXmark } from 'react-icons/fa6';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { beginLogin, fetchAuthenticatedUser, getAuthenticatedUser } from '../../lib/auth';
import { forumApi } from '../../lib/forumApi';
import {
    ForumError,
    ForumIcon,
    ForumLoading,
    ForumShell,
    Pagination,
    TopicFlags,
    UserIdentity,
    formatDate
} from './ForumComponents';

export default function ForumBoard() {
    const { forumId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [labelId, setLabelId] = useState('');
    const [user, setUser] = useState(() => getAuthenticatedUser());
    const [composerOpen, setComposerOpen] = useState(false);
    const [state, setState] = useState({ loading: true, forum: null, topics: null, labels: [], error: '' });

    const load = useCallback(async () => {
        setState((current) => ({ ...current, loading: true, error: '' }));
        try {
            const [forum, topics, labels] = await Promise.all([
                forumApi.forum(forumId),
                forumApi.topics(forumId, page, pageSize, labelId),
                forumApi.labels(forumId)
            ]);
            setState({ loading: false, forum, topics, labels, error: '' });
        } catch (error) {
            setState({ loading: false, forum: null, topics: null, labels: [], error: error.message });
        }
    }, [forumId, labelId, page, pageSize]);

    useEffect(() => {
        load();
    }, [load]);
    useEffect(() => {
        fetchAuthenticatedUser().then(setUser);
    }, []);
    useEffect(() => {
        if (!user) return;
        forumApi
            .preferences()
            .then((preferences) => setPageSize(preferences.topicsPerPage || 20))
            .catch(() => {});
    }, [user?.playerId]);

    if (state.loading && !state.forum)
        return (
            <ForumShell title="Forum wird geladen">
                <ForumLoading />
            </ForumShell>
        );
    if (state.error)
        return (
            <ForumShell title="Forum">
                <ForumError message={state.error} retry={load} />
            </ForumShell>
        );

    const forum = state.forum;
    const topics = state.topics?.items ?? [];
    const create = () => {
        if (!user) return beginLogin(`/forum/${forumId}`);
        if (forum.permissions?.canPostTopic) setComposerOpen(true);
    };

    return (
        <ForumShell
            title={forum.title}
            description={forum.description}
            breadcrumbs={[{ label: forum.title }]}
            actions={
                <>
                    <Link className="forum-button-secondary" to="/forum">
                        <FaArrowLeft /> Übersicht
                    </Link>
                    <button
                        className="forum-button-primary"
                        disabled={Boolean(user) && !forum.permissions?.canPostTopic}
                        onClick={create}
                    >
                        <FaCirclePlus /> Neues Thema
                    </button>
                </>
            }
        >
            {state.labels.length > 0 && (
                <div className="mb-5 flex flex-wrap items-center gap-2">
                    <button
                        className={`forum-filter-chip ${labelId === '' ? 'forum-filter-chip-active' : ''}`}
                        onClick={() => {
                            setLabelId('');
                            setPage(0);
                        }}
                    >
                        Alle Themen
                    </button>
                    {state.labels.map((label) => (
                        <button
                            className={`forum-filter-chip ${labelId === label.id ? 'forum-filter-chip-active' : ''}`}
                            key={label.id}
                            onClick={() => {
                                setLabelId(label.id);
                                setPage(0);
                            }}
                        >
                            {label.name}
                        </button>
                    ))}
                </div>
            )}
            <section className="forum-panel overflow-hidden rounded-3xl">
                <header className="grid gap-4 border-b border-white/[.06] p-6 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="flex items-center gap-4">
                        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500/10 text-orange-400">
                            <ForumIcon node={forum} />
                        </span>
                        <div>
                            <h2 className="font-display text-xl font-bold">Themen</h2>
                            <p className="mt-1 text-xs text-zinc-600">
                                {state.topics.total} Diskussionen in diesem Forum
                            </p>
                        </div>
                    </div>
                    {!forum.permissions?.canPostTopic && user && (
                        <span className="text-xs text-zinc-600">Deine Gruppe darf hier keine Themen erstellen.</span>
                    )}
                </header>
                {topics.length === 0 && (
                    <div className="p-10 text-center">
                        <FaComments className="mx-auto text-3xl text-zinc-800" />
                        <p className="mt-4 text-sm text-zinc-500">Hier gibt es noch keine Themen.</p>
                    </div>
                )}
                {topics.map((topic) => (
                    <Link className="forum-row group" key={topic.id} to={`/forum/topic/${topic.id}`}>
                        <UserIdentity playerId={topic.creatorUserId} compact />
                        <span className="min-w-0 flex-1">
                            <TopicFlags topic={topic} />
                            {topic.labelId && (
                                <span className="mt-2 inline-flex rounded-full bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-300">
                                    {state.labels.find((label) => label.id === topic.labelId)?.name || topic.labelId}
                                </span>
                            )}
                            <b className="mt-2 block truncate font-display text-lg transition group-hover:text-orange-400">
                                {topic.title}
                            </b>
                            <span className="mt-1 block text-xs text-zinc-600">
                                Erstellt {formatDate(topic.createdAt)}
                            </span>
                        </span>
                        <span className="hidden min-w-24 text-right text-xs text-zinc-600 md:block">
                            <FaMessage className="mr-1 inline" /> {topic.posts}
                        </span>
                        <span className="hidden min-w-24 text-right text-xs text-zinc-600 md:block">
                            <FaEye className="mr-1 inline" /> {topic.views}
                        </span>
                        <span className="hidden min-w-44 text-right text-xs text-zinc-600 lg:block">
                            Letzte Antwort
                            <br />
                            <b className="text-zinc-400">{formatDate(topic.lastReplyAt)}</b>
                        </span>
                    </Link>
                ))}
            </section>
            <Pagination page={state.topics.page} size={state.topics.size} total={state.topics.total} onPage={setPage} />

            {composerOpen && (
                <TopicComposer
                    forum={forum}
                    labels={state.labels}
                    onClose={() => setComposerOpen(false)}
                    onCreated={(topic) => navigate(`/forum/topic/${topic.id}`)}
                />
            )}
        </ForumShell>
    );
}

function TopicComposer({ forum, labels, onClose, onCreated }) {
    const [form, setForm] = useState({ title: '', content: '', labelId: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        try {
            const topic = await forumApi.createTopic(forum.id, { ...form, labelId: form.labelId || null });
            onCreated(topic);
        } catch (reason) {
            setError(reason.message);
            setSaving(false);
        }
    };
    return (
        <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/75 p-4 backdrop-blur-md">
            <form onSubmit={submit} className="forum-panel my-8 w-full max-w-3xl rounded-[28px] p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="eyebrow">NEUE DISKUSSION</p>
                        <h2 className="mt-2 font-display text-3xl font-bold">Thema in {forum.title}</h2>
                    </div>
                    <button type="button" className="forum-icon-button" onClick={onClose} aria-label="Schließen">
                        <FaXmark />
                    </button>
                </div>
                <label className="forum-label mt-7">
                    Titel
                    <input
                        className="forum-input"
                        required
                        minLength={2}
                        maxLength={150}
                        value={form.title}
                        onChange={(event) => setForm({ ...form, title: event.target.value })}
                    />
                </label>
                {labels.length > 0 && (
                    <label className="forum-label mt-5">
                        Label
                        <select
                            className="forum-input"
                            value={form.labelId}
                            onChange={(event) => setForm({ ...form, labelId: event.target.value })}
                        >
                            <option value="">Kein Label</option>
                            {labels.map((label) => (
                                <option value={label.id} key={label.id}>
                                    {label.name}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
                <label className="forum-label mt-5">
                    Beitrag
                    <textarea
                        className="forum-input min-h-52 resize-y"
                        required
                        value={form.content}
                        onChange={(event) => setForm({ ...form, content: event.target.value })}
                        placeholder="Worum geht es in deiner Diskussion?"
                    />
                </label>
                {error && <p className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" className="forum-button-secondary" onClick={onClose}>
                        Abbrechen
                    </button>
                    <button className="forum-button-primary" disabled={saving || !forum.permissions?.canPostTopic}>
                        {saving ? 'Wird erstellt …' : 'Thema erstellen'}
                    </button>
                </div>
            </form>
        </div>
    );
}

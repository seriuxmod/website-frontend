import { useCallback, useEffect, useState } from 'react';
import {
    FaArrowLeft,
    FaArrowRightArrowLeft,
    FaBell,
    FaBellSlash,
    FaLock,
    FaCodeMerge,
    FaPen,
    FaReply,
    FaThumbsUp,
    FaTrash,
    FaTriangleExclamation,
    FaUnlock
} from 'react-icons/fa6';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { beginLogin, fetchAuthenticatedUser, getAuthenticatedUser } from '../../lib/auth';
import { forumApi } from '../../lib/forumApi';
import {
    ForumError,
    ForumLoading,
    ForumShell,
    Pagination,
    TopicFlags,
    UserIdentity,
    formatDate
} from './ForumComponents';

export default function ForumTopic() {
    const { topicId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [user, setUser] = useState(() => getAuthenticatedUser());
    const [reply, setReply] = useState('');
    const [replying, setReplying] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [moderationAction, setModerationAction] = useState(null);
    const [error, setError] = useState('');
    const [state, setState] = useState({
        loading: true,
        topic: null,
        forum: null,
        posts: null,
        following: false,
        error: ''
    });

    const load = useCallback(async () => {
        setState((current) => ({ ...current, loading: true, error: '' }));
        try {
            const topic = await forumApi.topic(topicId, page === 0);
            const [forum, posts] = await Promise.all([
                forumApi.forum(topic.forumId),
                forumApi.posts(topicId, page, pageSize)
            ]);
            let following = false;
            if (getAuthenticatedUser()) {
                try {
                    following = (await forumApi.following()).items?.some((item) => item.topicId === topicId);
                } catch {
                    /* optional state */
                }
            }
            if (getAuthenticatedUser()) forumApi.markTopicRead(topicId).catch(() => {});
            setState({ loading: false, topic, forum, posts, following, error: '' });
        } catch (reason) {
            setState({
                loading: false,
                topic: null,
                forum: null,
                posts: null,
                following: false,
                error: reason.message
            });
        }
    }, [page, pageSize, topicId]);

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
            .then((preferences) => setPageSize(preferences.postsPerPage || 20))
            .catch(() => {});
    }, [user?.playerId]);

    const execute = async (action) => {
        setError('');
        try {
            await action();
            await load();
        } catch (reason) {
            setError(reason.message);
        }
    };

    if (state.loading && !state.topic)
        return (
            <ForumShell title="Thema wird geladen">
                <ForumLoading />
            </ForumShell>
        );
    if (state.error)
        return (
            <ForumShell title="Forum">
                <ForumError message={state.error} retry={load} />
            </ForumShell>
        );

    const { topic, forum } = state;
    const ownTopic = user?.playerId === topic.creatorUserId;
    const canModerate = forum.permissions?.canModerate;
    const submitReply = async (event) => {
        event.preventDefault();
        if (!user) return beginLogin(`/forum/topic/${topicId}`);
        setReplying(true);
        setError('');
        try {
            await forumApi.reply(topicId, reply);
            setReply('');
            await load();
        } catch (reason) {
            setError(reason.message);
        } finally {
            setReplying(false);
        }
    };
    const editTitle = async () => {
        const title = window.prompt('Neuer Titel', topic.title);
        if (title?.trim() && title.trim() !== topic.title)
            await execute(() => forumApi.updateTopic(topicId, { title: title.trim() }));
    };
    const deleteTopic = async () => {
        if (!window.confirm('Dieses Thema wirklich löschen?')) return;
        try {
            await forumApi.deleteTopic(topicId);
            navigate(`/forum/${forum.id}`);
        } catch (reason) {
            setError(reason.message);
        }
    };

    const actions = (
        <>
            <Link className="forum-button-secondary" to={`/forum/${forum.id}`}>
                <FaArrowLeft /> {forum.title}
            </Link>
            {user && (
                <button
                    className="forum-button-secondary"
                    onClick={() =>
                        execute(async () => {
                            const result = await forumApi.toggleFollow(topicId);
                            setState((current) => ({ ...current, following: result.following }));
                        })
                    }
                >
                    {state.following ? <FaBellSlash /> : <FaBell />}
                    {state.following ? 'Nicht mehr folgen' : 'Folgen'}
                </button>
            )}
        </>
    );

    return (
        <ForumShell
            title={topic.title}
            description={`${topic.views} Aufrufe · erstellt ${formatDate(topic.createdAt)}`}
            breadcrumbs={[{ label: forum.title, to: `/forum/${forum.id}` }, { label: topic.title }]}
            actions={actions}
        >
            {(ownTopic || canModerate) && (
                <div className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-white/[.06] bg-white/[.025] p-3">
                    <button className="forum-action" onClick={editTitle}>
                        <FaPen /> Titel bearbeiten
                    </button>
                    {canModerate && (
                        <button
                            className="forum-action"
                            onClick={() => execute(() => forumApi.lockTopic(topicId, !topic.locked))}
                        >
                            {topic.locked ? <FaUnlock /> : <FaLock />}
                            {topic.locked ? 'Entsperren' : 'Sperren'}
                        </button>
                    )}
                    {canModerate && (
                        <button className="forum-action" onClick={() => setModerationAction('move')}>
                            <FaArrowRightArrowLeft /> Verschieben
                        </button>
                    )}
                    {canModerate && (
                        <button className="forum-action" onClick={() => setModerationAction('merge')}>
                            <FaCodeMerge /> Zusammenführen
                        </button>
                    )}
                    {canModerate && (
                        <button
                            className="forum-action"
                            onClick={() => execute(() => forumApi.stickTopic(topicId, !topic.sticky))}
                        >
                            📌 {topic.sticky ? 'Lösen' : 'Anpinnen'}
                        </button>
                    )}
                    <button className="forum-action text-red-300" onClick={deleteTopic}>
                        <FaTrash /> Thema löschen
                    </button>
                </div>
            )}
            {error && (
                <p className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/[.06] p-4 text-sm text-red-300">
                    {error}
                </p>
            )}
            <div className="space-y-5">
                {(state.posts.items ?? []).map((post) => (
                    <PostCard
                        key={post.id}
                        post={post}
                        user={user}
                        forum={forum}
                        onEdit={() => setEditingPost(post)}
                        onChanged={load}
                        onError={setError}
                    />
                ))}
            </div>
            <Pagination page={state.posts.page} size={state.posts.size} total={state.posts.total} onPage={setPage} />
            <section className="forum-panel mt-8 rounded-3xl p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="eyebrow">DEINE ANTWORT</p>
                        <h2 className="mt-2 font-display text-2xl font-bold">Diskussion fortsetzen</h2>
                    </div>
                    <TopicFlags topic={topic} />
                </div>
                {!user ? (
                    <div className="mt-6 rounded-2xl border border-orange-500/15 bg-orange-500/[.06] p-5 text-sm text-zinc-400">
                        Melde dich mit deinem Minecraft-Konto an, um zu antworten.
                        <button
                            className="forum-button-primary mt-4"
                            onClick={() => beginLogin(`/forum/topic/${topicId}`)}
                        >
                            Jetzt anmelden
                        </button>
                    </div>
                ) : topic.locked && !canModerate ? (
                    <p className="mt-6 text-sm text-zinc-500">Dieses Thema ist gesperrt.</p>
                ) : (
                    <form className="mt-6" onSubmit={submitReply}>
                        <textarea
                            className="forum-input min-h-40 resize-y"
                            required
                            value={reply}
                            onChange={(event) => setReply(event.target.value)}
                            placeholder="Schreibe eine hilfreiche Antwort …"
                        />
                        <div className="mt-4 flex justify-end">
                            <button
                                className="forum-button-primary"
                                disabled={replying || !forum.permissions?.canPostReply}
                            >
                                <FaReply /> {replying ? 'Wird gesendet …' : 'Antworten'}
                            </button>
                        </div>
                    </form>
                )}
            </section>
            {editingPost && (
                <PostEditor
                    post={editingPost}
                    onClose={() => setEditingPost(null)}
                    onSaved={() => {
                        setEditingPost(null);
                        load();
                    }}
                />
            )}
            {moderationAction && (
                <TopicModerationDialog
                    action={moderationAction}
                    topic={topic}
                    onClose={() => setModerationAction(null)}
                    onMoved={(result) => {
                        setModerationAction(null);
                        navigate(`/forum/topic/${result.id}`, { replace: true });
                    }}
                    onError={setError}
                />
            )}
        </ForumShell>
    );
}

function TopicModerationDialog({ action, topic, onClose, onMoved, onError }) {
    const [tree, setTree] = useState([]);
    const [targetId, setTargetId] = useState('');
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        if (action !== 'move') return;
        forumApi
            .tree()
            .then((result) => {
                const forums = (result.nodes ?? []).filter(
                    (node) => node.type === 'FORUM' && node.id !== topic.forumId && !node.redirect
                );
                setTree(forums);
                setTargetId(forums[0]?.id || '');
            })
            .catch((error) => onError(error.message));
    }, [action, onError, topic.forumId]);

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
            const result =
                action === 'move'
                    ? await forumApi.moveTopic(topic.id, targetId)
                    : await forumApi.mergeTopic(topic.id, targetId.trim());
            onMoved(result);
        } catch (error) {
            onError(error.message);
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/80 p-4 backdrop-blur-sm" role="dialog">
            <form className="forum-panel w-full max-w-lg rounded-3xl p-6 sm:p-8" onSubmit={submit}>
                <p className="eyebrow">MODERATION</p>
                <h2 className="mt-2 font-display text-2xl font-bold">
                    {action === 'move' ? 'Thema verschieben' : 'Themen zusammenführen'}
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-500">
                    {action === 'move'
                        ? 'Alle Beiträge dieses Themas werden in das ausgewählte Forum verschoben.'
                        : 'Dieses Thema wird in das Zielthema übernommen und anschließend geschlossen.'}
                </p>
                <label className="forum-label mt-6">
                    {action === 'move' ? 'Zielforum' : 'ID des Zielthemas'}
                    {action === 'move' ? (
                        <select
                            className="forum-input"
                            required
                            value={targetId}
                            onChange={(event) => setTargetId(event.target.value)}
                        >
                            {tree.map((forum) => (
                                <option key={forum.id} value={forum.id}>
                                    {forum.title}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            className="forum-input font-mono"
                            required
                            value={targetId}
                            onChange={(event) => setTargetId(event.target.value)}
                            placeholder="z. B. 68b1…"
                        />
                    )}
                </label>
                <div className="mt-7 flex justify-end gap-3">
                    <button type="button" className="forum-button-secondary" onClick={onClose}>
                        Abbrechen
                    </button>
                    <button className="forum-button-primary" disabled={saving || !targetId}>
                        {saving ? 'Wird ausgeführt …' : action === 'move' ? 'Verschieben' : 'Zusammenführen'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function PostCard({ post, user, forum, onEdit, onChanged, onError }) {
    const ownPost = user?.playerId === post.creatorUserId;
    const canEdit = ownPost || forum.permissions?.canEditPost || forum.permissions?.canModerate;
    const canDelete = ownPost || forum.permissions?.canModerate;
    const liked = post.reactedByMe;
    const likeCount = post.reactionCounts?.like ?? 0;
    const perform = async (action) => {
        try {
            await action();
            await onChanged();
        } catch (error) {
            onError(error.message);
        }
    };
    const report = async () => {
        const reason = window.prompt('Warum möchtest du diesen Beitrag melden?');
        if (reason?.trim())
            await perform(() => forumApi.report({ targetType: 'POST', targetId: post.id, reason: reason.trim() }));
    };
    return (
        <article id={`post-${post.id}`} className="forum-panel overflow-hidden rounded-3xl">
            <div className="grid md:grid-cols-[230px_minmax(0,1fr)]">
                <aside className="border-b border-white/[.06] bg-black/15 p-6 text-center md:border-b-0 md:border-r md:py-8">
                    <UserIdentity playerId={post.creatorUserId} linked author />
                    <span className="mt-6 block text-[11px] text-zinc-700">Beitrag #{post.postNumber}</span>
                </aside>
                <div className="min-w-0 p-6 sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.055] pb-4">
                        <span className="text-xs text-zinc-600">
                            {formatDate(post.createdAt)}
                            {post.editedAt ? ` · bearbeitet ${formatDate(post.editedAt)}` : ''}
                        </span>
                        <div className="flex items-center gap-1">
                            {canEdit && (
                                <button className="forum-icon-button" onClick={onEdit} title="Bearbeiten">
                                    <FaPen />
                                </button>
                            )}
                            {canDelete && (
                                <button
                                    className="forum-icon-button text-red-300"
                                    onClick={() =>
                                        window.confirm('Beitrag löschen?') &&
                                        perform(() => forumApi.deletePost(post.id))
                                    }
                                    title="Löschen"
                                >
                                    <FaTrash />
                                </button>
                            )}
                            {user && forum.permissions?.canReport && (
                                <button className="forum-icon-button" onClick={report} title="Melden">
                                    <FaTriangleExclamation />
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="min-h-20 whitespace-pre-wrap break-words pt-6 text-[15px] leading-8 text-zinc-300">
                        {post.content}
                    </p>
                    <div className="mt-7 flex items-center gap-2 border-t border-white/[.055] pt-4">
                        {user && forum.permissions?.canReact && (
                            <button
                                className={`forum-action ${liked ? 'border-orange-500/30 bg-orange-500/10 text-orange-300' : ''}`}
                                onClick={() =>
                                    perform(() =>
                                        liked ? forumApi.unreact(post.id, 'like') : forumApi.react(post.id, 'like')
                                    )
                                }
                            >
                                <FaThumbsUp /> Gefällt mir {likeCount > 0 && `(${likeCount})`}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}

function PostEditor({ post, onClose, onSaved }) {
    const [content, setContent] = useState(post.content);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
            await forumApi.updatePost(post.id, content);
            onSaved();
        } catch (reason) {
            setError(reason.message);
            setSaving(false);
        }
    };
    return (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/75 p-4 backdrop-blur-md">
            <form onSubmit={submit} className="forum-panel w-full max-w-3xl rounded-[28px] p-7">
                <p className="eyebrow">BEITRAG BEARBEITEN</p>
                <textarea
                    className="forum-input mt-5 min-h-64 resize-y"
                    required
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                />
                {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
                <div className="mt-5 flex justify-end gap-3">
                    <button type="button" className="forum-button-secondary" onClick={onClose}>
                        Abbrechen
                    </button>
                    <button className="forum-button-primary" disabled={saving}>
                        {saving ? 'Speichert …' : 'Speichern'}
                    </button>
                </div>
            </form>
        </div>
    );
}

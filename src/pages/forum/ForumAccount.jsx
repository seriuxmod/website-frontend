import { useCallback, useEffect, useState } from 'react';
import { FaBell, FaCheck, FaEye, FaGear, FaReply, FaThumbsUp, FaTrash } from 'react-icons/fa6';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { beginLogin, fetchAuthenticatedUser, getAuthenticatedUser } from '../../lib/auth';
import { forumApi } from '../../lib/forumApi';
import { ForumError, ForumLoading, ForumShell, Pagination, UserIdentity, formatDate } from './ForumComponents';

const PAGE_SIZE = 20;

export default function ForumAccount() {
    const [user, setUser] = useState(() => getAuthenticatedUser());
    const location = useLocation();
    const navigate = useNavigate();
    const requestedTab = new URLSearchParams(location.search).get('tab');
    const tab = ['notifications', 'following', 'preferences'].includes(requestedTab) ? requestedTab : 'notifications';

    useEffect(() => {
        fetchAuthenticatedUser().then(setUser);
    }, []);

    if (!user)
        return (
            <ForumShell title="Mein Forum" breadcrumbs={[{ label: 'Mein Forum' }]}>
                <div className="forum-panel rounded-3xl p-8 text-center">
                    <FaBell className="mx-auto text-3xl text-orange-400" />
                    <h2 className="mt-4 font-display text-2xl font-bold">Anmeldung erforderlich</h2>
                    <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-zinc-500">
                        Benachrichtigungen, beobachtete Themen und persönliche Einstellungen gehören zu deiner
                        Seriux-ID.
                    </p>
                    <button className="forum-button-primary mt-6" onClick={() => beginLogin('/forum/account')}>
                        Jetzt anmelden
                    </button>
                </div>
            </ForumShell>
        );

    const tabs = [
        ['notifications', FaBell, 'Benachrichtigungen'],
        ['following', FaEye, 'Beobachtete Themen'],
        ['preferences', FaGear, 'Einstellungen']
    ];

    return (
        <ForumShell
            eyebrow="DEIN COMMUNITY-BEREICH"
            title="Mein Forum"
            description="Behalte Diskussionen im Blick und entscheide selbst, wann das Forum dich informiert."
            breadcrumbs={[{ label: 'Mein Forum' }]}
        >
            <div className="mb-7 flex flex-wrap gap-2 rounded-2xl border border-white/[.06] bg-white/[.025] p-2">
                {tabs.map(([key, Icon, label]) => (
                    <button
                        className={`forum-admin-tab ${tab === key ? 'forum-admin-tab-active' : ''}`}
                        key={key}
                        onClick={() => navigate(`/forum/account?tab=${key}`)}
                    >
                        <Icon /> {label}
                    </button>
                ))}
            </div>
            {tab === 'notifications' && <Notifications />}
            {tab === 'following' && <Following />}
            {tab === 'preferences' && <Preferences />}
        </ForumShell>
    );
}

function Notifications() {
    const [page, setPage] = useState(0);
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [state, setState] = useState({ loading: true, data: null, error: '' });
    const load = useCallback(async () => {
        setState((current) => ({ ...current, loading: true, error: '' }));
        try {
            setState({ loading: false, data: await forumApi.notifications(page, PAGE_SIZE, unreadOnly), error: '' });
        } catch (error) {
            setState({ loading: false, data: null, error: error.message });
        }
    }, [page, unreadOnly]);

    useEffect(() => {
        load();
    }, [load]);

    const readAll = async () => {
        await forumApi.markAllNotificationsRead();
        await load();
    };

    if (state.loading && !state.data) return <ForumLoading label="Benachrichtigungen werden geladen …" />;
    if (state.error) return <ForumError message={state.error} retry={load} />;
    const data = state.data;

    return (
        <section className="forum-panel overflow-hidden rounded-3xl">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[.06] p-6">
                <div>
                    <h2 className="font-display text-xl font-bold">Benachrichtigungen</h2>
                    <p className="mt-1 text-xs text-zinc-600">{data.unread} ungelesen</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        className={`forum-filter-chip ${unreadOnly ? 'forum-filter-chip-active' : ''}`}
                        onClick={() => {
                            setUnreadOnly((value) => !value);
                            setPage(0);
                        }}
                    >
                        Nur ungelesene
                    </button>
                    {data.unread > 0 && (
                        <button className="forum-button-secondary" onClick={readAll}>
                            <FaCheck /> Alle gelesen
                        </button>
                    )}
                </div>
            </header>
            {(data.items ?? []).length === 0 ? (
                <EmptyState icon={FaBell} text="Hier gibt es noch keine Benachrichtigungen." />
            ) : (
                data.items.map((notification) => (
                    <NotificationRow notification={notification} onChanged={load} key={notification.id} />
                ))
            )}
            <div className="px-6 pb-6">
                <Pagination page={data.page} size={data.size} total={data.total} onPage={setPage} />
            </div>
        </section>
    );
}

function NotificationRow({ notification, onChanged }) {
    const reaction = notification.type === 'POST_REACTION';
    const target = `/forum/topic/${notification.topicId}${notification.postId ? `#post-${notification.postId}` : ''}`;
    const markRead = async () => {
        if (!notification.read) {
            await forumApi.markNotificationRead(notification.id);
            await onChanged();
        }
    };
    return (
        <div className={`forum-row ${notification.read ? '' : 'bg-orange-500/[.035]'}`}>
            <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${reaction ? 'bg-pink-500/10 text-pink-300' : 'bg-orange-500/10 text-orange-300'}`}
            >
                {reaction ? <FaThumbsUp /> : <FaReply />}
            </span>
            <div className="min-w-0 flex-1">
                <div className="mb-2">
                    <UserIdentity playerId={notification.actorUserId} compact linked />
                </div>
                <Link className="text-sm text-zinc-300 transition hover:text-orange-300" to={target} onClick={markRead}>
                    {reaction ? 'reagierte auf deinen Beitrag' : 'antwortete in einem beobachteten Thema'}
                    <b className="block truncate font-display text-base text-white">{notification.topicTitle}</b>
                </Link>
                <span className="mt-2 block text-[11px] text-zinc-600">{formatDate(notification.createdAt)}</span>
            </div>
            {!notification.read && (
                <button className="forum-icon-button" onClick={markRead} title="Als gelesen markieren">
                    <FaCheck />
                </button>
            )}
        </div>
    );
}

function Following() {
    const [page, setPage] = useState(0);
    const [state, setState] = useState({ loading: true, data: null, error: '' });
    const load = useCallback(async () => {
        setState((current) => ({ ...current, loading: true, error: '' }));
        try {
            setState({ loading: false, data: await forumApi.following(page, PAGE_SIZE), error: '' });
        } catch (error) {
            setState({ loading: false, data: null, error: error.message });
        }
    }, [page]);
    useEffect(() => {
        load();
    }, [load]);

    const unfollowAll = async () => {
        if (!window.confirm('Möchtest du wirklich allen Themen nicht mehr folgen?')) return;
        await forumApi.unfollowAll();
        setPage(0);
        await load();
    };

    if (state.loading && !state.data) return <ForumLoading label="Beobachtete Themen werden geladen …" />;
    if (state.error) return <ForumError message={state.error} retry={load} />;
    const data = state.data;
    return (
        <section className="forum-panel overflow-hidden rounded-3xl">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[.06] p-6">
                <div>
                    <h2 className="font-display text-xl font-bold">Beobachtete Themen</h2>
                    <p className="mt-1 text-xs text-zinc-600">{data.total} Themen in deiner Liste</p>
                </div>
                {data.total > 0 && (
                    <button className="forum-button-secondary text-red-300" onClick={unfollowAll}>
                        <FaTrash /> Alle entfernen
                    </button>
                )}
            </header>
            {(data.items ?? []).length === 0 ? (
                <EmptyState icon={FaEye} text="Du beobachtest derzeit kein Thema." />
            ) : (
                data.items.map((topic) => (
                    <div className={`forum-row ${topic.unread ? 'bg-orange-500/[.035]' : ''}`} key={topic.topicId}>
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-500/10 text-orange-300">
                            {topic.unread ? <FaBell /> : <FaEye />}
                        </span>
                        <Link
                            className="min-w-0 flex-1"
                            to={`/forum/topic/${topic.topicId}`}
                            onClick={() => forumApi.markTopicRead(topic.topicId).catch(() => {})}
                        >
                            {topic.unread && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                                    Neue Aktivität
                                </span>
                            )}
                            <b className="block truncate font-display text-lg transition hover:text-orange-300">
                                {topic.title}
                            </b>
                            <span className="mt-1 block text-xs text-zinc-600">
                                Letzte Antwort {formatDate(topic.lastReplyAt)}
                            </span>
                        </Link>
                        <button
                            className="forum-icon-button text-red-300"
                            onClick={async () => {
                                await forumApi.toggleFollow(topic.topicId);
                                await load();
                            }}
                            title="Nicht mehr beobachten"
                        >
                            <FaTrash />
                        </button>
                    </div>
                ))
            )}
            <div className="px-6 pb-6">
                <Pagination page={data.page} size={data.size} total={data.total} onPage={setPage} />
            </div>
        </section>
    );
}

function Preferences() {
    const [form, setForm] = useState(null);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);
    const load = useCallback(async () => {
        try {
            setForm(await forumApi.preferences());
            setError('');
        } catch (reason) {
            setError(reason.message);
        }
    }, []);
    useEffect(() => {
        load();
    }, [load]);
    if (!form && !error) return <ForumLoading label="Einstellungen werden geladen …" />;
    if (error && !form) return <ForumError message={error} retry={load} />;

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage('');
        setError('');
        try {
            setForm(await forumApi.updatePreferences(form));
            setMessage('Deine Forum-Einstellungen wurden gespeichert.');
        } catch (reason) {
            setError(reason.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="forum-panel rounded-3xl p-6 sm:p-8" onSubmit={submit}>
            <h2 className="font-display text-xl font-bold">Forum-Einstellungen</h2>
            <p className="mt-2 text-sm leading-7 text-zinc-500">
                Steuere automatische Beobachtungen, Benachrichtigungen und die Seitengröße.
            </p>
            <div className="mt-7 grid gap-3 lg:grid-cols-2">
                <PreferenceToggle
                    label="Eigene Themen automatisch beobachten"
                    checked={form.autoFollowCreatedTopics}
                    onChange={(value) => setForm({ ...form, autoFollowCreatedTopics: value })}
                />
                <PreferenceToggle
                    label="Themen nach einer Antwort beobachten"
                    checked={form.autoFollowRepliedTopics}
                    onChange={(value) => setForm({ ...form, autoFollowRepliedTopics: value })}
                />
                <PreferenceToggle
                    label="Bei Antworten in beobachteten Themen informieren"
                    checked={form.notifyOnFollowedTopicReply}
                    onChange={(value) => setForm({ ...form, notifyOnFollowedTopicReply: value })}
                />
                <PreferenceToggle
                    label="Bei Reaktionen auf Beiträge informieren"
                    checked={form.notifyOnReaction}
                    onChange={(value) => setForm({ ...form, notifyOnReaction: value })}
                />
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <PageSizeSelect
                    label="Themen pro Seite"
                    value={form.topicsPerPage}
                    onChange={(value) => setForm({ ...form, topicsPerPage: value })}
                />
                <PageSizeSelect
                    label="Beiträge pro Seite"
                    value={form.postsPerPage}
                    onChange={(value) => setForm({ ...form, postsPerPage: value })}
                />
            </div>
            {message && <p className="mt-5 text-sm text-emerald-400">{message}</p>}
            {error && <p className="mt-5 text-sm text-red-300">{error}</p>}
            <div className="mt-7 flex justify-end">
                <button className="forum-button-primary" disabled={saving}>
                    <FaCheck /> {saving ? 'Speichert …' : 'Einstellungen speichern'}
                </button>
            </div>
        </form>
    );
}

function PreferenceToggle({ label, checked, onChange }) {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-5 rounded-2xl border border-white/[.06] bg-black/15 p-5 text-sm text-zinc-300">
            <span>{label}</span>
            <input
                className="h-5 w-5 shrink-0 accent-orange-500"
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
            />
        </label>
    );
}

function PageSizeSelect({ label, value, onChange }) {
    return (
        <label className="forum-label">
            {label}
            <select className="forum-input" value={value} onChange={(event) => onChange(Number(event.target.value))}>
                {[10, 20, 30, 50, 100].map((size) => (
                    <option value={size} key={size}>
                        {size}
                    </option>
                ))}
            </select>
        </label>
    );
}

function EmptyState({ icon: Icon, text }) {
    return (
        <div className="p-10 text-center">
            <Icon className="mx-auto text-3xl text-zinc-800" />
            <p className="mt-4 text-sm text-zinc-500">{text}</p>
        </div>
    );
}

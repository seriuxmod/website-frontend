import { useCallback, useEffect, useMemo, useState } from 'react';
import { FaArrowRight, FaBell, FaComments, FaGear, FaMagnifyingGlass, FaMessage, FaUserGroup } from 'react-icons/fa6';
import { Link, useSearchParams } from 'react-router-dom';
import { beginLogin, fetchAuthenticatedUser, getAuthenticatedUser, isForumAdministrator } from '../../lib/auth';
import { forumApi } from '../../lib/forumApi';
import {
    ForumError,
    ForumIcon,
    ForumLoading,
    ForumShell,
    TopicFlags,
    UserIdentity,
    formatDate
} from './ForumComponents';

export default function ForumIndex() {
    const [params, setParams] = useSearchParams();
    const search = params.get('search')?.trim() || '';
    const [query, setQuery] = useState(search);
    const [user, setUser] = useState(() => getAuthenticatedUser());
    const [state, setState] = useState({ loading: true, tree: [], latest: [], results: null, error: '' });

    const load = useCallback(async () => {
        setState((current) => ({ ...current, loading: true, error: '' }));
        try {
            if (search) {
                const results = await forumApi.search(search);
                setState({ loading: false, tree: [], latest: [], results, error: '' });
            } else {
                const [tree, latest] = await Promise.all([forumApi.tree(), forumApi.latest(0, 8)]);
                setState({
                    loading: false,
                    tree: tree.nodes ?? [],
                    latest: latest.items ?? [],
                    results: null,
                    error: ''
                });
            }
        } catch (error) {
            setState({ loading: false, tree: [], latest: [], results: null, error: error.message });
        }
    }, [search]);

    useEffect(() => {
        load();
    }, [load]);
    useEffect(() => {
        fetchAuthenticatedUser().then(setUser);
    }, []);
    useEffect(() => {
        setQuery(search);
    }, [search]);

    const categories = useMemo(() => {
        const categoryNodes = state.tree.filter((node) => node.type === 'CATEGORY');
        const forums = state.tree.filter((node) => node.type === 'FORUM');
        const result = categoryNodes.map((category) => ({
            ...category,
            forums: forums.filter((forum) => forum.parentId === category.id)
        }));
        const orphaned = forums.filter((forum) => !categoryNodes.some((category) => category.id === forum.parentId));
        if (orphaned.length) result.push({ id: 'other', title: 'Weitere Foren', description: '', forums: orphaned });
        return result.filter((category) => category.forums.length);
    }, [state.tree]);

    const submitSearch = (event) => {
        event.preventDefault();
        const value = query.trim();
        setParams(value ? { search: value } : {});
    };

    const actions = (
        <>
            {isForumAdministrator(user) && (
                <Link className="forum-button-secondary" to="/admin/forum">
                    <FaGear /> Administration
                </Link>
            )}
            {user && (
                <Link className="forum-button-secondary" to="/forum/account">
                    <FaBell /> Mein Forum
                </Link>
            )}
            {!user && (
                <button className="forum-button-primary" onClick={() => beginLogin('/forum')}>
                    <FaUserGroup /> Anmelden
                </button>
            )}
        </>
    );

    return (
        <ForumShell
            title={search ? `Suche: ${search}` : 'SeriuxMod Forum'}
            description="Neuigkeiten, Hilfe und Gespräche aus der gesamten SeriuxMod-Community. Lesen ist öffentlich, zum Schreiben meldest du dich mit deinem Minecraft-Konto an."
            actions={actions}
            showHero={false}
        >
            <h1 className="sr-only">SeriuxMod Forum</h1>
            <form onSubmit={submitSearch} className="forum-panel mb-7 flex h-14 items-center rounded-2xl px-5">
                <FaMagnifyingGlass className="text-zinc-600" />
                <input
                    className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-zinc-700"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Themen und Beiträge durchsuchen …"
                />
                <button className="forum-button-primary hidden py-2.5 sm:inline-flex" type="submit">
                    Suchen
                </button>
            </form>

            {state.loading && <ForumLoading />}
            {state.error && <ForumError message={state.error} retry={load} />}

            {!state.loading && !state.error && state.results && <SearchResults results={state.results} />}

            {!state.loading && !state.error && !state.results && (
                <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="space-y-7">
                        {categories.map((category) => (
                            <section className="forum-panel overflow-hidden rounded-3xl" key={category.id}>
                                <header className="border-b border-white/[.06] px-6 py-5 sm:px-7">
                                    <h2 className="font-display text-xl font-bold">{category.title}</h2>
                                    {category.description && (
                                        <p className="mt-1 text-xs text-zinc-600">{category.description}</p>
                                    )}
                                </header>
                                <div>
                                    {category.forums.map((forum) => (
                                        <Link className="forum-row group" key={forum.id} to={`/forum/${forum.id}`}>
                                            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-500/10 text-lg text-orange-400">
                                                <ForumIcon node={forum} />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <b className="font-display text-lg transition group-hover:text-orange-400">
                                                    {forum.title}
                                                </b>
                                                <span className="mt-1 block text-sm text-zinc-600">
                                                    {forum.description || 'Community-Forum'}
                                                </span>
                                            </span>
                                            <span className="hidden min-w-28 text-right text-xs text-zinc-600 md:block">
                                                <b className="block text-base text-zinc-300">{forum.topics}</b> Themen
                                            </span>
                                            <span className="hidden min-w-28 text-right text-xs text-zinc-600 md:block">
                                                <b className="block text-base text-zinc-300">{forum.posts}</b> Beiträge
                                            </span>
                                            <FaArrowRight className="text-zinc-700 transition group-hover:translate-x-1 group-hover:text-orange-400" />
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                    <aside className="space-y-6">
                        <section className="forum-panel overflow-hidden rounded-3xl">
                            <header className="border-b border-white/[.06] p-6">
                                <h2 className="font-display text-lg font-bold">Aktuelle Themen</h2>
                            </header>
                            {state.latest.map((topic) => (
                                <Link
                                    className="block border-b border-white/[.055] p-5 transition last:border-0 hover:bg-white/[.025]"
                                    key={topic.id}
                                    to={`/forum/topic/${topic.id}`}
                                >
                                    <TopicFlags topic={topic} />
                                    <b className="mt-2 block text-sm leading-6 text-zinc-200">{topic.title}</b>
                                    <span className="mt-2 block text-[11px] text-zinc-600">
                                        {formatDate(topic.lastReplyAt || topic.createdAt)}
                                    </span>
                                </Link>
                            ))}
                        </section>
                        <section className="forum-panel rounded-3xl p-6">
                            <p className="text-xs font-bold uppercase tracking-[.16em] text-zinc-600">
                                Community-Statistik
                            </p>
                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <Stat
                                    icon={FaComments}
                                    label="Themen"
                                    value={state.tree
                                        .filter((node) => node.type === 'FORUM')
                                        .reduce((sum, node) => sum + node.topics, 0)}
                                />
                                <Stat
                                    icon={FaMessage}
                                    label="Beiträge"
                                    value={state.tree
                                        .filter((node) => node.type === 'FORUM')
                                        .reduce((sum, node) => sum + node.posts, 0)}
                                />
                            </div>
                        </section>
                    </aside>
                </div>
            )}
        </ForumShell>
    );
}

function Stat({ icon: Icon, label, value }) {
    return (
        <div className="rounded-2xl border border-white/[.06] bg-black/20 p-4">
            <Icon className="text-orange-400" />
            <b className="mt-3 block font-display text-2xl">{value}</b>
            <span className="text-[11px] text-zinc-600">{label}</span>
        </div>
    );
}

function SearchResults({ results }) {
    const topics = results.topics ?? [];
    const posts = results.posts ?? [];
    if (!topics.length && !posts.length)
        return (
            <div className="forum-panel rounded-3xl p-8 text-sm text-zinc-500">Keine passenden Inhalte gefunden.</div>
        );
    return (
        <div className="grid gap-7 lg:grid-cols-2">
            <section className="forum-panel overflow-hidden rounded-3xl">
                <header className="border-b border-white/[.06] p-6">
                    <h2 className="font-display text-xl font-bold">Themen</h2>
                </header>
                {topics.map((topic) => (
                    <Link
                        className="block border-b border-white/[.05] p-5 last:border-0 hover:bg-white/[.025]"
                        key={topic.id}
                        to={`/forum/topic/${topic.id}`}
                    >
                        <TopicFlags topic={topic} />
                        <b className="mt-2 block">{topic.title}</b>
                        <span className="mt-2 block text-xs text-zinc-600">
                            {topic.posts} Beiträge · {topic.views} Aufrufe
                        </span>
                    </Link>
                ))}
            </section>
            <section className="forum-panel overflow-hidden rounded-3xl">
                <header className="border-b border-white/[.06] p-6">
                    <h2 className="font-display text-xl font-bold">Beiträge</h2>
                </header>
                {posts.map((post) => (
                    <Link
                        className="block border-b border-white/[.05] p-5 last:border-0 hover:bg-white/[.025]"
                        key={post.id}
                        to={`/forum/topic/${post.topicId}`}
                    >
                        <UserIdentity playerId={post.creatorUserId} compact />
                        <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-zinc-500">
                            {post.content}
                        </p>
                    </Link>
                ))}
            </section>
        </div>
    );
}

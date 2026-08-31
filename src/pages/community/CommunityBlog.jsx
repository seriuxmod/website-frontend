import { useEffect, useState } from 'react';
import { FaArrowLeft, FaNewspaper } from 'react-icons/fa6';
import { Link, useParams } from 'react-router-dom';
import { blogApi } from '../../lib/communityApi';
import { ForumError, ForumLoading, UserIdentity, formatDate } from '../forum/ForumComponents';

export default function CommunityBlog() {
    const { slug } = useParams();
    return slug ? <BlogArticle slug={slug} /> : <BlogOverview />;
}

function BlogOverview() {
    const [query, setQuery] = useState('');
    const [search, setSearch] = useState('');
    const [state, setState] = useState({ loading: true, data: null, error: '' });

    useEffect(() => {
        let active = true;
        setState((current) => ({ ...current, loading: true, error: '' }));
        blogApi
            .list({ size: 30, query: search })
            .then((data) => active && setState({ loading: false, data, error: '' }))
            .catch((error) => active && setState({ loading: false, data: null, error: error.message }));
        return () => {
            active = false;
        };
    }, [search]);

    return (
        <main className="min-h-[80vh] px-5 pb-24 pt-36 text-white sm:pt-44 lg:px-10">
            <section className="mx-auto max-w-6xl">
                <p className="eyebrow">SERIUXMOD NEWS</p>
                <div className="mt-3 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                    <div>
                        <h1 className="font-display text-4xl font-bold sm:text-6xl">Blog & Updates</h1>
                        <p className="mt-4 max-w-2xl text-zinc-500">Release Notes, Entwicklungsstände und Neuigkeiten direkt vom Team.</p>
                    </div>
                    <form
                        className="flex w-full max-w-md gap-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            if (!query || query.trim().length >= 2) setSearch(query.trim());
                        }}
                    >
                        <input className="forum-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Beiträge suchen …" />
                        <button className="forum-button-primary">Suchen</button>
                    </form>
                </div>

                <div className="mt-10">
                    {state.loading && <ForumLoading label="Beiträge werden geladen …" />}
                    {state.error && <ForumError message={state.error} />}
                    {!state.loading && !state.error && !(state.data?.items?.length > 0) && (
                        <div className="forum-panel rounded-3xl p-12 text-center text-zinc-500">Noch keine veröffentlichten Beiträge.</div>
                    )}
                    <div className="grid gap-5 md:grid-cols-2">
                        {(state.data?.items ?? []).map((post) => (
                            <Link className="forum-panel group overflow-hidden rounded-3xl" key={post.id} to={`/community/blog/${post.slug}`}>
                                {post.thumbnailUrl ? (
                                    <img className="h-52 w-full object-cover opacity-80 transition group-hover:opacity-100" src={post.thumbnailUrl} alt="" />
                                ) : (
                                    <div className="grid h-40 place-items-center bg-orange-500/[.06] text-4xl text-orange-400"><FaNewspaper /></div>
                                )}
                                <div className="p-7">
                                    <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider text-orange-300">
                                        {(post.categories ?? []).map((category) => <span key={category}>{category}</span>)}
                                    </div>
                                    <h2 className="mt-3 font-display text-2xl font-bold group-hover:text-orange-300">{post.title}</h2>
                                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-500">{post.excerpt || post.content}</p>
                                    <p className="mt-6 text-xs text-zinc-700">{formatDate(post.publishedAt || post.createdAt)}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}

function BlogArticle({ slug }) {
    const [state, setState] = useState({ loading: true, post: null, error: '' });
    useEffect(() => {
        blogApi
            .bySlug(slug)
            .then((post) => setState({ loading: false, post, error: '' }))
            .catch((error) => setState({ loading: false, post: null, error: error.message }));
    }, [slug]);
    return (
        <main className="min-h-[80vh] px-5 pb-24 pt-36 text-white sm:pt-44 lg:px-10">
            <article className="mx-auto max-w-4xl">
                <Link className="forum-button-secondary" to="/community/blog"><FaArrowLeft /> Alle Beiträge</Link>
                {state.loading && <div className="mt-10"><ForumLoading /></div>}
                {state.error && <div className="mt-10"><ForumError message={state.error} /></div>}
                {state.post && (
                    <>
                        {state.post.thumbnailUrl && <img className="mt-8 max-h-[460px] w-full rounded-[32px] object-cover" src={state.post.thumbnailUrl} alt="" />}
                        <p className="eyebrow mt-10">SERIUXMOD NEWS</p>
                        <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-6xl">{state.post.title}</h1>
                        <div className="mt-6 flex flex-wrap items-center gap-5 text-xs text-zinc-600">
                            <UserIdentity playerId={state.post.authorUserId} compact linked />
                            <span>{formatDate(state.post.publishedAt || state.post.createdAt)}</span>
                        </div>
                        {state.post.excerpt && <p className="mt-10 text-xl leading-8 text-zinc-400">{state.post.excerpt}</p>}
                        <div className="forum-panel mt-8 whitespace-pre-wrap rounded-3xl p-7 text-[15px] leading-8 text-zinc-300 sm:p-10">{state.post.content}</div>
                    </>
                )}
            </article>
        </main>
    );
}

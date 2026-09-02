import { useEffect, useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa6';
import { Link, Navigate, useParams } from 'react-router-dom';
import { blogApi } from '../../lib/communityApi';
import { ForumError, ForumLoading, UserIdentity, formatDate } from '../forum/ForumComponents';

export default function CommunityBlog() {
    const { slug } = useParams();
    return slug ? <BlogArticle slug={slug} /> : <Navigate to="/#blog" replace />;
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
                <Link className="forum-button-secondary" to="/#blog">
                    <FaArrowLeft /> Alle Beiträge
                </Link>
                {state.loading && (
                    <div className="mt-10">
                        <ForumLoading />
                    </div>
                )}
                {state.error && (
                    <div className="mt-10">
                        <ForumError message={state.error} />
                    </div>
                )}
                {state.post && (
                    <>
                        {state.post.thumbnailUrl && (
                            <img
                                className="mt-8 max-h-[460px] w-full rounded-[32px] object-cover"
                                src={state.post.thumbnailUrl}
                                alt=""
                            />
                        )}
                        <p className="eyebrow mt-10">SERIUXMOD NEWS</p>
                        <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-6xl">
                            {state.post.title}
                        </h1>
                        <div className="mt-6 flex flex-wrap items-center gap-5 text-xs text-zinc-600">
                            <UserIdentity playerId={state.post.authorUserId} compact linked />
                            <span>{formatDate(state.post.publishedAt || state.post.createdAt)}</span>
                        </div>
                        {state.post.excerpt && (
                            <p className="mt-10 text-xl leading-8 text-zinc-400">{state.post.excerpt}</p>
                        )}
                        <div className="forum-panel mt-8 whitespace-pre-wrap rounded-3xl p-7 text-[15px] leading-8 text-zinc-300 sm:p-10">
                            {state.post.content}
                        </div>
                    </>
                )}
            </article>
        </main>
    );
}

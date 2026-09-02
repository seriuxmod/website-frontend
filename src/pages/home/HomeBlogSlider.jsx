import { useEffect, useMemo, useRef, useState } from 'react';
import { FaArrowLeft, FaArrowRight, FaNewspaper } from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import { blogApi } from '../../lib/communityApi';
import { playerAvatar, userApi } from '../../lib/userApi';

const SLIDE_DURATION = 8000;

function rankColor(color) {
    if (!Number.isFinite(color)) return '#f97316';
    return `#${((color >>> 0) & 0xffffff).toString(16).padStart(6, '0')}`;
}

function formatDate(value) {
    if (!value) return '';
    return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }).format(new Date(value));
}

export default function HomeBlogSlider() {
    const [state, setState] = useState({ loading: true, posts: [], authors: new Map(), error: false });
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const touchStart = useRef(null);

    useEffect(() => {
        let current = true;
        blogApi
            .list({ size: 12 })
            .then(async (data) => {
                const posts = data.items ?? [];
                const authorIds = [...new Set(posts.map((post) => post.authorUserId).filter(Boolean))];
                const authors = await userApi.batch(authorIds).catch(() => []);
                if (current) {
                    setState({
                        loading: false,
                        posts,
                        authors: new Map(authors.map((author) => [author.playerId, author])),
                        error: false
                    });
                }
            })
            .catch(() => current && setState({ loading: false, posts: [], authors: new Map(), error: true }));
        return () => {
            current = false;
        };
    }, []);

    useEffect(() => {
        if (state.posts.length < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return undefined;
        }
        const timer = window.setInterval(() => setActive((index) => (index + 1) % state.posts.length), SLIDE_DURATION);
        return () => window.clearInterval(timer);
    }, [paused, state.posts.length]);

    useEffect(() => {
        if (active >= state.posts.length) setActive(0);
    }, [active, state.posts.length]);

    const slides = useMemo(
        () =>
            state.posts.map((post) => ({
                ...post,
                author: state.authors.get(post.authorUserId)
            })),
        [state.authors, state.posts]
    );

    const move = (direction) => {
        if (slides.length < 2) return;
        setActive((index) => (index + direction + slides.length) % slides.length);
    };

    if (!state.loading && (state.error || slides.length === 0)) return null;

    return (
        <section id="blog" className="px-5 pb-24 lg:px-10 lg:pb-32" aria-labelledby="blog-heading">
            <div className="mx-auto max-w-7xl">
                <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                    <div className="max-w-2xl">
                        <p className="eyebrow">SERIUXMOD NEWS</p>
                        <h2 id="blog-heading" className="section-title">
                            Neues aus unserer Welt.
                        </h2>
                        <p className="section-copy">
                            Updates, Einblicke und Release Notes direkt aus dem SeriuxMod-Team.
                        </p>
                    </div>
                    {slides.length > 1 && (
                        <div className="flex gap-2">
                            <button
                                className="home-blog-control"
                                type="button"
                                onClick={() => move(-1)}
                                aria-label="Vorheriger Beitrag"
                            >
                                <FaArrowLeft />
                            </button>
                            <button
                                className="home-blog-control"
                                type="button"
                                onClick={() => move(1)}
                                aria-label="Nächster Beitrag"
                            >
                                <FaArrowRight />
                            </button>
                        </div>
                    )}
                </div>

                {state.loading ? (
                    <div className="mt-12 h-[520px] animate-pulse rounded-[32px] border border-white/[.07] bg-white/[.035]" />
                ) : (
                    <div
                        className="mt-12"
                        role="region"
                        aria-roledescription="Karussell"
                        aria-label="Aktuelle Blogbeiträge"
                        onMouseEnter={() => setPaused(true)}
                        onMouseLeave={() => setPaused(false)}
                        onFocusCapture={() => setPaused(true)}
                        onBlurCapture={(event) => {
                            if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
                        }}
                        onTouchStart={(event) => {
                            touchStart.current = event.touches[0]?.clientX ?? null;
                        }}
                        onTouchEnd={(event) => {
                            if (touchStart.current == null) return;
                            const distance =
                                (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
                            if (Math.abs(distance) > 45) move(distance > 0 ? -1 : 1);
                            touchStart.current = null;
                        }}
                    >
                        <div className="overflow-hidden rounded-[32px]">
                            <div
                                className="flex transition-transform duration-700 ease-[cubic-bezier(.22,.8,.26,1)] motion-reduce:transition-none"
                                style={{ transform: `translateX(-${active * 100}%)` }}
                            >
                                {slides.map((post, index) => {
                                    const authorColor = rankColor(post.author?.rank?.color);
                                    return (
                                        <article
                                            key={post.id}
                                            className="group relative min-w-full overflow-hidden rounded-[32px] border border-white/[.08] bg-[#111218]"
                                            aria-hidden={active !== index}
                                        >
                                            <div className="relative h-[500px] sm:h-[560px]">
                                                {post.thumbnailUrl ? (
                                                    <img
                                                        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
                                                        src={post.thumbnailUrl}
                                                        alt=""
                                                        loading={index === 0 ? 'eager' : 'lazy'}
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-orange-950/30 to-[#111218] text-7xl text-orange-500/40">
                                                        <FaNewspaper />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#090a0d] via-[#090a0d]/65 to-transparent" />
                                                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 lg:p-12">
                                                    <div className="flex flex-wrap gap-2">
                                                        {(post.categories ?? []).map((category) => (
                                                            <span
                                                                className="rounded-full border border-orange-400/25 bg-orange-500/15 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.14em] text-orange-300 backdrop-blur-xl"
                                                                key={category}
                                                            >
                                                                {category}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <Link
                                                        to={`/community/blog/${post.slug}`}
                                                        tabIndex={active === index ? 0 : -1}
                                                    >
                                                        <h3 className="mt-4 max-w-4xl font-display text-3xl font-bold leading-tight tracking-tight text-white transition hover:text-orange-300 sm:text-5xl">
                                                            {post.title}
                                                        </h3>
                                                    </Link>
                                                    <p className="mt-4 line-clamp-2 max-w-3xl text-sm leading-7 text-zinc-300 sm:text-base">
                                                        {post.excerpt || post.content}
                                                    </p>
                                                    <div className="mt-7 flex flex-wrap items-center justify-between gap-5">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                className="h-11 w-11 rounded-xl border bg-black/30 [image-rendering:pixelated]"
                                                                style={{ borderColor: `${authorColor}70` }}
                                                                src={playerAvatar(post.authorUserId, 64)}
                                                                alt=""
                                                            />
                                                            <div>
                                                                {post.author?.username ? (
                                                                    <Link
                                                                        to={`/@${encodeURIComponent(post.author.username)}`}
                                                                        className="block text-sm font-extrabold transition hover:opacity-75"
                                                                        style={{ color: authorColor }}
                                                                        tabIndex={active === index ? 0 : -1}
                                                                    >
                                                                        {post.author.username}
                                                                    </Link>
                                                                ) : (
                                                                    <span
                                                                        className="block text-sm font-extrabold"
                                                                        style={{ color: authorColor }}
                                                                    >
                                                                        SeriuxMod Team
                                                                    </span>
                                                                )}
                                                                <span className="mt-0.5 block text-[10px] font-bold text-zinc-400">
                                                                    {post.author?.rank?.displayName || 'Team'} ·{' '}
                                                                    {formatDate(post.publishedAt || post.createdAt)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Link
                                                            to={`/community/blog/${post.slug}`}
                                                            className="inline-flex items-center gap-2 text-xs font-extrabold text-white transition hover:text-orange-300"
                                                            tabIndex={active === index ? 0 : -1}
                                                        >
                                                            Beitrag lesen <FaArrowRight />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-5 flex items-center gap-3 overflow-x-auto pb-2">
                            {slides.map((post, index) => (
                                <button
                                    key={post.id}
                                    type="button"
                                    className={`home-blog-thumbnail ${active === index ? 'home-blog-thumbnail-active' : ''}`}
                                    onClick={() => setActive(index)}
                                    aria-label={`Beitrag ${index + 1}: ${post.title}`}
                                    aria-current={active === index ? 'true' : undefined}
                                >
                                    {post.thumbnailUrl && <img src={post.thumbnailUrl} alt="" loading="lazy" />}
                                    <span>{post.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { FaArrowRight, FaNewspaper } from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import { blogApi } from '../../lib/communityApi';
import { playerAvatar, userApi } from '../../lib/userApi';

const SLIDE_DURATION = 20000;

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

function slideOffset(index, active, length) {
    let offset = index - active;
    if (offset > length / 2) offset -= length;
    if (offset < -length / 2) offset += length;
    return offset;
}

export default function HomeBlogSlider() {
    const [state, setState] = useState({ loading: true, posts: [], authors: new Map(), error: false });
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const touchStart = useRef(null);
    const remainingTime = useRef(SLIDE_DURATION);
    const timerStartedAt = useRef(null);
    const timerResetPending = useRef(false);

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
        timerResetPending.current = false;
        timerStartedAt.current = window.performance.now();
        const timer = window.setTimeout(() => {
            remainingTime.current = SLIDE_DURATION;
            timerResetPending.current = true;
            setActive((index) => (index + 1) % state.posts.length);
        }, remainingTime.current);
        return () => {
            window.clearTimeout(timer);
            if (timerResetPending.current) {
                timerResetPending.current = false;
            } else if (timerStartedAt.current != null) {
                remainingTime.current = Math.max(
                    0,
                    remainingTime.current - (window.performance.now() - timerStartedAt.current)
                );
            }
            timerStartedAt.current = null;
        };
    }, [active, paused, state.posts.length]);

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
        remainingTime.current = SLIDE_DURATION;
        timerResetPending.current = true;
        setActive((index) => (index + direction + slides.length) % slides.length);
    };

    const selectSlide = (index) => {
        if (index === active) return;
        remainingTime.current = SLIDE_DURATION;
        timerResetPending.current = true;
        setActive(index);
    };

    if (!state.loading && (state.error || slides.length === 0)) return null;

    return (
        <section id="blog" className="home-news-section px-5 py-24 lg:px-10 lg:py-32" aria-labelledby="blog-heading">
            <div className="mx-auto max-w-7xl">
                <div className="max-w-2xl">
                    <p className="eyebrow">SERIUXMOD NEWS</p>
                    <h2 id="blog-heading" className="section-title">
                        Neues aus unserer Welt.
                    </h2>
                    <p className="section-copy">Updates, Einblicke und Release Notes direkt aus dem SeriuxMod-Team.</p>
                </div>

                {state.loading ? (
                    <div className="home-news-loading mt-12 h-[520px] animate-pulse rounded-[32px]" />
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
                        <div className="home-blog-coverflow">
                            {slides.map((post, index) => {
                                const authorColor = rankColor(post.author?.rank?.color);
                                const offset = slideOffset(index, active, slides.length);
                                const position =
                                    Math.abs(offset) > 2
                                        ? 'hidden'
                                        : offset < 0
                                          ? `minus-${Math.abs(offset)}`
                                          : `plus-${offset}`;
                                const isActive = index === active;
                                return (
                                    <article
                                        key={post.id}
                                        className={`home-blog-coverflow-slide home-blog-coverflow-${position} group overflow-hidden rounded-[32px] border border-white/[.08] bg-[#111218]`}
                                        aria-hidden={!isActive}
                                    >
                                        <div className="relative h-full">
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
                                            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9 lg:p-11">
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
                                                <Link to={`/community/blog/${post.slug}`} tabIndex={isActive ? 0 : -1}>
                                                    <h3 className="mt-4 max-w-4xl font-display text-3xl font-bold leading-tight tracking-tight text-white transition hover:text-orange-300 sm:text-5xl">
                                                        {post.title}
                                                    </h3>
                                                </Link>
                                                <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-7 text-zinc-300 sm:text-base">
                                                    {post.excerpt || post.content}
                                                </p>
                                                <div className="mt-6 flex flex-wrap items-center justify-between gap-5">
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
                                                                    tabIndex={isActive ? 0 : -1}
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
                                                        tabIndex={isActive ? 0 : -1}
                                                    >
                                                        Beitrag lesen <FaArrowRight />
                                                    </Link>
                                                </div>
                                            </div>
                                            {!isActive && (
                                                <button
                                                    type="button"
                                                    className="absolute inset-0 z-20 cursor-pointer"
                                                    onClick={() => selectSlide(index)}
                                                    aria-label={`${post.title} in den Vordergrund holen`}
                                                    tabIndex={-1}
                                                />
                                            )}
                                            {isActive && slides.length > 1 && (
                                                <div className="home-blog-progress-track" aria-hidden="true">
                                                    <span
                                                        key={active}
                                                        className={`home-blog-progress-bar ${paused ? 'home-blog-progress-bar-paused' : ''}`}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>

                        {slides.length > 1 && (
                            <div className="mt-3 flex justify-center gap-2" aria-label="Beitragsauswahl">
                                {slides.map((post, index) => (
                                    <button
                                        key={post.id}
                                        type="button"
                                        className={`h-2 rounded-full transition-all ${active === index ? 'w-8 bg-orange-500' : 'w-2 bg-[#2f2118]/15 hover:bg-[#2f2118]/30'}`}
                                        onClick={() => selectSlide(index)}
                                        aria-label={`Beitrag ${index + 1}: ${post.title}`}
                                        aria-current={active === index ? 'true' : undefined}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}

import { useCallback, useEffect, useState } from 'react';
import { FaArrowLeft, FaLightbulb, FaThumbsDown, FaThumbsUp } from 'react-icons/fa6';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { beginLogin, fetchAuthenticatedUser, getAuthenticatedUser } from '../../lib/auth';
import { suggestionsApi } from '../../lib/communityApi';
import { ForumError, ForumLoading, UserIdentity, formatDate } from '../forum/ForumComponents';

export default function CommunityFeedback() {
    const { suggestionId } = useParams();
    return suggestionId ? <SuggestionDetail id={suggestionId} /> : <SuggestionOverview />;
}

function SuggestionOverview() {
    const navigate = useNavigate();
    const [user, setUser] = useState(() => getAuthenticatedUser());
    const [openForm, setOpenForm] = useState(false);
    const [form, setForm] = useState({ categoryId: '', title: '', content: '' });
    const [saving, setSaving] = useState(false);
    const [state, setState] = useState({ loading: true, items: [], categories: [], error: '' });

    const load = useCallback(async () => {
        try {
            const [suggestions, categories] = await Promise.all([suggestionsApi.list(), suggestionsApi.categories()]);
            setState({ loading: false, items: suggestions.suggestions ?? [], categories: categories.categories ?? [], error: '' });
        } catch (error) {
            setState({ loading: false, items: [], categories: [], error: error.message });
        }
    }, []);

    useEffect(() => {
        load();
        fetchAuthenticatedUser().then(setUser);
    }, [load]);

    const create = async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
            const created = await suggestionsApi.create({ ...form, categoryId: form.categoryId || null });
            navigate(`/community/feedback/${created.id}`);
        } catch (error) {
            setState((current) => ({ ...current, error: error.message }));
            setSaving(false);
        }
    };

    return (
        <main className="min-h-[80vh] px-5 pb-24 pt-36 text-white sm:pt-44 lg:px-10">
            <section className="mx-auto max-w-6xl">
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                    <div>
                        <p className="eyebrow">COMMUNITY FEEDBACK</p>
                        <h1 className="mt-3 font-display text-4xl font-bold sm:text-6xl">Ideen für SeriuxMod</h1>
                        <p className="mt-4 max-w-2xl text-zinc-500">Schlage Funktionen vor, stimme gemeinsam ab und verfolge den Bearbeitungsstand.</p>
                    </div>
                    <button
                        className="forum-button-primary"
                        onClick={() => (user ? setOpenForm((current) => !current) : beginLogin('/community/feedback'))}
                    >
                        <FaLightbulb /> Vorschlag einreichen
                    </button>
                </div>

                {state.error && <div className="mt-7"><ForumError message={state.error} retry={load} /></div>}
                {openForm && (
                    <form className="forum-panel mt-8 rounded-3xl p-7" onSubmit={create}>
                        <h2 className="font-display text-2xl font-bold">Neuer Vorschlag</h2>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <label className="forum-label">Kategorie<select className="forum-input" value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}><option value="">Allgemein</option>{state.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                            <label className="forum-label">Titel<input className="forum-input" required minLength={6} maxLength={128} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
                        </div>
                        <label className="forum-label mt-4">Beschreibung<textarea className="forum-input min-h-40 resize-y" required minLength={6} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} /></label>
                        <div className="mt-5 flex justify-end"><button className="forum-button-primary" disabled={saving}>{saving ? 'Wird erstellt …' : 'Einreichen'}</button></div>
                    </form>
                )}

                {state.loading && <div className="mt-10"><ForumLoading /></div>}
                {!state.loading && !state.error && (
                    <section className="forum-panel mt-8 overflow-hidden rounded-3xl">
                        {state.items.length === 0 && <p className="p-12 text-center text-zinc-500">Noch keine offenen Vorschläge.</p>}
                        {state.items.map((item) => (
                            <Link className="forum-row group" key={item.id} to={`/community/feedback/${item.id}`}>
                                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-500/10 text-orange-300"><FaLightbulb /></span>
                                <span className="min-w-0 flex-1"><b className="block truncate font-display text-lg group-hover:text-orange-300">{item.title}</b><small className="mt-1 block text-zinc-600">{item.status?.name || 'Offen'}</small></span>
                                <span className="text-sm text-zinc-600">Öffnen →</span>
                            </Link>
                        ))}
                    </section>
                )}
            </section>
        </main>
    );
}

function SuggestionDetail({ id }) {
    const [user, setUser] = useState(() => getAuthenticatedUser());
    const [comment, setComment] = useState('');
    const [state, setState] = useState({ loading: true, suggestion: null, comments: [], error: '' });
    const load = useCallback(async () => {
        try {
            const [suggestion, comments] = await Promise.all([suggestionsApi.get(id), suggestionsApi.comments(id)]);
            setState({ loading: false, suggestion, comments: comments.comments ?? [], error: '' });
        } catch (error) {
            setState({ loading: false, suggestion: null, comments: [], error: error.message });
        }
    }, [id]);
    useEffect(() => {
        load();
        fetchAuthenticatedUser().then(setUser);
    }, [load]);
    const vote = async (type) => {
        if (!user) return beginLogin(`/community/feedback/${id}`);
        try {
            await suggestionsApi.vote(id, type);
            await load();
        } catch (error) {
            setState((current) => ({ ...current, error: error.message }));
        }
    };
    const submitComment = async (event) => {
        event.preventDefault();
        if (!user) return beginLogin(`/community/feedback/${id}`);
        try {
            await suggestionsApi.comment(id, comment);
            setComment('');
            await load();
        } catch (error) {
            setState((current) => ({ ...current, error: error.message }));
        }
    };
    return (
        <main className="min-h-[80vh] px-5 pb-24 pt-36 text-white sm:pt-44 lg:px-10">
            <section className="mx-auto max-w-5xl">
                <Link className="forum-button-secondary" to="/community/feedback"><FaArrowLeft /> Alle Vorschläge</Link>
                {state.loading && <div className="mt-10"><ForumLoading /></div>}
                {state.error && <div className="mt-8"><ForumError message={state.error} retry={load} /></div>}
                {state.suggestion && (
                    <>
                        <article className="forum-panel mt-8 rounded-3xl p-7 sm:p-10">
                            <div className="flex flex-wrap items-center justify-between gap-4"><span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">{state.suggestion.status?.name}</span><span className="text-xs text-zinc-600">{state.suggestion.category?.name}</span></div>
                            <h1 className="mt-6 font-display text-3xl font-bold sm:text-5xl">{state.suggestion.title}</h1>
                            <div className="mt-5 flex items-center gap-4"><UserIdentity playerId={state.suggestion.author?.id} compact linked /><span className="text-xs text-zinc-600">{formatDate(state.suggestion.created)}</span></div>
                            <p className="mt-8 whitespace-pre-wrap text-[15px] leading-8 text-zinc-300">{state.suggestion.content}</p>
                            <div className="mt-8 flex gap-3 border-t border-white/[.06] pt-5"><button className="forum-action" onClick={() => vote('like')}><FaThumbsUp /> {state.suggestion.likesCount}</button><button className="forum-action" onClick={() => vote('dislike')}><FaThumbsDown /> {state.suggestion.dislikesCount}</button><span className="ml-auto text-xs text-zinc-600">{state.suggestion.views} Aufrufe</span></div>
                        </article>
                        <section className="mt-7 space-y-3">
                            <h2 className="font-display text-2xl font-bold">Diskussion</h2>
                            {state.comments.map((entry) => <article className="forum-panel rounded-2xl p-5" key={entry.id}><div className="flex items-center justify-between gap-4"><UserIdentity playerId={entry.user?.id} compact linked /><span className="text-xs text-zinc-700">{formatDate(entry.created)}</span></div><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-400">{entry.content}</p></article>)}
                            <form className="forum-panel rounded-2xl p-5" onSubmit={submitComment}><textarea className="forum-input min-h-28 resize-y" required value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Antwort verfassen …" /><div className="mt-3 flex justify-end"><button className="forum-button-primary">Kommentieren</button></div></form>
                        </section>
                    </>
                )}
            </section>
        </main>
    );
}

import { useCallback, useEffect, useState } from 'react';
import { FaCheck, FaFloppyDisk, FaPlus, FaTrash } from 'react-icons/fa6';
import { blogApi, suggestionsApi } from '../../lib/communityApi';
import { ForumError, ForumLoading, formatDate } from './ForumComponents';

const emptyPost = {
    id: '',
    slug: '',
    title: '',
    excerpt: '',
    content: '',
    thumbnailUrl: '',
    categories: [],
    tags: [],
    status: 'DRAFT'
};

export function BlogAdmin() {
    const [posts, setPosts] = useState([]);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState(emptyPost);
    const [state, setState] = useState({ loading: true, saving: false, error: '' });
    const load = useCallback(async () => {
        try {
            const response = await blogApi.list({ size: 100 });
            setPosts(response.items ?? []);
            setState({ loading: false, saving: false, error: '' });
        } catch (error) {
            setState({ loading: false, saving: false, error: error.message });
        }
    }, []);
    useEffect(() => { load(); }, [load]);
    const choose = (post) => {
        setSelected(post);
        setForm(post ? { ...post } : emptyPost);
    };
    const save = async (event) => {
        event.preventDefault();
        setState((current) => ({ ...current, saving: true, error: '' }));
        const body = {
            slug: form.slug.trim().toLowerCase(),
            title: form.title.trim(),
            excerpt: form.excerpt?.trim() || null,
            content: form.content,
            thumbnailUrl: form.thumbnailUrl?.trim() || null,
            status: form.status,
            categories: form.categories,
            tags: form.tags
        };
        try {
            if (selected) await blogApi.update(selected.id, body);
            else await blogApi.create(body);
            choose(null);
            await load();
        } catch (error) {
            setState((current) => ({ ...current, saving: false, error: error.message }));
        }
    };
    const action = async (callback) => {
        try { await callback(); choose(null); await load(); }
        catch (error) { setState((current) => ({ ...current, error: error.message })); }
    };
    if (state.loading) return <ForumLoading label="Blog wird geladen …" />;
    return (
        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
            <section className="forum-panel overflow-hidden rounded-3xl">
                <header className="flex items-center justify-between border-b border-white/[.06] p-5"><div><p className="eyebrow">NEWS</p><h2 className="mt-1 font-display text-xl font-bold">Blogbeiträge</h2></div><button className="forum-icon-button" onClick={() => choose(null)} title="Neu"><FaPlus /></button></header>
                <div className="max-h-[680px] overflow-y-auto">
                    {posts.map((post) => <button className={`block w-full border-b border-white/[.05] p-5 text-left last:border-0 ${selected?.id === post.id ? 'bg-orange-500/[.07]' : 'hover:bg-white/[.025]'}`} key={post.id} onClick={() => choose(post)}><b className="block truncate text-sm">{post.title}</b><span className="mt-1 block text-[11px] text-zinc-600">{post.status} · {formatDate(post.updatedAt || post.createdAt)}</span></button>)}
                    {posts.length === 0 && <p className="p-7 text-sm text-zinc-600">Noch keine Beiträge.</p>}
                </div>
            </section>
            <form className="forum-panel rounded-3xl p-6 sm:p-8" onSubmit={save}>
                <p className="eyebrow">{selected ? 'BEITRAG BEARBEITEN' : 'NEUER BEITRAG'}</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="forum-label">Titel<input className="forum-input" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label className="forum-label">Slug<input className="forum-input" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label></div>
                <label className="forum-label mt-4">Kurzbeschreibung<textarea className="forum-input min-h-24" value={form.excerpt || ''} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} /></label>
                <label className="forum-label mt-4">Inhalt<textarea className="forum-input min-h-64 resize-y" required value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} /></label>
                <label className="forum-label mt-4">Titelbild (HTTPS)<input className="forum-input" type="url" value={form.thumbnailUrl || ''} onChange={(event) => setForm({ ...form, thumbnailUrl: event.target.value })} /></label>
                <div className="mt-4 grid gap-4 sm:grid-cols-3"><CsvField label="Kategorien" value={form.categories} onChange={(categories) => setForm({ ...form, categories })} /><CsvField label="Tags" value={form.tags} onChange={(tags) => setForm({ ...form, tags })} /><label className="forum-label">Status<select className="forum-input" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="DRAFT">Entwurf</option><option value="PUBLISHED">Veröffentlicht</option></select></label></div>
                {state.error && <div className="mt-5"><ForumError message={state.error} /></div>}
                <div className="mt-6 flex flex-wrap justify-end gap-2">
                    {selected && <><button type="button" className="forum-button-secondary" onClick={() => action(() => selected.status === 'PUBLISHED' ? blogApi.unpublish(selected.id) : blogApi.publish(selected.id))}><FaCheck /> {selected.status === 'PUBLISHED' ? 'Zurückziehen' : 'Veröffentlichen'}</button><button type="button" className="forum-button-secondary text-red-300" onClick={() => window.confirm('Blogbeitrag löschen?') && action(() => blogApi.remove(selected.id))}><FaTrash /> Löschen</button></>}
                    <button className="forum-button-primary" disabled={state.saving}><FaFloppyDisk /> {state.saving ? 'Speichert …' : 'Speichern'}</button>
                </div>
            </form>
        </div>
    );
}

function CsvField({ label, value, onChange }) {
    return <label className="forum-label">{label}<input className="forum-input" value={(value ?? []).join(', ')} onChange={(event) => onChange(event.target.value.split(',').map((entry) => entry.trim()).filter(Boolean))} /></label>;
}

export function SuggestionAdmin() {
    const [data, setData] = useState({ suggestions: [], categories: [], statuses: [] });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => {
        try {
            const [suggestions, categories, statuses] = await Promise.all([suggestionsApi.admin.list(), suggestionsApi.admin.categories(), suggestionsApi.admin.statuses()]);
            setData({ suggestions, categories, statuses }); setError(''); setLoading(false);
        } catch (reason) { setError(reason.message); setLoading(false); }
    }, []);
    useEffect(() => { load(); }, [load]);
    const patch = async (id, body) => { try { await suggestionsApi.admin.patch(id, body); await load(); } catch (reason) { setError(reason.message); } };
    const createCategory = async () => {
        const name = window.prompt('Name der neuen Feedback-Kategorie');
        if (!name?.trim()) return;
        try { await suggestionsApi.admin.saveCategory('new', { name: name.trim(), displayOrder: data.categories.length * 10, deleted: false }); await load(); } catch (reason) { setError(reason.message); }
    };
    const createStatus = async () => {
        const name = window.prompt('Name des neuen Bearbeitungsstatus');
        if (!name?.trim()) return;
        try { await suggestionsApi.admin.saveStatus('new', { name: name.trim(), html: '', open: true, deleted: false }); await load(); } catch (reason) { setError(reason.message); }
    };
    if (loading) return <ForumLoading label="Vorschläge werden geladen …" />;
    return <section className="forum-panel overflow-hidden rounded-3xl">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[.06] p-6"><div><p className="eyebrow">FEEDBACK</p><h2 className="mt-2 font-display text-2xl font-bold">Vorschläge moderieren</h2><p className="mt-2 text-sm text-zinc-500">Status und Kategorie ändern oder Einträge ausblenden.</p></div><div className="flex gap-2"><button className="forum-button-secondary" onClick={createCategory}><FaPlus /> Kategorie</button><button className="forum-button-secondary" onClick={createStatus}><FaPlus /> Status</button></div></header>
        {error && <div className="p-5"><ForumError message={error} retry={load} /></div>}
        {data.suggestions.map((suggestion) => <article className="grid gap-4 border-b border-white/[.05] p-6 last:border-0 lg:grid-cols-[1fr_220px_220px_auto] lg:items-center" key={suggestion.id}><div><b className="block font-display text-lg">{suggestion.title}</b><span className="mt-1 block text-xs text-zinc-600">{suggestion.likesCount} Likes · {suggestion.views} Aufrufe</span></div><select className="forum-input" value={suggestion.status?.id || ''} onChange={(event) => patch(suggestion.id, { statusId: event.target.value })}>{data.statuses.filter((status) => !status.deleted).map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}</select><select className="forum-input" value={suggestion.category?.id || ''} onChange={(event) => patch(suggestion.id, { categoryId: event.target.value })}>{data.categories.filter((category) => !category.deleted).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><button className="forum-icon-button text-red-300" title="Ausblenden" onClick={() => window.confirm('Vorschlag ausblenden?') && patch(suggestion.id, { deleted: true })}><FaTrash /></button></article>)}
        {data.suggestions.length === 0 && <p className="p-10 text-center text-sm text-zinc-600">Keine Vorschläge vorhanden.</p>}
    </section>;
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { socialApi } from '../../lib/socialApi.js';
import { AdminEmptyState, AdminPendingState, AdminUnavailableState } from '../../components/admin/AdminUi.jsx';

export default function PublicServers() {
    const [query, setQuery] = useState(''), [search, setSearch] = useState(''), [page, setPage] = useState(0), [retry, setRetry] = useState(0);
    const [state, setState] = useState({ loading: true, data: null, error: '' });
    const [copied, setCopied] = useState('');
    useEffect(() => {
        const controller = new AbortController(); let active = true;
        setState({ loading: true, data: null, error: '' });
        socialApi.servers.list({ q: search, page }, controller.signal).then(data => active && setState({ loading: false, data, error: '' }))
            .catch(error => { if (active && error.name !== 'AbortError') setState({ loading: false, data: null, error: error.message }); });
        return () => { active = false; controller.abort(); };
    }, [search, page, retry]);
    const copy = async server => {
        try { await navigator.clipboard.writeText(server.address); setCopied(`Adresse von ${server.name} kopiert.`); }
        catch { setCopied(`Kopieren nicht möglich. Adresse: ${server.address}`); }
    };
    return <main className="min-h-[80vh] px-5 pb-24 pt-36 text-white sm:pt-44 lg:px-10"><div className="mx-auto max-w-6xl">
        <p className="eyebrow">COMMUNITY · SERVERVERZEICHNIS</p>
        <h1 className="mt-3 font-display text-4xl font-bold sm:text-6xl">Minecraft-Server entdecken</h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-400">Freigegebene Einträge aus dem Social-Katalog. Spielerzahlen sind optionale Katalogangaben, keine unabhängige Live-Messung oder Minecraft-Bestätigung.</p>
        <form className="mt-7 flex max-w-xl gap-3" onSubmit={event => { event.preventDefault(); setPage(0); setSearch(query.trim()); setRetry(value => value + 1); }}>
            <label className="min-w-0 flex-1"><span className="sr-only">Server suchen</span><input className="forum-input" maxLength={120} value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, Adresse oder Tag …" /></label>
            <button className="forum-button-secondary" type="submit">Suchen</button>
        </form>
        {copied && <p className="mt-4 text-xs text-zinc-400" role="status">{copied}</p>}
        <div className="mt-8">{state.loading ? <AdminPendingState title="Serververzeichnis wird geladen" />
            : state.error ? <AdminUnavailableState text={state.error} onRetry={() => setRetry(value => value + 1)} />
                : !state.data.items.length ? <AdminEmptyState title="Keine freigegebenen Server gefunden" text="Es werden keine Beispielserver oder ungeprüften Entwürfe als veröffentlichte Einträge angezeigt." />
                    : <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-label="Freigegebene Server">{state.data.items.map(server => <article key={server.id} className="min-w-0 rounded-3xl border border-white/[.07] bg-[#111218] p-6">
                        <h2 className="font-display text-xl font-bold">{server.name}</h2><p className="mt-2 break-all font-mono text-xs text-orange-300">{server.address}</p>
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-400">{server.description || 'Keine Beschreibung hinterlegt.'}</p>
                        <p className="mt-4 text-xs text-zinc-500">{server.onlinePlayers == null ? 'Keine Spielerzahl gemeldet' : `${server.onlinePlayers}${server.maxPlayers == null ? '' : ` / ${server.maxPlayers}`} Spieler (Katalogangabe)`}</p>
                        <p className="mt-2 text-xs text-zinc-500">{server.supportedVersions.length ? `Versionen: ${server.supportedVersions.join(', ')}` : 'Keine Versionen hinterlegt'}</p>
                        <button className="forum-button-secondary mt-5" onClick={() => copy(server)}>Adresse kopieren</button>
                    </article>)}</section>}</div>
        <nav className="mt-6 flex items-center justify-between gap-4" aria-label="Serververzeichnisseiten">
            <button className="button-secondary" disabled={state.loading || page === 0} onClick={() => setPage(value => value - 1)}>Zurück</button>
            <Link className="text-xs text-zinc-500 hover:text-orange-300" to="/community/feedback">Feedback</Link>
            <button className="button-secondary" disabled={state.loading || !state.data || page + 1 >= state.data.totalPages} onClick={() => setPage(value => value + 1)}>Weitere Server</button>
        </nav>
    </div></main>;
}

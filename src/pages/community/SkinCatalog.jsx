import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { skinApi } from '../../lib/skinApi.js';
import SkinTexturePreview from '../../components/SkinTexturePreview.jsx';
import { AdminEmptyState, AdminPendingState } from '../../components/admin/AdminUi.jsx';

export default function SkinCatalog() {
    const [cursors, setCursors] = useState(['']);
    const [retry, setRetry] = useState(0);
    const [state, setState] = useState({ data: null, loading: true, error: '' });
    const cursor = cursors[cursors.length - 1];
    useEffect(() => {
        const controller = new AbortController(); let active = true;
        setState({ data: null, loading: true, error: '' });
        skinApi.list(cursor, 12, controller.signal).then(data => active && setState({ data, loading: false, error: '' }))
            .catch(error => { if (active && error.name !== 'AbortError') setState({ data: null, loading: false, error: error.message }); });
        return () => { active = false; controller.abort(); };
    }, [cursor, retry]);
    return <main className="min-h-[80vh] px-5 pb-24 pt-36 text-white sm:pt-44 lg:px-10"><div className="mx-auto max-w-6xl">
        <p className="eyebrow">COMMUNITY · SKIN-BIBLIOTHEK</p>
        <h1 className="mt-3 font-display text-4xl font-bold sm:text-6xl">Skin-Texturen entdecken</h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-400">Explizit veröffentlichte Texturen aus dem gemeinsamen Katalog. Identische Pixel werden nur einmal gespeichert. Die Bibliothek zeigt keine Herkunfts-UUIDs, Nutzernamen oder vermeintlichen Besitz.</p>
        <p className="mt-2 text-xs text-zinc-500">Texturansicht, keine vollständige Minecraft-Skinhistorie. Auswahl oder Download ist keine Anmeldung und ändert keinen Minecraft-Skin.</p>
        <div className="mt-8">
            {state.loading ? <AdminPendingState title="Skin-Katalog wird geladen" />
                : state.error ? <div role="alert" className="rounded-2xl border border-red-400/20 p-6 text-red-300"><p>{state.error}</p><button className="mt-4 text-orange-300" onClick={() => setRetry(value => value + 1)}>Erneut versuchen</button></div>
                    : !state.data?.items.length ? <AdminEmptyState title="Noch keine veröffentlichten Texturen" text="Neue Inhalte bleiben Entwürfe, bis sie ausdrücklich veröffentlicht werden. Es läuft kein automatischer Skin-Crawler." />
                        : <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Veröffentlichte Skins">
                            {state.data.items.map(texture => <article key={texture.textureId} className="rounded-3xl border border-white/[.07] bg-[#111218] p-5">
                                <SkinTexturePreview texture={texture} />
                                <h2 className="mt-4 text-sm font-bold">{texture.width} × {texture.height} Pixel</h2>
                                <p className="mt-2 break-all font-mono text-[10px] leading-5 text-zinc-500">{texture.textureId}</p>
                                <p className="mt-2 text-xs text-zinc-500">{texture.hashVersion} · exakt dedupliziert</p>
                            </article>)}
                        </section>}
        </div>
        <nav className="mt-6 flex items-center justify-between gap-4" aria-label="Skin-Katalogseiten">
            <button className="button-secondary" disabled={state.loading || cursors.length < 2} onClick={() => setCursors(values => values.slice(0, -1))}>Zurück</button>
            <Link className="text-xs text-zinc-500 hover:text-orange-300" to="/community/feedback">Feedback</Link>
            <button className="button-secondary" disabled={state.loading || !state.data?.nextCursor} onClick={() => setCursors(values => [...values, state.data.nextCursor])}>Weitere Texturen</button>
        </nav>
    </div></main>;
}

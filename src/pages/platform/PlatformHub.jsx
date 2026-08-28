import { useEffect, useMemo, useState } from 'react';
import { FaArrowRight, FaComments, FaCrown, FaStore, FaUsers } from 'react-icons/fa6';
import { beginLogin, getAccessToken, isAuthenticated, logout } from '../../lib/auth';

const API = 'https://api.seriuxmod.net/api/v1';
const configs = {
    clans: { icon: FaCrown, eyebrow: 'SOCIAL SERVICE', title: 'Clans', copy: 'Baue deine eigene Community auf, verwalte Mitglieder, Ränge, Einladungen und gemeinsame Statistiken.', endpoint: '/social/clans/invites', features: ['Clan erstellen und verwalten', 'Mitglieder & individuelle Ränge', 'Einladungen und Beitrittsanfragen', 'Gemeinsame Clan-Statistiken'] },
    forum: { icon: FaComments, eyebrow: 'FORUM SERVICE', title: 'Forum', copy: 'Diskutiere Updates, teile Ideen und finde Themen aus der gesamten SeriuxMod-Community.', endpoint: '/forum/latest', features: ['Foren, Topics und Beiträge', 'Reaktionen und Themen-Follows', 'Vorschläge mit Voting', 'News und Blog-Artikel'] },
    store: { icon: FaStore, eyebrow: 'STORE SERVICE', title: 'Store', copy: 'Entdecke Cosmetics, Erweiterungen und Freischaltungen für deinen persönlichen SeriuxMod-Auftritt.', endpoint: '/store/store/products', features: ['Cosmetics, Capes und Emotes', 'Extensions und Produktkategorien', 'Bestellungen und Zahlungen', 'Credits und Freischaltungen'] },
};

const countItems = (payload) => Array.isArray(payload) ? payload.length : Object.values(payload || {}).find(Array.isArray)?.length ?? 0;

export default function PlatformHub({ type }) {
    const config = configs[type];
    const Icon = config.icon;
    const [state, setState] = useState({ loading: true, count: 0, items: [], gated: type !== 'forum' && !isAuthenticated(), error: '' });
    const token = useMemo(getAccessToken, []);

    useEffect(() => {
        if (!token && type !== 'forum') { setState({ loading: false, count: 0, items: [], gated: true, error: '' }); return; }
        const controller = new AbortController();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        fetch(`${API}${config.endpoint}`, { headers, signal: controller.signal })
            .then(async (response) => {
                if (response.status === 401 || response.status === 403) throw new Error('AUTH');
                if (!response.ok) throw new Error('API');
                return response.json();
            })
            .then((payload) => setState({ loading: false, count: countItems(payload), items: payload.items ?? [], gated: false, error: '' }))
            .catch((error) => {
                if (error.name === 'AbortError') return;
                setState({ loading: false, count: 0, items: [], gated: error.message === 'AUTH', error: error.message === 'API' ? 'Der Dienst antwortet momentan nicht.' : '' });
            });
        return () => controller.abort();
    }, [config.endpoint, token, type]);

    return <main className="min-h-screen bg-[#090a0d] px-5 pb-24 pt-36 text-white">
        <section className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
                <div><div className="grid h-16 w-16 place-items-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-2xl text-orange-400"><Icon /></div><p className="eyebrow mt-7">{config.eyebrow}</p><h1 className="mt-3 font-display text-6xl font-bold tracking-[-.055em] sm:text-7xl">{config.title}</h1><p className="mt-6 max-w-2xl text-base leading-8 text-zinc-400">{config.copy}</p></div>
                <div className="liquid-panel rounded-3xl p-7"><p className="text-xs font-bold tracking-[.16em] text-zinc-500">LIVE BACKEND</p><div className="mt-5 flex items-center gap-4"><i className={`h-3 w-3 rounded-full ${state.error ? 'bg-amber-400' : 'bg-emerald-400'}`} /><div><b className="font-display text-xl">{state.loading ? 'Wird verbunden …' : state.gated ? 'Anmeldung erforderlich' : `${state.count} Einträge verfügbar`}</b><p className="mt-1 text-xs text-zinc-500">{state.error || 'Direkt mit dem SeriuxMod API Gateway verbunden'}</p></div></div></div>
            </div>
            <div className="mt-16 grid gap-4 md:grid-cols-2">{config.features.map((feature, index) => <article key={feature} className="rounded-2xl border border-white/[.07] bg-[#121318] p-6"><span className="text-xs font-bold text-orange-500">0{index + 1}</span><h2 className="mt-3 font-display text-xl font-bold">{feature}</h2></article>)}</div>
            {type === 'forum' && <div className="mt-10 overflow-hidden rounded-3xl border border-white/[.07] bg-[#121318]">
                <div className="border-b border-white/[.07] p-6"><h2 className="font-display text-2xl font-bold">Neueste Themen</h2><p className="mt-2 text-sm text-zinc-500">Öffentlich lesbar für Besucher und angemeldete Spieler.</p></div>
                {!state.loading && !state.error && state.items.length === 0 && <p className="p-6 text-sm text-zinc-500">Noch keine öffentlichen Themen vorhanden.</p>}
                {state.items.map((topic) => <article key={topic.id} className="grid gap-3 border-b border-white/[.06] p-6 last:border-0 sm:grid-cols-[1fr_auto] sm:items-center"><div><h3 className="font-display text-lg font-bold">{topic.title}</h3><p className="mt-2 text-xs text-zinc-600">{topic.views ?? 0} Aufrufe</p></div><span className="text-xs text-zinc-500">{new Date(topic.lastReplyAt ?? topic.createdAt).toLocaleDateString('de-DE')}</span></article>)}
            </div>}
            <div className="mt-10 flex flex-wrap gap-3">{state.gated ? <button onClick={() => beginLogin(`/${type}`)} className="button-primary">Mit Minecraft anmelden <FaArrowRight /></button> : <><button onClick={() => window.location.reload()} className="button-primary">Daten aktualisieren <FaArrowRight /></button>{token && <button onClick={() => logout(`/${type}`)} className="button-secondary">Abmelden</button>}</>} {type === 'forum' && !token && <button onClick={() => beginLogin('/forum')} className="button-secondary">Anmelden, um zu schreiben</button>}<a href="/" className="button-secondary">Zur Startseite</a></div>
            <div className="mt-16 rounded-3xl border border-white/[.07] bg-gradient-to-br from-[#15171c] to-[#0d0e11] p-8"><div className="flex items-center gap-3"><FaUsers className="text-orange-400" /><h2 className="font-display text-2xl font-bold">Bereit für echte Community-Daten</h2></div><p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-500">Die Oberfläche verwendet bereits die produktiven API-v1-Routen. Solange noch keine Inhalte angelegt wurden, bleibt der Bereich bewusst leer und zeigt keine erfundenen Beispieldaten.</p></div>
        </section>
    </main>;
}

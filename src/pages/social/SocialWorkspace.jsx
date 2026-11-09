import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { FaUsers, FaCrown, FaShieldHalved, FaComments, FaBell } from 'react-icons/fa6';
import { useSocial } from '../../lib/SocialContext.jsx';
import { beginLogin } from '../../lib/auth.js';
import { userApi } from '../../lib/userApi.js';
import { grpcSocial } from '../../lib/grpc/socialClients.js';
import { presenceLabels, surfaceLabels, presenceDescription, socialTopicLabels, socialTopicTarget } from '../../lib/presenceDisplay.js';
import { ForumShell, ForumLoading } from '../forum/ForumComponents';
import DirectChat from './DirectChat.jsx';

const panel = 'forum-panel rounded-2xl p-5 sm:p-6 space-y-4';
const tabs = [['friends', 'Freunde', '/friends', FaUsers], ['clans', 'Clans', '/clans', FaCrown],
    ['party', 'Party', '/party', FaShieldHalved], ['chat', 'Chat', '/chat', FaComments], ['notifications', 'Eingang', '/notifications', FaBell]];
const date = value => value ? new Date(value).toLocaleString('de-DE') : 'nicht verfügbar';

export default function SocialWorkspace({ initialTab = 'clans' }) {
    const { state, session } = useSocial();
    // Remount all private inputs/drafts on an account or terminal-session change.
    return <ForumShell eyebrow="SERIUXMOD SOCIAL" title="Gemeinsam statt allein."
        description="Freunde und Chat verbinden Website, Launcher und Client. Deine Party bleibt hier eine Übersicht."
        rootBreadcrumb={{ label: 'Social' }}>
        <nav className="forum-panel mb-6 flex flex-wrap gap-2 rounded-2xl p-2" aria-label="Social-Bereiche">
            {tabs.map(([key, label, to, Icon]) => <Link key={key} to={to} aria-current={key === initialTab ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ${key === initialTab ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:bg-white/5'}`}><Icon />{label}</Link>)}
        </nav>
        <Workspace key={`${state.userId}:${state.connection === 'unauthenticated' || state.connection === 'forbidden'}`} state={state} session={session} section={initialTab} />
    </ForumShell>;
}

function Workspace({ state, session, section }) {
    const [busy, setBusy] = useState(false), [notice, setNotice] = useState('');
    const active = useRef(true);
    useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
    const run = async action => {
        if (busy) return;
        setBusy(true); setNotice('');
        try { await action(); if (active.current) setNotice('Aktualisiert.'); }
        catch (error) { if (active.current) setNotice(error.message || 'Social-Aktion fehlgeschlagen.'); }
        finally { if (active.current) setBusy(false); }
    };
    const mutate = action => run(() => session.mutate(action));
    const confirm = (copy, action) => { if (window.confirm(copy)) void mutate(action); };
    const name = id => state.people[id]?.username || id;
    const identity = id => <div><Link to={`/players/${encodeURIComponent(id)}`} className="font-bold text-zinc-100 break-all">{name(id)}</Link>
        <p className="text-xs text-zinc-500">{presenceDescription(state.people[id]?.presence)}</p></div>;
    const online = state.connection === 'connected';
    const ownRank = state.clanRanks.find(rank => rank.key === state.clanMembers.find(value => value.userId === state.userId)?.rankKey);
    const formAction = (event, action) => { event.preventDefault(); const data = new FormData(event.currentTarget); void mutate(api => action(api, data)); };

    if (!state.userId) return <div className={panel}><h2 className="text-xl font-bold">Social mit deinem Account verwenden</h2>
        <p className="text-zinc-400">Melde dich für Freunde, Chat und deine Mitgliedschaften an.</p>
        <button className="forum-button-primary" onClick={() => beginLogin(window.location.pathname)}>Anmelden</button>
        {section === 'clans' && <ClanCatalog />}</div>;

    return <div className="space-y-6">
        <div className={panel}><div className="flex flex-wrap justify-between items-center gap-4"><p role="status" className="text-sm text-zinc-400">
            {online ? 'Live verbunden' : state.connection === 'unauthenticated' ? 'Bitte erneut anmelden' : state.connection === 'forbidden' ? 'Zugriff beendet' : 'Social wird verbunden und synchronisiert …'}
            {state.updatedAt && ` · Stand ${date(state.updatedAt)}`}</p>
            <button className="forum-button-secondary" disabled={busy || !online} onClick={() => run(() => session.refresh())}>Aktualisieren</button></div>
            {state.error && <p role="alert" className="text-amber-200">{state.error}</p>}
            {(state.connection === 'unauthenticated' || state.connection === 'forbidden') && <button className="forum-button-primary" onClick={() => beginLogin(window.location.pathname)}>Erneut anmelden</button>}
        </div>
        {notice && <p role="status" className={panel}>{notice}</p>}
        {!state.updatedAt ? (state.error ? null : <ForumLoading label="Social-Daten werden geladen …" />) : <>
            <fieldset disabled={busy || !online} className={`${panel} disabled:opacity-70`}><div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-bold">Dein globaler Status</h2><select className="forum-input w-auto" aria-label="Globaler Benutzerstatus"
                    value={state.ownPresence?.preferredStatus || ''} onChange={event => mutate(api => api.presence.setStatus(event.target.value))}>
                    {Object.entries(presenceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select></div><p className="text-sm text-zinc-400">Aktuell: {presenceLabels[state.ownPresence?.effectiveStatus] || 'nicht verfügbar'}</p>
                <p className="text-sm text-zinc-400">Verbunden über: {state.ownPresence?.connectedSurfaces.map(surface => surfaceLabels[surface]).join(', ') || 'keine aktive Oberfläche'}</p>
                <p className="text-xs text-zinc-500">Accountweit, unabhängig vom Gerät. Offline und Unsichtbar verbergen Verbindungen und Spielkontext vor anderen. Keine automatische Abwesenheitsumschaltung.</p>
            </fieldset>
            {section === 'friends' && <Friends state={state} identity={identity} busy={busy || !online} mutate={mutate} confirm={confirm} />}
            {section === 'party' && <section className={panel}><h2 className="font-bold">Deine Party · Nur Ansicht</h2>
                <p className="text-sm text-zinc-400">Die volle Party-Bedienung gehört in den Minecraft-Client.</p>
                {!state.party ? <p>Du bist aktuell in keiner Party.</p> : <><h3 className="text-xl font-bold">{state.party.name}</h3>
                    <p>{state.partyMembers.length} Mitglieder · {Math.max(0, state.partyMembers.length - 1)} weitere Spieler</p>
                    {state.partyMembers.map(member => {
                        const activity = state.partyActivities.find(value => value.userId === member.userId)?.activity;
                        return <div key={member.userId} className="border-t border-white/10 pt-4">{identity(member.userId)}<small className="text-orange-300">{member.rankKey}</small>
                            <p className="text-sm text-zinc-400">{activity ? `${activity.serverName} (${activity.serverAddress}) · ${activity.gameMode || 'Spielmodus unbekannt'} · ${activity.source === 'CLIENT_REPORTED' ? 'Client-Angabe, nicht serververifiziert' : 'Quelle: ' + activity.source}` : 'Server und Spielmodus nicht verfügbar oder nicht freigegeben.'}</p></div>;
                    })}</>}
            </section>}
            {section === 'clans' && <>
                <fieldset className={`${panel} disabled:opacity-70`} disabled={busy || !online}><h2 className="font-bold">Clan-Einladungen</h2>
                    {!state.clanInvites.length && <p className="text-sm text-zinc-400">Keine offenen Einladungen.</p>}
                    {state.clanInvites.map(invite => <div key={invite.id} className="flex flex-wrap justify-between items-center gap-3">{identity(invite.senderUserId)}<div className="flex gap-2">
                        <button className="forum-button-primary" disabled={Boolean(state.clan)} onClick={() => mutate(api => api.clans.acceptInvite(invite.id))}>Annehmen</button>
                        <button className="forum-button-secondary" onClick={() => mutate(api => api.clans.declineInvite(invite.id))}>Ablehnen</button></div></div>)}
                </fieldset>
                <fieldset className={`${panel} disabled:opacity-70`} disabled={busy || !online}>{state.clan ? <>
                    <div className="flex flex-wrap justify-between gap-4"><h2 className="font-bold text-xl">{state.clan.name} [{state.clan.tag}]</h2>
                        <button className="forum-button-secondary" onClick={() => confirm(state.clan.ownerUserId === state.userId ? 'Clan endgültig auflösen?' : 'Clan verlassen?',
                            api => state.clan.ownerUserId === state.userId ? api.clans.remove(state.clan.id) : api.clans.leave(state.clan.id))}>{state.clan.ownerUserId === state.userId ? 'Auflösen' : 'Verlassen'}</button></div>
                    <p className="text-zinc-400">{state.clan.description || 'Keine Clan-Beschreibung.'}</p>
                    {state.clanMembers.map(member => {
                        const rank = state.clanRanks.find(value => value.key === member.rankKey);
                        const manageable = member.userId !== state.userId && ownRank && rank && ownRank.priority > rank.priority;
                        return <div key={member.userId} className="flex flex-wrap justify-between items-center gap-4 border-t border-white/10 pt-4">{identity(member.userId)}
                            <div className="flex flex-wrap gap-2 items-center"><small className="text-orange-300">{member.rankKey}</small>
                                {manageable && ownRank.canPromote && <select className="forum-input w-auto" aria-label={`Rang für ${name(member.userId)}`} value={member.rankKey}
                                    onChange={event => mutate(api => api.clans.changeRank(state.clan.id, member.userId, event.target.value))}>
                                    {state.clanRanks.filter(value => value.priority < ownRank.priority).map(value => <option key={value.key} value={value.key}>{value.key}</option>)}
                                </select>}{manageable && ownRank.canKick && <button className="forum-button-secondary" onClick={() => confirm('Mitglied entfernen?', api => api.clans.kick(state.clan.id, member.userId))}>Entfernen</button>}</div></div>;
                    })}
                    {ownRank?.canInvite && <><h3 className="font-bold">Beitrittsanfragen</h3>{!state.joinRequests.length && <p className="text-sm text-zinc-400">Keine offenen Beitrittsanfragen.</p>}
                        {state.joinRequests.map(request => <div key={request.id} className="flex flex-wrap gap-3 justify-between items-center">{identity(request.senderUserId)}<div className="flex gap-2">
                            <button className="forum-button-primary" onClick={() => mutate(api => api.clans.acceptInvite(request.id))}>Annehmen</button>
                            <button className="forum-button-secondary" onClick={() => mutate(api => api.clans.declineInvite(request.id))}>Ablehnen</button></div></div>)}</>}
                    {ownRank?.canEditClan && <details><summary className="cursor-pointer font-bold">Clan bearbeiten</summary><form key={state.clan.id} className="space-y-3 mt-4" onSubmit={event => formAction(event, (api, data) => api.clans.update(state.clan.id, { name: data.get('name'), description: data.get('description'), open: data.has('open') }))}>
                        <input className="forum-input" aria-label="Clanname" name="name" defaultValue={state.clan.name} required minLength={3} maxLength={32} />
                        <input className="forum-input" aria-label="Beschreibung" name="description" defaultValue={state.clan.description || ''} maxLength={255} />
                        <label className="flex gap-2 text-sm"><input type="checkbox" name="open" defaultChecked={state.clan.open} />Beitrittsanfragen erlauben</label><button className="forum-button-primary">Speichern</button></form></details>}
                </> : <><h2 className="font-bold">Clan erstellen</h2><form className="grid gap-3 sm:grid-cols-2" onSubmit={event => formAction(event, (api, data) => api.clans.create({ name: data.get('name'), tag: data.get('tag'), description: data.get('description'), open: data.has('open') }))}>
                    <input className="forum-input" name="name" aria-label="Clanname" placeholder="Clanname" required minLength={3} maxLength={32} />
                    <input className="forum-input" name="tag" aria-label="Clan-Tag" placeholder="Tag (2–5 Zeichen)" required minLength={2} maxLength={5} />
                    <input className="forum-input sm:col-span-2" name="description" aria-label="Beschreibung" placeholder="Beschreibung" maxLength={255} />
                    <label className="flex gap-2 items-center text-sm"><input type="checkbox" name="open" />Beitrittsanfragen erlauben</label><button className="forum-button-primary">Erstellen</button></form></>}
                </fieldset><ClanCatalog canJoin={!state.clan && online && !busy} join={clan => mutate(api => api.clans.requestJoin(clan.id))} />
            </>}
            {section === 'chat' && <DirectChat state={state} session={session} />}
            {section === 'notifications' && <fieldset disabled={busy || !online} className={`${panel} disabled:opacity-70`}><div className="flex flex-wrap justify-between items-center gap-3"><h2 className="font-bold">Social-Eingang · {state.unreadCount} ungelesen</h2>
                <button className="forum-button-secondary" disabled={!state.unreadCount} onClick={() => mutate(api => api.notifications.readAll())}>Alle gelesen</button></div>
                <p className="text-sm text-zinc-400">90 Tage Verlauf. Alte Benachrichtigungen sind keine gültigen Anfragen oder Einladungen.</p>
                {!state.notifications.length && <p>Keine Benachrichtigungen auf dieser Seite.</p>}
                {state.notifications.map(entry => <div key={entry.id} className="flex flex-wrap justify-between gap-3 border-t border-white/10 pt-4"><div><p>{socialTopicLabels[entry.topic] || entry.topic}</p><small className="text-zinc-500">{date(entry.createdAt)}</small>
                    <Link className="block text-orange-300 text-sm" to={socialTopicTarget(entry.topic)}>Bereich öffnen</Link></div>{!entry.readAt && <button className="forum-button-secondary" onClick={() => mutate(api => api.notifications.read(entry.id))}>Gelesen</button>}</div>)}
                <div className="flex gap-3 items-center"><button className="forum-button-secondary" disabled={!state.notificationPage} onClick={() => run(() => session.page(state.notificationPage - 1))}>Zurück</button>
                    <span>Seite {state.notificationPage + 1} / {Math.max(1, state.notificationPages)}</span><button className="forum-button-secondary" disabled={state.notificationPage + 1 >= state.notificationPages} onClick={() => run(() => session.page(state.notificationPage + 1))}>Weiter</button></div>
            </fieldset>}
        </>}
    </div>;
}

function Friends({ state, identity, busy, mutate, confirm }) {
    const [query, setQuery] = useState(''), [results, setResults] = useState([]), [error, setError] = useState(''), [searching, setSearching] = useState(false);
    const active = useRef(true);
    useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
    const search = async event => {
        event.preventDefault(); setSearching(true); setError('');
        try { const values = await userApi.search(query, 10); if (active.current) setResults(values); }
        catch (reason) { if (active.current) setError(reason.message); }
        finally { if (active.current) setSearching(false); }
    };
    const clanRank = state.clanRanks.find(rank => rank.key === state.clanMembers.find(value => value.userId === state.userId)?.rankKey);
    return <fieldset disabled={busy} className="space-y-6 disabled:opacity-70"><section className={panel}><h2 className="font-bold">Spieler suchen</h2>
        <form className="flex flex-wrap gap-3" onSubmit={search}><input aria-label="Spielername" className="forum-input flex-1" value={query} onChange={event => setQuery(event.target.value)} required minLength={2} maxLength={64} placeholder="Minecraft-Spielername" />
            <button disabled={searching} className="forum-button-primary">{searching ? 'Suche läuft …' : 'Suchen'}</button></form>{error && <p role="alert">{error}</p>}
        {results.map(profile => <div key={profile.playerId} className="flex flex-wrap items-center justify-between gap-3"><span>{profile.username}</span>
            <button className="forum-button-secondary" disabled={profile.playerId === state.userId || state.friends.some(value => value.friendUserId === profile.playerId)} onClick={() => mutate(api => api.friends.send(profile.playerId))}>Anfragen</button></div>)}
    </section><section className={panel}><h2 className="font-bold">Eingehende Anfragen ({state.requests.length})</h2>{!state.requests.length && <p>Keine offenen Freundschaftsanfragen.</p>}
        {state.requests.map(request => <div key={request.id} className="flex flex-wrap justify-between gap-3 items-center">{identity(request.senderUserId)}<div className="flex gap-2"><button className="forum-button-primary" onClick={() => mutate(api => api.friends.accept(request.id))}>Annehmen</button>
            <button className="forum-button-secondary" onClick={() => mutate(api => api.friends.decline(request.id))}>Ablehnen</button></div></div>)}
    </section><section className={panel}><h2 className="font-bold">Deine Freunde ({state.friends.length})</h2>{!state.friends.length && <p>Noch keine Freunde. Suche oben nach einem Spieler.</p>}
        {state.friends.map(friend => <div key={friend.id} className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">{identity(friend.friendUserId)}<div className="flex flex-wrap gap-2">
            <Link className="forum-button-primary" to={`/chat?peer=${encodeURIComponent(friend.friendUserId)}`}>Chat</Link>
            {clanRank?.canInvite && <button className="forum-button-secondary" onClick={() => mutate(api => api.clans.invite(state.clan.id, friend.friendUserId))}>Zum Clan</button>}
            <button className="forum-button-secondary" onClick={() => confirm('Freundschaft beenden?', api => api.friends.remove(friend.friendUserId))}>Entfernen</button></div></div>)}
    </section></fieldset>;
}

function ClanCatalog({ canJoin = false, join }) {
    const [input, setInput] = useState(''), [page, setPage] = useState(0), [data, setData] = useState(null), [error, setError] = useState(''), [retry, setRetry] = useState(0);
    const [query] = useDebouncedValue(input, { wait: 300 });
    useEffect(() => {
        const controller = new AbortController(); setData(null); setError('');
        grpcSocial.clans.public(query, page, 12, controller.signal).then(value => { if (!controller.signal.aborted) setData(value); })
            .catch(reason => { if (!controller.signal.aborted) setError(reason.message); });
        return () => controller.abort();
    }, [query, page, retry]);
    return <section className={panel}><h2 className="font-bold">Öffentliche Clans</h2><input className="forum-input" aria-label="Clans suchen" value={input} placeholder="Clan suchen" maxLength={100} onChange={event => { setInput(event.target.value); setPage(0); }} />
        {error ? <div role="alert"><p>{error}</p><button className="forum-button-secondary" onClick={() => setRetry(value => value + 1)}>Erneut versuchen</button></div> : !data ? <ForumLoading label="Clans werden geladen …" /> : <>
            {!data.items.length && <p>Keine passenden Clans gefunden.</p>}{data.items.map(clan => <div key={clan.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4"><div><p className="font-bold">{clan.name} [{clan.tag}]</p><small className="text-zinc-500">{clan.description || 'Keine Beschreibung.'}</small></div>
                {canJoin && clan.open && <button className="forum-button-secondary" onClick={() => join(clan)}>Beitritt anfragen</button>}</div>)}
            <div className="flex gap-3 items-center"><button className="forum-button-secondary" disabled={!page} onClick={() => setPage(value => value - 1)}>Zurück</button><span>Seite {page + 1} / {Math.max(1, data.totalPages)}</span>
                <button className="forum-button-secondary" disabled={page + 1 >= data.totalPages} onClick={() => setPage(value => value + 1)}>Weiter</button></div></>}
    </section>;
}

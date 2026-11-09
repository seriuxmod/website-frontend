import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { grpcSocial } from '../../lib/grpc/socialClients.js';
import { ForumLoading } from '../forum/ForumComponents';

const panel = 'forum-panel rounded-2xl p-5 space-y-4';
const merge = (old, current) => [...new Map([...old, ...current].map(message => [message.id, message])).values()].sort((a, b) => a.sequence - b.sequence);

export default function DirectChat({ state, session }) {
    const [params, setParams] = useSearchParams();
    const peer = params.get('peer') || '';
    // Peer changes also discard drafts and late answers from the old thread.
    return <ChatThread key={`${state.userId}:${peer}`} peer={peer} state={state} session={session}
        select={userId => setParams(userId ? { peer: userId } : {})} />;
}

function ChatThread({ peer, state, session, select }) {
    const [conversations, setConversations] = useState(null), [page, setPage] = useState(0);
    const [messages, setMessages] = useState(null), [before, setBefore] = useState(null);
    const [draft, setDraft] = useState(''), [pending, setPending] = useState(null), [sending, setSending] = useState(false);
    const [error, setError] = useState(''), [loadingOlder, setLoadingOlder] = useState(false), [retry, setRetry] = useState(0);
    const alive = useRef(true), reading = useRef(0), latest = useRef(null), initialized = useRef(false);
    const name = id => state.people[id]?.username || id;
    useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
    useEffect(() => {
        const controller = new AbortController();
        grpcSocial.chat.conversations(page, 25, controller.signal).then(value => { if (!controller.signal.aborted) setConversations(value); })
            .catch(reason => { if (!controller.signal.aborted) setError(reason.message); });
        return () => controller.abort();
    }, [state.updatedAt, page, retry]);
    const markViewed = useCallback(async data => {
        if (!peer || !alive.current || document.visibilityState !== 'visible') return;
        const through = data.items.at(-1)?.sequence || 0;
        if (through <= Math.max(data.readThroughSequence, reading.current)) return;
        reading.current = through;
        try { await grpcSocial.chat.read(peer, through); }
        catch (reason) { reading.current = 0; if (alive.current) setError(reason.message); }
    }, [peer]);
    useEffect(() => {
        if (!peer) return;
        const controller = new AbortController();
        grpcSocial.chat.messages(peer, undefined, 50, controller.signal).then(data => {
            if (controller.signal.aborted) return;
            latest.current = data;
            setMessages(previous => merge(previous || [], data.items));
            if (!initialized.current) { initialized.current = true; setBefore(data.nextBeforeSequence || null); }
            void markViewed(data);
        }).catch(reason => { if (!controller.signal.aborted) setError(reason.message); });
        return () => controller.abort();
    }, [peer, state.updatedAt, retry, markViewed]);
    useEffect(() => {
        const visible = () => { if (latest.current) void markViewed(latest.current); };
        document.addEventListener('visibilitychange', visible);
        return () => document.removeEventListener('visibilitychange', visible);
    }, [markViewed]);
    useEffect(() => {
        if (pending && messages?.some(value => value.clientMessageId === pending.clientMessageId && value.senderUserId === state.userId)) {
            setPending(null); setDraft(''); setError('');
        }
    }, [messages, pending, state.userId]);
    const send = async event => {
        event?.preventDefault();
        if (sending || state.connection !== 'connected') return;
        const request = pending || { recipientUserId: peer, text: draft.trim(), clientMessageId: crypto.randomUUID() };
        if (!request.text || request.text.length > 2000) return;
        setPending(request); setSending(true); setError('');
        try {
            const message = await session.mutate(api => api.chat.send(request.recipientUserId, request.text, request.clientMessageId));
            if (alive.current) { setMessages(previous => merge(previous || [], [message])); setPending(null); setDraft(''); }
        } catch (reason) { if (alive.current) setError(`${reason.message} Bei erneutem Senden wird dieselbe Nachrichten-ID verwendet.`); }
        finally { if (alive.current) setSending(false); }
    };
    const older = async () => {
        if (loadingOlder || !before) return;
        setLoadingOlder(true);
        try { const data = await grpcSocial.chat.messages(peer, before); if (alive.current) { setMessages(previous => merge(data.items, previous || [])); setBefore(data.nextBeforeSequence || null); } }
        catch (reason) { if (alive.current) setError(reason.message); }
        finally { if (alive.current) setLoadingOlder(false); }
    };
    const canSend = state.friends.some(friend => friend.friendUserId === peer) && state.connection === 'connected';
    return <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]"><aside className={panel}><h2 className="font-bold">Direktnachrichten</h2>
        <p className="text-xs text-zinc-500">Privater 1:1-Chat. Neue Nachrichten können nur an Freunde gesendet werden.</p>
        <select className="forum-input" aria-label="Chat mit Freund öffnen" value={state.friends.some(friend => friend.friendUserId === peer) ? peer : ''} onChange={event => select(event.target.value)}>
            <option value="">Freund auswählen</option>{state.friends.map(friend => <option key={friend.friendUserId} value={friend.friendUserId}>{name(friend.friendUserId)}</option>)}
        </select>{!conversations ? (error ? <p>Unterhaltungen nicht verfügbar.</p> : <ForumLoading label="Unterhaltungen werden geladen …" />) : <>
            {!conversations.items.length && <p className="text-sm text-zinc-400">Noch keine Unterhaltungen.</p>}
            {conversations.items.map(value => <button key={value.peerUserId} className={`block w-full rounded-xl p-3 text-left ${value.peerUserId === peer ? 'bg-orange-500/10' : 'bg-white/5'}`} onClick={() => select(value.peerUserId)}>
                <b className="block break-all">{name(value.peerUserId)}</b><small className="text-zinc-400">{value.unreadCount} ungelesen</small></button>)}
            <div className="flex justify-between gap-2"><button className="forum-button-secondary" disabled={!page} onClick={() => { setConversations(null); setPage(value => value - 1); }}>Zurück</button>
                <button className="forum-button-secondary" disabled={page + 1 >= conversations.totalPages} onClick={() => { setConversations(null); setPage(value => value + 1); }}>Weiter</button></div></>}
    </aside><section className={panel}><h2 className="font-bold break-all">{peer ? `Chat mit ${name(peer)}` : 'Unterhaltung auswählen'}</h2>
        {error && <div role="alert" className="text-amber-200 text-sm"><p>{error}</p><button className="forum-button-secondary mt-2" onClick={() => { setError(''); setRetry(value => value + 1); }}>Neu laden</button></div>}
        {peer && <>{before && <button className="forum-button-secondary" disabled={loadingOlder} onClick={older}>{loadingOlder ? 'Wird geladen …' : 'Ältere Nachrichten'}</button>}
            {!messages ? (!error && <ForumLoading label="Nachrichten werden geladen …" />) : <div className="max-h-[480px] overflow-y-auto space-y-3" aria-label="Nachrichtenverlauf">
                {!messages.length && <p className="text-zinc-400">Noch keine Nachrichten.</p>}
                {messages.map(value => <article key={value.id} className={`rounded-xl p-4 ${value.senderUserId === state.userId ? 'bg-orange-500/10 ml-4' : 'bg-white/5 mr-4'}`}>
                    <small className="text-zinc-500">{value.senderUserId === state.userId ? 'Du' : name(value.senderUserId)} · {value.createdAt ? new Date(value.createdAt).toLocaleString('de-DE') : 'Zeit unbekannt'}</small>
                    <p className="whitespace-pre-wrap break-words text-sm mt-2">{value.text}</p></article>)}
            </div>}
            {!canSend ? <p className="text-sm text-zinc-400">Senden ist nur an aktuelle Freunde bei bestehender Verbindung möglich.</p> : <form className="space-y-3" onSubmit={send}>
                <textarea className="forum-input min-h-24" aria-label="Nachricht" value={draft} onChange={event => setDraft(event.target.value)} disabled={Boolean(pending) || sending} required maxLength={2000} placeholder="Nachricht schreiben …" />
                <p className="text-xs text-zinc-500">{draft.length} / 2000 · Klartext, keine Anhänge. Transportverschlüsselt, nicht Ende-zu-Ende-verschlüsselt.</p>
                <button className="forum-button-primary" disabled={sending || !draft.trim()}>{sending ? 'Wird gesendet …' : pending ? 'Mit derselben ID erneut senden' : 'Senden'}</button>
            </form>}
        </>}
    </section></div>;
}

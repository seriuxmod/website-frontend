import { useCallback, useRef, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { Navigate, Link } from 'react-router-dom';
import { FaPalette } from 'react-icons/fa6';
import { getAuthenticatedUser, hasPermission, isSkinAdministrator } from '../../../lib/auth.js';
import { skinApi } from '../../../lib/skinApi.js';
import SkinTexturePreview from '../../SkinTexturePreview.jsx';
import { AdminDataTable, AdminManagementPage, AdminManagementLoading, AdminManagementEmpty, AdminPanel, columnHelper, useAdminResource } from './AdminManagementShared.jsx';

const importColumns = [
    columnHelper.accessor('index', { header: 'Zeile', cell: cell => cell.getValue() + 1 }),
    columnHelper.accessor('playerUuid', { header: 'Externe Minecraft-UUID' }),
    columnHelper.accessor('outcome', { header: 'Ergebnis' }),
    columnHelper.accessor('errorCode', { header: 'Validierung' })
];

export default function SkinCatalogAdminView() {
    const user = getAuthenticatedUser();
    if (!isSkinAdministrator(user)) return <Navigate to="/admin" replace />;
    return <SkinCatalogAdministration key={user.playerId} user={user} />;
}

function SkinCatalogAdministration({ user }) {
    const canRead = hasPermission(user, 'forum.skins.read');
    const canImport = hasPermission(user, 'forum.skins.import');
    const canPublish = hasPermission(user, 'forum.skins.publish');
    return <AdminManagementPage area="CONTENT" eyebrow="SKIN-FUNDAMENT" title="Skin-Katalog" icon={FaPalette} backend="Forum-Service"
        connectionLabel="Quellenstatus je Bereich"
        description="Externe Ausgangslisten, getrennte Beobachtungen und explizite Veröffentlichungen. Keine Kontenübernahme, Community-Uploads oder automatischen Abrufe."
        actions={<Link className="admin-forum-secondary" to="/community/skins">Öffentliche Bibliothek</Link>}>
        <p className="mb-6 rounded-2xl border border-orange-400/15 bg-orange-400/[.04] p-4 text-xs leading-6 text-zinc-400">
            Eingaben sind ausschließlich administrativ bereitgestellte Ausgangsdaten. Der vorbereitete Job-Lebenszyklus lädt noch keine Mojang-Skins.
            Quellenstatus ist ADMIN_STAGED_INPUT, nicht verifizierte Minecraft-Identität oder Besitz. Private UUID-/Namensbezüge werden nicht veröffentlicht.
        </p>
        {canImport && <SubjectImport />}
        {canRead ? <>
            <SubjectLookup canImport={canImport} />
            <TextureAdministration canPublish={canPublish} />
        </> : <AdminPanel title="Leserechte getrennt" description="Dein Konto hat kein forum.skins.read. Import-/Worker-/Veröffentlichungsrechte verleihen keine zusätzlichen Leserechte.">
            <AdminManagementEmpty title="Verwaltungssnapshots bleiben verborgen" text="Für Listen, Historien und eine revisionsgebundene Veröffentlichung wird eine passende aktuelle Leseansicht benötigt." />
        </AdminPanel>}
    </AdminManagementPage>;
}

function SubjectImport() {
    const command = useRef(crypto.randomUUID());
    const [result, setResult] = useState(null), [error, setError] = useState(''), [pending, setPending] = useState(false);
    const form = useForm({ defaultValues: { sourceLabel: 'approved-fixture', csv: '' }, onSubmit: async ({ value }) => {
        setPending(true); setError('');
        try { setResult(await skinApi.admin.importSubjects(command.current, value.sourceLabel, value.csv)); }
        catch (reason) { if (reason.name !== 'AbortError') setError(reason.message); }
        finally { setPending(false); }
    } });
    const changed = () => { command.current = crypto.randomUUID(); setResult(null); setError(''); };
    return <AdminPanel className="mb-6" title="Begrenzte Ausgangsliste importieren" description="Nur ein freigegebener Minimalexport uuid,username; 1–100 Zeilen. Keine Produktivdatenbankverbindung und keine zusätzlichen Kontoattribute.">
        <form className="space-y-4 p-5" onSubmit={event => { event.preventDefault(); form.handleSubmit(); }}>
            <form.Field name="sourceLabel">{field => <label className="block space-y-2 text-xs text-zinc-400">Quellbezeichnung
                <input className="admin-forum-input" required maxLength={80} pattern={'[A-Za-z0-9._\\-]{1,80}'} disabled={pending} value={field.state.value}
                    onChange={event => { changed(); field.handleChange(event.target.value); }} onBlur={field.handleBlur} />
            </label>}</form.Field>
            <form.Field name="csv">{field => <label className="block space-y-2 text-xs text-zinc-400">Ausgangsliste (CSV: uuid,username)
                <textarea className="admin-forum-input min-h-40 font-mono" required maxLength={14000} disabled={pending} value={field.state.value}
                    placeholder={'uuid,username\n10000000-0000-0000-0000-000000000001,Synthetic'}
                    onChange={event => { changed(); field.handleChange(event.target.value); }} onBlur={field.handleBlur} />
            </label>}</form.Field>
            {error && <p className="text-xs text-red-300" role="alert">{error} Bei unverändertem Inhalt behält ein erneuter Versuch denselben Import-Key.</p>}
            <button className="admin-forum-secondary" disabled={pending} type="submit">{pending ? 'Wird übernommen …' : 'Ausgangsliste importieren'}</button>
            <p className="text-xs text-zinc-500">Der Import legt keine authentifizierten Nutzer an. Er startet keinen Download. Dubletten und ungültige Zeilen werden einzeln gemeldet.</p>
        </form>
        {result && <div className="p-5"><p className="mb-3 break-all text-xs text-zinc-500">Importbeleg {result.batchId}</p><AdminDataTable rows={result.results} columns={importColumns} /></div>}
    </AdminPanel>;
}

function SubjectLookup({ canImport }) {
    const [input, setInput] = useState(''), [uuid, setUuid] = useState(''), [cursor, setCursor] = useState('');
    const [actionError, setActionError] = useState(''), [mutating, setMutating] = useState(false);
    const loader = useCallback(() => uuid ? Promise.all([skinApi.admin.subject(uuid), skinApi.admin.job(uuid), skinApi.admin.history(uuid, cursor)])
        .then(([subject, job, history]) => ({ subject, job, history })) : Promise.resolve(null), [uuid, cursor]);
    const resource = useAdminResource(loader, [loader]);
    const pause = async () => {
        const job = resource.data?.job; if (!job) return;
        const paused = job.state !== 'PAUSED';
        if (paused && job.state === 'LEASED' && !window.confirm('Pausieren und den aktiven Worker-Lease ungültig machen?')) return;
        setMutating(true); setActionError('');
        try { await skinApi.admin.setPaused(job.playerUuid, paused, job.revision); await resource.reload(); }
        catch (reason) { if (reason.name !== 'AbortError') setActionError(reason.message); }
        finally { setMutating(false); }
    };
    return <AdminPanel className="mb-6" title="Privates Minecraft-Subject prüfen" description="Importierte UUIDs sind Katalogbezüge, keine Seriux-Konten. Beobachtete Änderungen sind keine vollständige rückwirkende Skinhistorie.">
        <form className="flex flex-col gap-3 p-5 sm:flex-row" onSubmit={event => { event.preventDefault(); setActionError(''); setCursor(''); setUuid(input.trim()); }}>
            <label className="min-w-0 flex-1 text-xs text-zinc-400">Externe Minecraft-UUID<input className="admin-forum-input mt-2 font-mono" value={input} maxLength={36} required
                onChange={event => setInput(event.target.value)} placeholder="10000000-0000-0000-0000-000000000001" /></label>
            <button className="admin-forum-secondary self-end" type="submit">Subject laden</button>
            {uuid && <button className="admin-forum-secondary self-end" type="button" onClick={resource.reload} disabled={resource.loading}>Aktualisieren</button>}
        </form>
        {actionError && <p className="px-5 pb-4 text-xs text-red-300" role="alert">{actionError}</p>}
        {resource.error ? <p className="px-5 pb-5 text-sm text-red-300" role="alert">{resource.error}</p>
            : resource.loading && uuid ? <AdminManagementLoading title="Subject und Auftragszustand werden geladen" />
                : resource.data && <div className="space-y-5 p-5 text-xs text-zinc-400">
                    <dl className="grid gap-4 sm:grid-cols-2"><div><dt>Importierter Namenshinweis (unverifiziert)</dt><dd className="mt-1 text-zinc-200">{resource.data.subject.sourceUsername}</dd></div>
                        <div><dt>Beobachtete Zuordnungen</dt><dd className="mt-1 text-zinc-200">{resource.data.subject.observationCount}</dd></div>
                        <div><dt>Auftrag</dt><dd className="mt-1 text-zinc-200">{resource.data.job.state} · Versuche {resource.data.job.attempts}</dd></div>
                        <div><dt>Letzter Fehler</dt><dd className="mt-1 text-zinc-200">{resource.data.job.lastFailure === 'UNSPECIFIED' ? 'Kein Fehler gemeldet' : resource.data.job.lastFailure}</dd></div>
                        <div className="sm:col-span-2"><dt>Letzte erfolgreiche Textur</dt><dd className="mt-1 break-all font-mono text-zinc-200">{resource.data.subject.currentTextureId || 'Noch keine erfolgreiche Probe'}</dd></div>
                    </dl>
                    {canImport && <button className="admin-forum-secondary" onClick={pause} disabled={mutating}>{resource.data.job.state === 'PAUSED' ? 'Auftrag fortsetzen' : 'Auftrag pausieren'}</button>}
                    <ul className="space-y-3" aria-label="Private Beobachtungshistorie">{resource.data.history.items.map(observation => <li key={observation.observationId} className="rounded-xl border border-white/[.06] p-4">
                        <p className="break-all font-mono">{observation.textureId}</p><p className="mt-2">{observation.model} · {observation.provenance}</p>
                        <p className="mt-2">{observation.firstObservedAt} – {observation.lastObservedAt}</p>
                    </li>)}</ul>
                    {!resource.data.history.items.length && <AdminManagementEmpty title="Keine Beobachtungen auf dieser Seite" text="Es wird kein fremder oder erfundener Default-Skin als beobachtet eingetragen." />}
                    <div className="flex gap-3"><button className="admin-forum-secondary" disabled={!cursor} onClick={() => setCursor('')}>Historienanfang</button>
                        <button className="admin-forum-secondary" disabled={!resource.data.history.nextCursor} onClick={() => setCursor(resource.data.history.nextCursor)}>Weitere Beobachtungen</button></div>
                </div>}
    </AdminPanel>;
}

function TextureAdministration({ canPublish }) {
    const [publication, setPublication] = useState(''), [cursors, setCursors] = useState(['']), [mutation, setMutation] = useState(''), [error, setError] = useState('');
    const cursor = cursors[cursors.length - 1];
    const loader = useCallback(() => skinApi.admin.list(cursor, publication), [cursor, publication]);
    const resource = useAdminResource(loader, [loader]);
    const publish = async (entry, value) => {
        if (!window.confirm(value === 'PUBLISHED'
            ? 'Diese Textur öffentlich freigeben? Entwürfe bieten noch keine separate private PNG-Vorschau. Nur zuvor anhand der administrativen Quelle geprüfte Inhalte veröffentlichen.'
            : 'Diese Textur aus öffentlichen Lesezugriffen verbergen? Bereits heruntergeladene Kopien werden dadurch nicht zurückgerufen.')) return;
        setMutation(entry.texture.textureId); setError('');
        try { await skinApi.admin.setPublication(entry.texture.textureId, value, entry.revision); await resource.reload(); }
        catch (reason) { if (reason.name !== 'AbortError') setError(reason.message); }
        finally { setMutation(''); }
    };
    return <AdminPanel title="Texturen und Veröffentlichung" description="Neue Medien sind DRAFT. Veröffentlichung und Verbergen verwenden exakt die angezeigte Revision; private Herkunftsbezüge bleiben unabhängig davon intern.">
        <div className="flex flex-wrap gap-3 p-5"><label className="text-xs text-zinc-400">Veröffentlichungszustand<select className="admin-forum-input mt-2" value={publication}
            onChange={event => { setCursors(['']); setPublication(event.target.value); }}><option value="">Alle Zustände</option>{['DRAFT', 'PUBLISHED', 'HIDDEN'].map(value => <option key={value}>{value}</option>)}</select></label>
            <button className="admin-forum-secondary self-end" disabled={resource.loading} onClick={resource.reload}>Aktualisieren</button></div>
        {(error || resource.error) && <p role="alert" className="px-5 pb-5 text-sm text-red-300">{error || resource.error}</p>}
        {resource.loading ? <AdminManagementLoading title="Texturverwaltung wird geladen" />
            : !resource.error && resource.data?.items.length ? <div className="grid gap-5 p-5 lg:grid-cols-2">{resource.data.items.map(entry => <article key={entry.texture.textureId} className="min-w-0 rounded-2xl border border-white/[.07] p-4 text-xs">
                {entry.publication === 'PUBLISHED' ? <SkinTexturePreview texture={entry.texture} /> : <div className="flex min-h-28 items-center justify-center rounded-xl bg-black/20 p-4 text-center text-zinc-500">{entry.publication} · Keine private Vorschau-Schnittstelle im aktuellen Backend</div>}
                <p className="mt-4 break-all font-mono text-zinc-400">{entry.texture.textureId}</p><p className="mt-2 text-zinc-500">{entry.publication} · Revision {entry.revision}</p>
                {canPublish && <div className="mt-4 flex flex-wrap gap-2"><button className="admin-forum-secondary" disabled={Boolean(mutation) || entry.publication === 'PUBLISHED'} onClick={() => publish(entry, 'PUBLISHED')}>Öffentlich freigeben</button>
                    <button className="admin-forum-secondary" disabled={Boolean(mutation) || entry.publication === 'HIDDEN'} onClick={() => publish(entry, 'HIDDEN')}>Verbergen</button></div>}
            </article>)}</div> : !resource.error && <AdminManagementEmpty title="Keine Texturen in dieser Ansicht" text="Importierte Ausgangslisten allein erzeugen noch keine Textur. Nur erfolgreich übernommene administrative Proben erscheinen im Katalog." />}
        <nav className="flex justify-between gap-3 p-5" aria-label="Texturverwaltungsseiten"><button className="admin-forum-secondary" disabled={resource.loading || cursors.length < 2} onClick={() => setCursors(values => values.slice(0, -1))}>Zurück</button>
            <button className="admin-forum-secondary" disabled={resource.loading || !resource.data?.nextCursor} onClick={() => setCursors(values => [...values, resource.data.nextCursor])}>Weitere Texturen</button></nav>
    </AdminPanel>;
}

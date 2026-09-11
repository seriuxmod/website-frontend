import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { FaCircleCheck, FaGlobe, FaPlus, FaServer, FaStar, FaTrash, FaUsers } from 'react-icons/fa6';
import { hasAnyPermission } from '../../../lib/auth';
import { socialApi } from '../../../lib/socialApi';
import { AdminMetricCard } from '../AdminUi';
import {
    AdminDataTable,
    AdminManagementEmpty,
    AdminManagementLoading,
    AdminManagementPage,
    AdminPagination,
    AdminPanel,
    StatusPill,
    columnHelper,
    formatDate,
    formatNumber,
    useAdminResource
} from './AdminManagementShared';
import { ServerSearch, UserRef, humanize, pageRows, pageTotal, useServerSearch } from './SocialAdminShared';

const PAGE_SIZE = 25;
const STATUSES = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'DISABLED'];
export default function PublicServersAdminView({ user }) {
    const [input, setInput] = useState('');
    const [query, debouncer] = useServerSearch(input);
    const [page, setPage] = useState(0);
    const [status, setStatus] = useState('');
    const [category, setCategory] = useState('');
    const [selected, setSelected] = useState(null);
    const [editing, setEditing] = useState(false);
    const canWrite = hasAnyPermission(user, 'social.servers.write');
    const canReview = hasAnyPermission(user, 'social.servers.review');
    const loader = useCallback(
        () => socialApi.admin.servers({ q: query, category, status, page, size: PAGE_SIZE }),
        [category, page, query, status]
    );
    const resource = useAdminResource(loader, [loader]);
    const overview = useAdminResource(socialApi.admin.serversOverview, []);
    const rows = pageRows(resource.data);
    useEffect(() => setPage(0), [category, query, status]);
    const reload = () => Promise.all([resource.reload(), overview.reload()]);
    return (
        <AdminManagementPage
            actions={
                canWrite ? (
                    <button
                        className="forum-button-primary"
                        onClick={() => {
                            setSelected(null);
                            setEditing(true);
                        }}
                        type="button"
                    >
                        <FaPlus /> Server eintragen
                    </button>
                ) : null
            }
            backend="Social-Backend"
            description="Öffentliche Minecraft-Server kuratieren, Freigaben dokumentieren und die Darstellung im Community-Verzeichnis steuern."
            error={resource.error || overview.error}
            eyebrow="SERVER-VERZEICHNIS"
            icon={FaGlobe}
            loading={resource.loading || overview.loading}
            onRetry={reload}
            title="Öffentliche Serverliste"
        >
            {resource.loading && !resource.data ? (
                <AdminManagementLoading title="Serververzeichnis wird geladen" />
            ) : (
                <>
                    <ServerMetrics data={overview.data} />
                    <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.3fr)_minmax(390px,.7fr)]">
                        <AdminPanel
                            actions={
                                <div className="flex flex-wrap gap-2">
                                    <input
                                        aria-label="Kategorie filtern"
                                        className="admin-forum-select-compact max-w-40"
                                        maxLength={80}
                                        onChange={(event) => setCategory(event.target.value)}
                                        placeholder="Kategorie"
                                        value={category}
                                    />
                                    <select
                                        className="admin-forum-select-compact"
                                        onChange={(e) => setStatus(e.target.value)}
                                        value={status}
                                    >
                                        <option value="">Alle Status</option>
                                        {STATUSES.map((v) => (
                                            <option key={v}>{v}</option>
                                        ))}
                                    </select>
                                </div>
                            }
                            description="Suche und Statusfilter werden serverseitig angewendet."
                            eyebrow="KATALOG"
                            title="Minecraft-Server"
                        >
                            <div className="border-b border-white/[.05] p-5">
                                <ServerSearch
                                    onChange={setInput}
                                    pending={debouncer.state.isPending}
                                    placeholder="Name, Adresse oder Kategorie …"
                                    value={input}
                                />
                            </div>
                            <ServerTable
                                onOpen={(value) => {
                                    setSelected(value);
                                    setEditing(false);
                                }}
                                rows={rows}
                            />
                            <AdminPagination
                                onPage={setPage}
                                page={Number(resource.data?.page) || 0}
                                size={Number(resource.data?.size) || PAGE_SIZE}
                                total={pageTotal(resource.data)}
                            />
                        </AdminPanel>
                        {editing ? (
                            <ServerEditor
                                server={selected}
                                onCancel={() => setEditing(false)}
                                onSaved={async (value) => {
                                    setSelected(value);
                                    setEditing(false);
                                    await reload();
                                }}
                            />
                        ) : (
                            <ServerDetail
                                canReview={canReview}
                                canWrite={canWrite}
                                onChanged={async () => {
                                    await reload();
                                    setSelected(null);
                                }}
                                onEdit={() => setEditing(true)}
                                server={selected}
                            />
                        )}
                    </section>
                </>
            )}
        </AdminManagementPage>
    );
}
function ServerMetrics({ data }) {
    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminMetricCard
                detail={`${formatNumber(data?.featuredApprovedServers)} hervorgehoben`}
                icon={FaServer}
                label="Server gesamt"
                tone="orange"
                value={formatNumber(data?.totalServers)}
            />
            <AdminMetricCard
                detail="öffentlich sichtbar"
                icon={FaCircleCheck}
                label="Freigegeben"
                tone="emerald"
                value={formatNumber(data?.approvedServers)}
            />
            <AdminMetricCard
                detail="wartet auf Prüfung"
                icon={FaStar}
                label="Offene Prüfungen"
                tone="violet"
                value={formatNumber(data?.pendingReviewServers)}
            />
            <AdminMetricCard
                detail={`von ${formatNumber(data?.reportedPlayerCapacity)} Plätzen`}
                icon={FaUsers}
                label="Spieler online"
                tone="sky"
                value={formatNumber(data?.reportedOnlinePlayers)}
            />
        </section>
    );
}
function ServerTable({ rows, onOpen }) {
    const columns = useMemo(
        () =>
            columnHelper.columns([
                columnHelper.accessor('name', {
                    header: 'Server',
                    cell: (c) => (
                        <div className="flex items-center gap-3">
                            {c.row.original.iconUrl ? (
                                <img
                                    alt=""
                                    className="h-10 w-10 rounded-xl object-cover"
                                    src={c.row.original.iconUrl}
                                />
                            ) : (
                                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[.04] text-zinc-700">
                                    <FaServer />
                                </span>
                            )}
                            <div>
                                <b className="block text-sm text-zinc-200">{c.getValue()}</b>
                                <span className="text-[9px] text-zinc-600">
                                    {c.row.original.canonicalAddress || c.row.original.address}
                                </span>
                            </div>
                        </div>
                    )
                }),
                columnHelper.accessor('category', {
                    header: 'Kategorie',
                    cell: (c) => <span className="text-xs text-zinc-500">{c.getValue()}</span>
                }),
                columnHelper.accessor('onlinePlayers', {
                    header: 'Spieler',
                    cell: (c) => (
                        <b className="text-xs">
                            {formatNumber(c.getValue())} / {formatNumber(c.row.original.maxPlayers)}
                        </b>
                    )
                }),
                columnHelper.accessor('status', {
                    header: 'Status',
                    cell: (c) => <StatusPill value={humanize(c.getValue())} />
                }),
                columnHelper.accessor('updatedAt', {
                    header: 'Aktualisiert',
                    cell: (c) => <time className="text-xs text-zinc-500">{formatDate(c.getValue())}</time>
                }),
                columnHelper.display({
                    id: 'open',
                    header: '',
                    cell: (c) => (
                        <button
                            className="admin-forum-secondary !px-3 !py-2"
                            onClick={() => onOpen(c.row.original)}
                            type="button"
                        >
                            Öffnen
                        </button>
                    )
                })
            ]),
        [onOpen]
    );
    return rows.length ? (
        <AdminDataTable
            columns={columns}
            getSearchValue={(r) => `${r.name} ${r.address} ${r.category}`}
            rows={rows}
            searchPlaceholder="Geladene Seite filtern …"
        />
    ) : (
        <AdminManagementEmpty title="Keine Server gefunden" text="Lege einen Eintrag an oder passe den Filter an." />
    );
}
function ServerDetail({ server, canWrite, canReview, onEdit, onChanged }) {
    if (!server)
        return (
            <AdminPanel className="h-fit" eyebrow="DETAILS" title="Server">
                <AdminManagementEmpty
                    title="Kein Server ausgewählt"
                    text="Öffne links einen Eintrag oder lege einen neuen Server an."
                />
            </AdminPanel>
        );
    const review = async (status) => {
        const note = window.prompt(
            status === 'REJECTED' || status === 'DISABLED'
                ? 'Pflichtbegründung für diese Entscheidung:'
                : 'Interne Prüfnotiz (optional):'
        );
        const normalizedNote = note?.trim();
        if (note === null || ((status === 'REJECTED' || status === 'DISABLED') && !normalizedNote)) return;
        if (normalizedNote.length > 500) {
            window.alert('Die Prüfnotiz darf höchstens 500 Zeichen lang sein.');
            return;
        }
        await socialApi.admin.updateServerStatus(server.id, status, normalizedNote);
        await onChanged();
    };
    const remove = async () => {
        const reason = window.prompt('Pflichtbegründung für das Entfernen:')?.trim();
        if (!reason) return;
        if (reason.length > 500) {
            window.alert('Die Begründung darf höchstens 500 Zeichen lang sein.');
            return;
        }
        await socialApi.admin.deleteServer(server.id, reason);
        await onChanged();
    };
    return (
        <AdminPanel
            actions={
                <>
                    {canWrite && (
                        <button className="admin-forum-secondary" onClick={onEdit} type="button">
                            Bearbeiten
                        </button>
                    )}
                    {canWrite && (
                        <button className="admin-forum-danger" onClick={remove} type="button">
                            <FaTrash /> Entfernen
                        </button>
                    )}
                </>
            }
            className="h-fit"
            eyebrow="DETAILS"
            title={server.name}
        >
            <div className="space-y-5 p-5">
                {server.bannerUrl && (
                    <img
                        alt=""
                        className="aspect-[16/7] w-full rounded-2xl border border-white/[.06] object-cover"
                        src={server.bannerUrl}
                    />
                )}
                <div className="flex flex-wrap gap-2">
                    <StatusPill value={humanize(server.status)} />
                    {server.featured && <StatusPill value="Featured" />}
                </div>
                <p className="text-xs leading-5 text-zinc-500">
                    {server.description || 'Keine Beschreibung hinterlegt.'}
                </p>
                <dl className="grid grid-cols-2 gap-3">
                    <Detail label="Adresse" value={server.address} />
                    <Detail label="Kategorie" value={server.category} />
                    <Detail
                        label="Spieler"
                        value={`${formatNumber(server.onlinePlayers)} / ${formatNumber(server.maxPlayers)}`}
                    />
                    <Detail
                        label="Eingereicht von"
                        value={server.submittedBy?.username || server.submittedBy?.userId || 'System'}
                    />
                </dl>
                {canReview && (
                    <div className="flex flex-wrap gap-2 border-t border-white/[.05] pt-4">
                        <button className="forum-button-primary" onClick={() => review('APPROVED')} type="button">
                            Freigeben
                        </button>
                        <button className="admin-forum-danger" onClick={() => review('REJECTED')} type="button">
                            Ablehnen
                        </button>
                        <button className="admin-forum-secondary" onClick={() => review('DISABLED')} type="button">
                            Deaktivieren
                        </button>
                    </div>
                )}
            </div>
        </AdminPanel>
    );
}
function ServerEditor({ server, onCancel, onSaved }) {
    const [message, setMessage] = useState('');
    const form = useForm({
        defaultValues: values(server),
        onSubmit: async ({ value }) => {
            setMessage('');
            try {
                await onSaved(await socialApi.admin.saveServer(server?.id, payload(value)));
            } catch (error) {
                setMessage(error.message);
            }
        }
    });
    return (
        <AdminPanel
            className="h-fit"
            eyebrow={server ? 'BEARBEITEN' : 'NEU'}
            title={server?.name || 'Server eintragen'}
        >
            <form
                className="space-y-4 p-5"
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field form={form} label="Name" name="name" required />
                    <Field form={form} label="Adresse" name="address" required />
                    <Field form={form} label="Kategorie" name="category" required />
                    <Field form={form} label="Sortierung" name="sortOrder" type="number" />
                    <Field form={form} label="Spieler online" name="onlinePlayers" type="number" />
                    <Field form={form} label="Max. Spieler" name="maxPlayers" type="number" />
                </div>
                <Field form={form} label="Webseite" name="websiteUrl" type="url" />
                <Field form={form} label="Icon-URL" name="iconUrl" type="url" />
                <Field form={form} label="Banner-URL" name="bannerUrl" type="url" />
                <Field form={form} label="Tags (Komma-getrennt)" name="tags" />
                <Field form={form} label="Versionen (Komma-getrennt)" name="versions" />
                <form.Field name="description">
                    {(field) => (
                        <label className="admin-forum-field">
                            <span>Beschreibung</span>
                            <textarea
                                className="admin-forum-input min-h-24"
                                onChange={(e) => field.handleChange(e.target.value)}
                                value={field.state.value}
                            />
                        </label>
                    )}
                </form.Field>
                <form.Field name="featured">
                    {(field) => (
                        <label className="flex items-center gap-3 text-xs text-zinc-400">
                            <input
                                checked={field.state.value}
                                onChange={(e) => field.handleChange(e.target.checked)}
                                type="checkbox"
                            />{' '}
                            Auf der Serverliste hervorheben
                        </label>
                    )}
                </form.Field>
                {message && <p className="text-xs text-red-300">{message}</p>}
                <div className="flex justify-end gap-2 border-t border-white/[.05] pt-4">
                    <button className="admin-forum-secondary" onClick={onCancel} type="button">
                        Abbrechen
                    </button>
                    <button className="forum-button-primary" type="submit">
                        Speichern
                    </button>
                </div>
            </form>
        </AdminPanel>
    );
}
function Field({ form, name, label, type = 'text', required = false }) {
    return (
        <form.Field name={name}>
            {(field) => (
                <label className="admin-forum-field">
                    <span>{label}</span>
                    <input
                        className="admin-forum-input"
                        onChange={(e) => field.handleChange(e.target.value)}
                        required={required}
                        type={type}
                        value={field.state.value}
                    />
                </label>
            )}
        </form.Field>
    );
}
function Detail({ label, value }) {
    return (
        <div className="rounded-xl border border-white/[.05] bg-black/15 p-3">
            <dt className="text-[8px] uppercase tracking-wider text-zinc-600">{label}</dt>
            <dd className="mt-1 break-words text-xs font-bold text-zinc-300">{value || '—'}</dd>
        </div>
    );
}
function split(v) {
    return String(v || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
}
function values(s) {
    return {
        name: s?.name || '',
        address: s?.address || '',
        websiteUrl: s?.websiteUrl || '',
        iconUrl: s?.iconUrl || '',
        bannerUrl: s?.bannerUrl || '',
        description: s?.description || '',
        category: s?.category || '',
        tags: (s?.tags || []).join(', '),
        versions: (s?.supportedVersions || []).join(', '),
        onlinePlayers: String(s?.onlinePlayers ?? ''),
        maxPlayers: String(s?.maxPlayers ?? ''),
        featured: Boolean(s?.featured),
        sortOrder: String(s?.sortOrder || 0)
    };
}
function payload(v) {
    return {
        name: v.name.trim(),
        address: v.address.trim(),
        websiteUrl: v.websiteUrl.trim() || null,
        iconUrl: v.iconUrl.trim() || null,
        bannerUrl: v.bannerUrl.trim() || null,
        description: v.description.trim() || null,
        category: v.category.trim(),
        tags: split(v.tags),
        supportedVersions: split(v.versions),
        onlinePlayers: v.onlinePlayers === '' ? null : Number(v.onlinePlayers),
        maxPlayers: v.maxPlayers === '' ? null : Number(v.maxPlayers),
        featured: v.featured,
        sortOrder: Number(v.sortOrder) || 0
    };
}

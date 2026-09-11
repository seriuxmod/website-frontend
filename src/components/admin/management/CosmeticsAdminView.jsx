import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useDebouncedValue } from '@tanstack/react-pacer';
import {
    FaBoxArchive,
    FaCircleCheck,
    FaGift,
    FaLink,
    FaMagnifyingGlass,
    FaPlus,
    FaShirt,
    FaSpinner,
    FaTrash,
    FaUserPlus,
    FaUsers
} from 'react-icons/fa6';
import { hasAnyPermission } from '../../../lib/auth';
import { storeApi } from '../../../lib/storeApi';
import { AdminMetricCard } from '../AdminUi';
import {
    AdminDataTable,
    AdminManagementEmpty,
    AdminManagementError,
    AdminManagementLoading,
    AdminManagementPage,
    AdminPagination,
    AdminPanel,
    StatusPill,
    columnHelper,
    formatDate,
    formatNumber,
    shortId,
    useAdminResource
} from './AdminManagementShared';

const PAGE_SIZE = 25;
const TYPES = ['CAPE', 'HAT', 'WINGS', 'BADGE', 'CLOAK', 'PET', 'EMOTE', 'OTHER'];
const VISIBILITIES = ['PUBLIC', 'STORE', 'SEASONAL', 'INTERNAL', 'ARCHIVED'];
const STATUSES = ['DRAFT', 'SCHEDULED', 'ACTIVE', 'DISABLED', 'ARCHIVED'];
const SOURCES = ['ADMIN', 'EVENT', 'MIGRATION', 'PURCHASE'];

export default function CosmeticsAdminView({ user }) {
    const [input, setInput] = useState('');
    const [query, debouncer] = useDebouncedValue(input, { wait: 300 }, (state) => ({ isPending: state.isPending }));
    const [page, setPage] = useState(0);
    const [type, setType] = useState('');
    const [status, setStatus] = useState('');
    const [selectedId, setSelectedId] = useState('');
    const [editing, setEditing] = useState(false);
    const loader = useCallback(
        () => storeApi.admin.cosmetics({ page, size: PAGE_SIZE, q: query.trim(), type, status }),
        [page, query, status, type]
    );
    const resource = useAdminResource(loader, [loader]);
    const rows = useMemo(() => normalizeRows(resource.data), [resource.data]);
    const selected = rows.find((row) => row.id === selectedId) || null;
    const canWrite = hasAnyPermission(user, 'store.cosmetics.write');
    const canReadOwners = hasAnyPermission(user, 'store.cosmetics.owners.read');
    const canWriteOwners = hasAnyPermission(user, 'store.cosmetics.owners.write');

    useEffect(() => setPage(0), [query, status, type]);
    useEffect(() => {
        if (selectedId && !selected && !resource.loading) setSelectedId('');
    }, [resource.loading, selected, selectedId]);

    const reload = async () => resource.reload();
    return (
        <AdminManagementPage
            actions={
                canWrite ? (
                    <button
                        className="forum-button-primary"
                        onClick={() => {
                            setSelectedId('');
                            setEditing(true);
                        }}
                        type="button"
                    >
                        <FaPlus /> Cosmetic anlegen
                    </button>
                ) : null
            }
            backend="Store-Backend"
            description="Cosmetic-Assets, Shop-Verknüpfungen und individuelle Freischaltungen aus dem persistenten Store-Katalog verwalten."
            error={resource.error}
            eyebrow="LIVE-KATALOG"
            icon={FaGift}
            loading={resource.loading}
            onRetry={reload}
            title="Cosmetics"
        >
            {resource.loading && !resource.data ? (
                <AdminManagementLoading title="Cosmetic-Katalog wird geladen" />
            ) : (
                <>
                    <CosmeticMetrics data={resource.data} rows={rows} />
                    <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.3fr)_minmax(390px,.7fr)]">
                        <AdminPanel
                            actions={
                                <div className="flex flex-wrap gap-2">
                                    <select
                                        aria-label="Cosmetic-Typ filtern"
                                        className="admin-forum-select-compact"
                                        onChange={(event) => setType(event.target.value)}
                                        value={type}
                                    >
                                        <option value="">Alle Typen</option>
                                        {TYPES.map((value) => (
                                            <option key={value}>{value}</option>
                                        ))}
                                    </select>
                                    <select
                                        aria-label="Status filtern"
                                        className="admin-forum-select-compact"
                                        onChange={(event) => setStatus(event.target.value)}
                                        value={status}
                                    >
                                        <option value="">Alle Status</option>
                                        {STATUSES.map((value) => (
                                            <option key={value}>{value}</option>
                                        ))}
                                    </select>
                                </div>
                            }
                            description="Die Suche und Filter werden serverseitig ausgeführt."
                            eyebrow="KATALOG"
                            title="Cosmetic-Bestand"
                        >
                            <ServerSearch input={input} pending={debouncer.state.isPending} setInput={setInput} />
                            <CosmeticTable
                                rows={rows}
                                onOpen={(id) => {
                                    setSelectedId(id);
                                    setEditing(false);
                                }}
                            />
                            <AdminPagination
                                page={Number(resource.data?.page) || 0}
                                size={Number(resource.data?.size) || PAGE_SIZE}
                                total={Number(resource.data?.total) || 0}
                                onPage={setPage}
                            />
                        </AdminPanel>
                        {editing ? (
                            <CosmeticEditor
                                cosmetic={selected}
                                onCancel={() => setEditing(false)}
                                onSaved={async (value) => {
                                    setEditing(false);
                                    setSelectedId(value?.cosmetic?.id || value?.id || selectedId);
                                    await reload();
                                }}
                            />
                        ) : (
                            <CosmeticDetail
                                canReadOwners={canReadOwners}
                                canWrite={canWrite}
                                canWriteOwners={canWriteOwners}
                                cosmetic={selected}
                                onDeleted={async () => {
                                    setSelectedId('');
                                    await reload();
                                }}
                                onEdit={() => setEditing(true)}
                            />
                        )}
                    </section>
                </>
            )}
        </AdminManagementPage>
    );
}

function CosmeticMetrics({ data, rows }) {
    const active = rows.filter((row) => row.status === 'ACTIVE').length;
    const owners = rows.reduce((sum, row) => sum + Number(row.ownerCount || 0), 0);
    const products = rows.filter((row) => row.storeProductId).length;
    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminMetricCard
                detail="persistierte Katalogeinträge"
                icon={FaShirt}
                label="Cosmetics gesamt"
                tone="orange"
                value={formatNumber(data?.total)}
            />
            <AdminMetricCard
                detail="auf dieser Ergebnisseite"
                icon={FaCircleCheck}
                label="Aktiv"
                tone="emerald"
                value={formatNumber(active)}
            />
            <AdminMetricCard
                detail="für sichtbare Einträge"
                icon={FaUsers}
                label="Freischaltungen"
                tone="violet"
                value={formatNumber(owners)}
            />
            <AdminMetricCard
                detail="mit Store-Produkt verbunden"
                icon={FaLink}
                label="Shop-Verknüpfungen"
                tone="sky"
                value={formatNumber(products)}
            />
        </section>
    );
}

function ServerSearch({ input, setInput, pending }) {
    return (
        <div className="border-b border-white/[.05] px-5 py-4 sm:px-6">
            <label className="relative block w-full">
                <span className="sr-only">Cosmetics serverseitig durchsuchen</span>
                <FaMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-zinc-600" />
                <input
                    className="h-11 w-full rounded-xl border border-white/[.075] bg-[#0b0c10] pl-10 pr-10 text-xs text-zinc-200 outline-none transition placeholder:text-zinc-700 focus:border-orange-400/35"
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Name oder Slug suchen …"
                    type="search"
                    value={input}
                />
                {pending && (
                    <FaSpinner className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-xs text-orange-300" />
                )}
            </label>
        </div>
    );
}

function CosmeticTable({ rows, onOpen }) {
    const columns = useMemo(
        () =>
            columnHelper.columns([
                columnHelper.accessor('name', {
                    header: 'Cosmetic',
                    cell: (context) => (
                        <div className="flex items-center gap-3">
                            <CosmeticPreview cosmetic={context.row.original} compact />
                            <div>
                                <b className="block text-sm text-zinc-200">{context.getValue()}</b>
                                <span className="font-mono text-[9px] text-zinc-600">{context.row.original.slug}</span>
                            </div>
                        </div>
                    )
                }),
                columnHelper.accessor('type', {
                    header: 'Typ',
                    cell: (context) => <span className="text-xs text-zinc-500">{humanize(context.getValue())}</span>
                }),
                columnHelper.accessor('status', {
                    header: 'Status',
                    cell: (context) => <StatusPill value={humanize(context.getValue())} />
                }),
                columnHelper.accessor('visibility', {
                    header: 'Sichtbarkeit',
                    cell: (context) => <span className="text-xs text-zinc-500">{humanize(context.getValue())}</span>
                }),
                columnHelper.accessor('ownerCount', {
                    header: 'Besitzer',
                    cell: (context) => <b className="text-xs">{formatNumber(context.getValue())}</b>
                }),
                columnHelper.display({
                    id: 'actions',
                    header: '',
                    cell: (context) => (
                        <button
                            className="admin-forum-secondary !px-3 !py-2"
                            onClick={() => onOpen(context.row.original.id)}
                            type="button"
                        >
                            Öffnen
                        </button>
                    )
                })
            ]),
        [onOpen]
    );
    return (
        <AdminDataTable
            columns={columns}
            emptyText="Lege den ersten Eintrag an, sobald ein geprüftes Asset bereitsteht."
            emptyTitle="Noch keine Cosmetics im Katalog"
            getSearchValue={(row) => `${row.name} ${row.slug} ${row.type} ${row.status}`}
            rows={rows}
            searchPlaceholder="Geladene Seite filtern …"
        />
    );
}

function CosmeticDetail({ cosmetic, canWrite, canReadOwners, canWriteOwners, onEdit, onDeleted }) {
    if (!cosmetic) {
        return (
            <AdminPanel className="h-fit" eyebrow="DETAILS" title="Cosmetic">
                <AdminManagementEmpty
                    title="Kein Eintrag ausgewählt"
                    text="Öffne links ein Cosmetic oder lege einen neuen Katalogeintrag an."
                />
            </AdminPanel>
        );
    }
    const deleteItem = async () => {
        if (!window.confirm(`„${cosmetic.name}“ archivieren und aus dem öffentlichen Katalog entfernen?`)) return;
        await storeApi.admin.deleteCosmetic(cosmetic.id);
        await onDeleted();
    };
    return (
        <div className="space-y-6">
            <AdminPanel
                actions={
                    canWrite ? (
                        <>
                            <button className="admin-forum-secondary" onClick={onEdit} type="button">
                                Bearbeiten
                            </button>
                            <button className="admin-forum-danger" onClick={deleteItem} type="button">
                                <FaTrash /> Archivieren
                            </button>
                        </>
                    ) : null
                }
                className="h-fit"
                eyebrow="DETAILS"
                title={cosmetic.name}
            >
                <div className="space-y-5 p-5 sm:p-6">
                    <CosmeticPreview cosmetic={cosmetic} />
                    <div className="flex flex-wrap gap-2">
                        <StatusPill value={humanize(cosmetic.status)} />
                        <StatusPill value={humanize(cosmetic.visibility)} />
                        <StatusPill value={humanize(cosmetic.type)} />
                    </div>
                    <p className="text-xs leading-5 text-zinc-500">
                        {cosmetic.description || 'Keine Beschreibung hinterlegt.'}
                    </p>
                    <dl className="grid grid-cols-2 gap-3">
                        <Detail label="Besitzer" value={formatNumber(cosmetic.ownerCount)} />
                        <Detail label="Sortierung" value={formatNumber(cosmetic.sortOrder)} />
                        <Detail
                            label="Store-Produkt"
                            value={cosmetic.storeProductId ? shortId(cosmetic.storeProductId) : 'Nicht verknüpft'}
                        />
                        <Detail label="Aktualisiert" value={formatDate(cosmetic.updatedAt)} />
                    </dl>
                    {!!cosmetic.tags?.length && <TagList values={cosmetic.tags} />}
                </div>
            </AdminPanel>
            {canReadOwners ? <CosmeticOwners cosmetic={cosmetic} canWrite={canWriteOwners} /> : null}
        </div>
    );
}

function CosmeticOwners({ cosmetic, canWrite }) {
    const [page, setPage] = useState(0);
    const loader = useCallback(() => storeApi.admin.cosmeticOwners(cosmetic.id, page, PAGE_SIZE), [cosmetic.id, page]);
    const owners = useAdminResource(loader, [loader]);
    const [userId, setUserId] = useState('');
    const [source, setSource] = useState('ADMIN');
    const [message, setMessage] = useState('');
    const rows = owners.data?.items || [];
    const grant = async (event) => {
        event.preventDefault();
        if (!userId.trim()) return;
        setMessage('');
        try {
            await storeApi.admin.grantCosmetic(cosmetic.id, userId.trim(), { source });
            setUserId('');
            await owners.reload();
        } catch (error) {
            setMessage(error.message);
        }
    };
    return (
        <AdminPanel className="h-fit" eyebrow="FREISCHALTUNGEN" title="Besitzer">
            {canWrite && (
                <form
                    className="grid gap-2 border-b border-white/[.05] p-5 sm:grid-cols-[1fr_130px_auto]"
                    onSubmit={grant}
                >
                    <input
                        className="admin-forum-input !mt-0"
                        onChange={(event) => setUserId(event.target.value)}
                        placeholder="Benutzer-UUID"
                        required
                        value={userId}
                    />
                    <select
                        className="admin-forum-input !mt-0"
                        onChange={(event) => setSource(event.target.value)}
                        value={source}
                    >
                        {SOURCES.map((value) => (
                            <option key={value}>{value}</option>
                        ))}
                    </select>
                    <button className="forum-button-primary" type="submit">
                        <FaUserPlus /> Gewähren
                    </button>
                    {message && <p className="text-[10px] text-red-300 sm:col-span-3">{message}</p>}
                </form>
            )}
            {owners.loading ? (
                <div className="p-5">
                    <AdminManagementLoading title="Freischaltungen werden geladen" />
                </div>
            ) : owners.error ? (
                <div className="p-5">
                    <AdminManagementError message={owners.error} retry={owners.reload} />
                </div>
            ) : rows.length ? (
                <div className="divide-y divide-white/[.045]">
                    {rows.map((owner) => (
                        <div className="flex items-center justify-between gap-4 px-5 py-4" key={owner.id}>
                            <div className="min-w-0">
                                <b className="block truncate font-mono text-[10px] text-zinc-300">{owner.userId}</b>
                                <span className="mt-1 block text-[9px] text-zinc-600">
                                    {humanize(owner.source)} · {formatDate(owner.grantedAt)}
                                </span>
                            </div>
                            {canWrite && (
                                <button
                                    aria-label="Freischaltung entziehen"
                                    className="admin-forum-danger !px-3 !py-2"
                                    onClick={async () => {
                                        if (!window.confirm('Freischaltung wirklich entziehen?')) return;
                                        await storeApi.admin.revokeCosmetic(cosmetic.id, owner.userId);
                                        await owners.reload();
                                    }}
                                    type="button"
                                >
                                    <FaTrash />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <AdminManagementEmpty
                    title="Keine Freischaltungen"
                    text="Dieses Cosmetic wurde noch keinem Benutzer gewährt."
                />
            )}
            <AdminPagination
                page={Number(owners.data?.page) || page}
                size={Number(owners.data?.size) || PAGE_SIZE}
                total={Number(owners.data?.total) || 0}
                onPage={setPage}
            />
        </AdminPanel>
    );
}

function CosmeticEditor({ cosmetic, onCancel, onSaved }) {
    const [message, setMessage] = useState('');
    const form = useForm({
        defaultValues: formValues(cosmetic),
        onSubmit: async ({ value }) => {
            setMessage('');
            try {
                const saved = await storeApi.admin.saveCosmetic(cosmetic?.id, toPayload(value));
                await onSaved(saved);
            } catch (error) {
                setMessage(error.message);
            }
        }
    });
    return (
        <AdminPanel
            className="h-fit"
            eyebrow={cosmetic ? 'BEARBEITEN' : 'NEU'}
            title={cosmetic ? cosmetic.name : 'Cosmetic anlegen'}
        >
            <form
                className="space-y-4 p-5 sm:p-6"
                onSubmit={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField form={form} label="Name" name="name" required />
                    <TextField form={form} label="Slug" name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required />
                    <SelectField form={form} label="Typ" name="type" options={TYPES} />
                    <SelectField form={form} label="Status" name="status" options={STATUSES} />
                    <SelectField form={form} label="Sichtbarkeit" name="visibility" options={VISIBILITIES} />
                    <TextField form={form} label="Sortierung" name="sortOrder" type="number" />
                </div>
                <TextField form={form} label="Asset-URL" name="assetUrl" required type="url" />
                <TextField form={form} label="Vorschaubild-URL" name="previewImageUrl" type="url" />
                <TextField form={form} label="Store-Produkt-ID" name="storeProductId" />
                <TextField form={form} label="Tags (Komma-getrennt)" name="tags" />
                <TextField form={form} label="Minecraft-Versionen (Komma-getrennt)" name="versions" />
                <form.Field name="description">
                    {(field) => (
                        <label className="admin-forum-field">
                            <span>Beschreibung</span>
                            <textarea
                                className="admin-forum-input min-h-28 resize-y"
                                onBlur={field.handleBlur}
                                onChange={(event) => field.handleChange(event.target.value)}
                                value={field.state.value}
                            />
                        </label>
                    )}
                </form.Field>
                {message && (
                    <p className="rounded-xl border border-red-400/15 bg-red-400/[.05] p-3 text-xs text-red-300">
                        {message}
                    </p>
                )}
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

function TextField({ form, name, label, type = 'text', required = false, pattern }) {
    return (
        <form.Field name={name}>
            {(field) => (
                <label className="admin-forum-field">
                    <span>{label}</span>
                    <input
                        className="admin-forum-input"
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        pattern={pattern}
                        required={required}
                        type={type}
                        value={field.state.value}
                    />
                </label>
            )}
        </form.Field>
    );
}
function SelectField({ form, name, label, options }) {
    return (
        <form.Field name={name}>
            {(field) => (
                <label className="admin-forum-field">
                    <span>{label}</span>
                    <select
                        className="admin-forum-input"
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        value={field.state.value}
                    >
                        {options.map((value) => (
                            <option key={value}>{value}</option>
                        ))}
                    </select>
                </label>
            )}
        </form.Field>
    );
}
function CosmeticPreview({ cosmetic, compact = false }) {
    const size = compact ? 'h-11 w-11 rounded-xl' : 'aspect-[16/9] w-full rounded-2xl';
    return cosmetic.previewImageUrl ? (
        <img
            alt={`Vorschau von ${cosmetic.name}`}
            className={`${size} border border-white/[.07] bg-black/20 object-cover`}
            loading="lazy"
            src={cosmetic.previewImageUrl}
        />
    ) : (
        <span
            className={`grid ${size} shrink-0 place-items-center border border-white/[.07] bg-black/20 text-zinc-700`}
        >
            <FaGift />
        </span>
    );
}
function Detail({ label, value }) {
    return (
        <div className="rounded-xl border border-white/[.05] bg-black/15 p-3">
            <dt className="text-[8px] font-extrabold uppercase tracking-wider text-zinc-600">{label}</dt>
            <dd className="mt-1 break-words text-xs font-bold text-zinc-300">{value}</dd>
        </div>
    );
}
function TagList({ values }) {
    return (
        <div className="flex flex-wrap gap-2">
            {values.map((value) => (
                <span
                    className="rounded-full border border-orange-400/10 bg-orange-400/[.05] px-2.5 py-1 text-[9px] font-bold text-orange-200/70"
                    key={value}
                >
                    {value}
                </span>
            ))}
        </div>
    );
}
function normalizeRows(payload) {
    return (payload?.items || []).map((entry) => ({
        ...(entry.cosmetic || entry),
        ownerCount: Number(entry.ownerCount || 0)
    }));
}
function humanize(value) {
    return String(value || 'Unbekannt')
        .replaceAll('_', ' ')
        .toLocaleLowerCase('de-DE')
        .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}
function listValue(value) {
    return Array.isArray(value) ? value.join(', ') : '';
}
function splitList(value) {
    return String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}
function formValues(cosmetic) {
    return {
        name: cosmetic?.name || '',
        slug: cosmetic?.slug || '',
        description: cosmetic?.description || '',
        type: cosmetic?.type || 'OTHER',
        visibility: cosmetic?.visibility || 'PUBLIC',
        status: cosmetic?.status || 'DRAFT',
        assetUrl: cosmetic?.assetUrl || '',
        previewImageUrl: cosmetic?.previewImageUrl || '',
        storeProductId: cosmetic?.storeProductId || '',
        tags: listValue(cosmetic?.tags),
        versions: listValue(cosmetic?.supportedMinecraftVersions),
        sortOrder: String(cosmetic?.sortOrder || 0)
    };
}
function toPayload(value) {
    return {
        slug: value.slug.trim(),
        name: value.name.trim(),
        description: value.description.trim() || null,
        type: value.type,
        visibility: value.visibility,
        status: value.status,
        assetUrl: value.assetUrl.trim(),
        previewImageUrl: value.previewImageUrl.trim() || null,
        storeProductId: value.storeProductId.trim() || null,
        tags: splitList(value.tags),
        supportedMinecraftVersions: splitList(value.versions),
        availableFrom: null,
        availableUntil: null,
        sortOrder: Number(value.sortOrder) || 0
    };
}

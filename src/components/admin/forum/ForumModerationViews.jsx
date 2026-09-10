import { useCallback, useMemo, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { Link } from 'react-router-dom';
import {
    FaArrowUpRightFromSquare,
    FaCheck,
    FaEye,
    FaFlag,
    FaFolderPlus,
    FaLightbulb,
    FaMagnifyingGlass,
    FaPlus,
    FaThumbsDown,
    FaThumbsUp,
    FaTrash,
    FaUserShield
} from 'react-icons/fa6';
import { suggestionsApi } from '../../../lib/communityApi';
import { forumApi } from '../../../lib/forumApi';
import { AdminEmptyState, AdminMetricCard } from '../AdminUi';
import {
    ForumAdminPage,
    ForumAdminError,
    ForumLoading,
    ForumPanel,
    LiveDataTable,
    StatusPill,
    columnHelper,
    formatDate,
    formatNumber,
    useForumResource
} from './AdminForumShared';

const REPORT_STATUSES = [
    ['', 'Alle'],
    ['OPEN', 'Offen'],
    ['IN_REVIEW', 'In Prüfung'],
    ['RESOLVED', 'Erledigt'],
    ['REJECTED', 'Abgelehnt'],
    ['CLOSED', 'Geschlossen']
];

export function ForumReportsView() {
    const [filter, setFilter] = useState('OPEN');
    const [page, setPage] = useState(0);
    const [actionError, setActionError] = useState('');
    const [selectedId, setSelectedId] = useState('');
    const loader = useCallback(() => forumApi.admin.reports(page, 25, filter), [filter, page]);
    const resource = useForumResource(loader, [loader]);
    const response = resource.data || { items: [], total: 0, page: 0, size: 25 };
    const rows = response.items || [];
    const pageCount = Math.max(1, Math.ceil((Number(response.total) || 0) / (Number(response.size) || 25)));

    const changeStatus = useCallback(
        async (report, status) => {
            setActionError('');
            try {
                await forumApi.admin.updateReport(report.id, status);
                await resource.reload();
            } catch (error) {
                setActionError(error.message);
            }
        },
        [resource]
    );

    const columns = useMemo(
        () =>
            columnHelper.columns([
                columnHelper.accessor('targetType', {
                    header: 'Ziel',
                    cell: (context) => (
                        <div>
                            <b className="block max-w-56 truncate text-xs text-zinc-200">
                                {context.row.original.targetSnapshot?.title || context.getValue()}
                            </b>
                            <span className="mt-1 block max-w-44 truncate font-mono text-[9px] text-zinc-700">
                                {context.getValue()} · {context.row.original.targetId}
                            </span>
                        </div>
                    )
                }),
                columnHelper.accessor('reason', {
                    header: 'Meldegrund',
                    cell: (context) => <p className="max-w-md text-xs leading-5 text-zinc-400">{context.getValue()}</p>
                }),
                columnHelper.accessor('reporterUserId', {
                    header: 'Gemeldet von',
                    cell: (context) => <code className="text-[10px] text-zinc-500">{shortId(context.getValue())}</code>
                }),
                columnHelper.accessor('createdAt', {
                    header: 'Eingang',
                    cell: (context) => (
                        <time className="whitespace-nowrap text-xs text-zinc-500">
                            {formatDate(context.getValue())}
                        </time>
                    )
                }),
                columnHelper.accessor('status', {
                    header: 'Status',
                    cell: (context) => <StatusPill value={translateReportStatus(context.getValue())} />
                }),
                columnHelper.accessor('assignedToUserId', {
                    header: 'Zugewiesen',
                    cell: (context) => <code className="text-[10px] text-zinc-500">{shortId(context.getValue())}</code>
                }),
                columnHelper.display({
                    id: 'actions',
                    header: 'Aktion',
                    cell: (context) => (
                        <div className="flex gap-2">
                            <button
                                className="admin-forum-secondary py-2"
                                onClick={() => setSelectedId(context.row.original.id)}
                                type="button"
                            >
                                Details
                            </button>
                            {context.row.original.status === 'OPEN' && (
                                <button
                                    className="admin-forum-secondary py-2 text-amber-200"
                                    onClick={() => changeStatus(context.row.original, 'IN_REVIEW')}
                                    type="button"
                                >
                                    Prüfen
                                </button>
                            )}
                        </div>
                    )
                })
            ]),
        [changeStatus]
    );

    return (
        <ForumAdminPage
            actions={
                <div className="flex rounded-xl border border-white/[.07] bg-[#0b0c10] p-1">
                    {REPORT_STATUSES.map(([value, label]) => (
                        <button
                            className={`rounded-lg px-3 py-2 text-[10px] font-extrabold transition ${filter === value ? 'bg-orange-500 text-white' : 'text-zinc-500 hover:text-white'}`}
                            key={value || 'all'}
                            onClick={() => {
                                setFilter(value);
                                setPage(0);
                            }}
                            type="button"
                        >
                            {label}
                        </button>
                    ))}
                </div>
            }
            description="Gemeldete Beiträge und Themen nachvollziehbar prüfen und nach Abschluss aus der offenen Warteschlange entfernen."
            error={resource.error}
            eyebrow="MODERATION"
            icon={FaFlag}
            loading={resource.loading}
            onRetry={resource.reload}
            title="Forum-Meldungen"
        >
            {resource.loading || !resource.data ? (
                <ForumLoading title="Meldungen werden geladen" />
            ) : (
                <>
                    <section className="grid gap-4 sm:grid-cols-3">
                        <AdminMetricCard
                            detail={`Filter: ${REPORT_STATUSES.find(([value]) => value === filter)?.[1]}`}
                            icon={FaFlag}
                            label="Treffer gesamt"
                            tone="orange"
                            value={formatNumber(response.total)}
                        />
                        <AdminMetricCard
                            detail="in dieser Tabellenansicht"
                            icon={FaEye}
                            label="Geladen"
                            tone="sky"
                            value={formatNumber(rows.length)}
                        />
                        <AdminMetricCard
                            detail="durch Rechte geschützter Vorgang"
                            icon={FaUserShield}
                            label="Bearbeitungsmodus"
                            tone="emerald"
                            value="Admin-API"
                        />
                    </section>
                    {actionError && (
                        <p className="mt-5 rounded-xl border border-red-400/15 bg-red-400/[.05] px-4 py-3 text-xs text-red-300">
                            {actionError}
                        </p>
                    )}
                    <section className="mt-6">
                        <ForumPanel
                            description="Von der offenen Meldung über die Prüfung bis zur dokumentierten Entscheidung."
                            eyebrow="PRÜFWARTESCHLANGE"
                            title="Gemeldete Inhalte"
                        >
                            <LiveDataTable
                                columns={columns}
                                emptyText="Für den gewählten Status liegen keine Meldungen vor."
                                emptyTitle="Warteschlange ist leer"
                                getSearchValue={(row) =>
                                    `${row.reason} ${row.targetType} ${row.targetId} ${row.reporterUserId}`
                                }
                                rows={rows}
                                searchPlaceholder="Meldungen durchsuchen …"
                            />
                            {response.total > response.size && (
                                <Pagination page={page} pages={pageCount} setPage={setPage} />
                            )}
                        </ForumPanel>
                    </section>
                    {selectedId && (
                        <section className="mt-6">
                            <ReportDetails key={selectedId} onListChanged={resource.reload} reportId={selectedId} />
                        </section>
                    )}
                </>
            )}
        </ForumAdminPage>
    );
}

function ReportDetails({ reportId, onListChanged }) {
    const loader = useCallback(() => forumApi.admin.report(reportId), [reportId]);
    const resource = useForumResource(loader, [loader]);

    if (resource.loading || !resource.data) {
        return resource.error ? (
            <ForumAdminError message={resource.error} retry={resource.reload} />
        ) : (
            <ForumLoading
                title="Meldungsbeleg wird geladen"
                text="Die vollständigen Detaildaten werden aus der geschützten Admin-API geladen."
            />
        );
    }

    return (
        <ReportEditor
            initial={resource.data}
            onChanged={async () => {
                await Promise.all([resource.reload(), onListChanged()]);
            }}
        />
    );
}

function ReportEditor({ initial, onChanged }) {
    const [message, setMessage] = useState({ error: '', success: '' });
    const [showFullSnapshot, setShowFullSnapshot] = useState(false);
    const targetTopicId = initial.topicId || (initial.targetType === 'TOPIC' ? initial.targetId : '');
    const form = useForm({
        defaultValues: {
            status: initial.status || 'OPEN',
            assignedToUserId: initial.assignedToUserId || '',
            moderatorNote: initial.moderatorNote || ''
        },
        onSubmit: async ({ value }) => {
            setMessage({ error: '', success: '' });
            try {
                await forumApi.admin.updateReport(initial.id, {
                    status: value.status,
                    assignedToUserId: value.assignedToUserId.trim(),
                    moderatorNote: value.moderatorNote.trim()
                });
                setMessage({ error: '', success: 'Meldung wurde aktualisiert.' });
                await onChanged();
            } catch (error) {
                setMessage({ error: error.message, success: '' });
            }
        }
    });
    return (
        <ForumPanel
            actions={
                targetTopicId ? (
                    <Link className="admin-forum-secondary" to={`/forum/topic/${encodeURIComponent(targetTopicId)}`}>
                        <FaArrowUpRightFromSquare /> Original öffnen
                    </Link>
                ) : null
            }
            description={`Ziel ${initial.targetType} · ${initial.targetId}`}
            eyebrow="MELDUNGSDETAILS"
            title={initial.reason}
        >
            <form
                className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2"
                onSubmit={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <EvidenceIntegritySummary
                    hash={initial.targetSnapshot?.contentSha256}
                    status={initial.evidenceIntegrityStatus}
                />
                {initial.targetSnapshot ? (
                    <div className="rounded-xl border border-sky-400/15 bg-sky-400/[.04] px-4 py-4 lg:col-span-2">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <span className="text-[9px] font-extrabold uppercase tracking-[.13em] text-sky-300/70">
                                    Inhalts-Snapshot zum Meldezeitpunkt
                                </span>
                                <b className="mt-2 block text-sm text-sky-50">
                                    {initial.targetSnapshot.title || `${initial.targetType} ${initial.targetId}`}
                                </b>
                            </div>
                            <span className="text-[10px] text-sky-100/45">
                                {formatDate(initial.targetSnapshot.targetCreatedAt)}
                            </span>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-sky-100/65">
                            {showFullSnapshot
                                ? initial.targetSnapshot.content
                                : initial.targetSnapshot.contentExcerpt ||
                                  'Für dieses Ziel wurde kein Textinhalt gespeichert.'}
                        </p>
                        {initial.targetSnapshot.content &&
                            initial.targetSnapshot.content !== initial.targetSnapshot.contentExcerpt && (
                                <button
                                    className="admin-forum-secondary mt-4"
                                    onClick={() => setShowFullSnapshot((visible) => !visible)}
                                    type="button"
                                >
                                    <FaEye />{' '}
                                    {showFullSnapshot ? 'Vorschau einklappen' : 'Vollständigen Snapshot anzeigen'}
                                </button>
                            )}
                        {initial.targetSnapshot.authorUserId && (
                            <span className="mt-3 block font-mono text-[9px] text-sky-100/40">
                                Autor: {initial.targetSnapshot.authorUserId}
                            </span>
                        )}
                    </div>
                ) : (
                    <p className="rounded-xl border border-amber-400/15 bg-amber-400/[.04] px-4 py-3 text-xs leading-5 text-amber-100/65 lg:col-span-2">
                        Für diese Meldung wurde kein Inhalts-Snapshot gespeichert. Prüfe den aktuellen Inhalt am
                        Originalziel; ein Vergleich mit dem Zustand zum Meldezeitpunkt ist nicht möglich.
                    </p>
                )}
                <form.Field name="status">
                    {(field) => (
                        <label className="admin-forum-field">
                            <span>Bearbeitungsstatus</span>
                            <select
                                className="admin-forum-input"
                                onChange={(event) => field.handleChange(event.target.value)}
                                value={field.state.value}
                            >
                                {REPORT_STATUSES.filter(([value]) => value).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                </form.Field>
                <form.Field name="assignedToUserId">
                    {(field) => (
                        <label className="admin-forum-field">
                            <span>Zugewiesen an · User-ID</span>
                            <input
                                className="admin-forum-input"
                                maxLength={128}
                                onChange={(event) => field.handleChange(event.target.value)}
                                value={field.state.value}
                            />
                        </label>
                    )}
                </form.Field>
                <form.Field name="moderatorNote">
                    {(field) => (
                        <label className="admin-forum-field lg:col-span-2">
                            <span>Interne Moderationsnotiz</span>
                            <textarea
                                className="admin-forum-input min-h-32 resize-y"
                                maxLength={2000}
                                onChange={(event) => field.handleChange(event.target.value)}
                                value={field.state.value}
                            />
                        </label>
                    )}
                </form.Field>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[.055] pt-5 lg:col-span-2">
                    <span className={`text-xs ${message.error ? 'text-red-300' : 'text-emerald-300'}`}>
                        {message.error || message.success}
                    </span>
                    <form.Subscribe
                        selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
                    >
                        {({ canSubmit, isSubmitting }) => (
                            <button className="admin-forum-primary" disabled={!canSubmit || isSubmitting} type="submit">
                                <FaCheck /> {isSubmitting ? 'Speichert …' : 'Bearbeitung speichern'}
                            </button>
                        )}
                    </form.Subscribe>
                </div>
            </form>
        </ForumPanel>
    );
}

function EvidenceIntegritySummary({ status, hash }) {
    const presentation = {
        VERIFIED: {
            label: 'Backend-Prüfung bestanden',
            description:
                'Der Forum-Service meldet, dass Snapshot-Inhalt und gespeicherter SHA-256 übereinstimmen. Dies bestätigt die interne Konsistenz der gelieferten Daten, nicht deren externe Unveränderlichkeit.',
            tone: 'border-emerald-400/15 bg-emerald-400/[.07] text-emerald-300'
        },
        MISMATCH: {
            label: 'Abweichung erkannt',
            description:
                'Der Forum-Service meldet eine Abweichung zwischen Snapshot-Inhalt und gespeichertem SHA-256. Der Beleg darf nicht als verifiziert behandelt werden.',
            tone: 'border-red-400/15 bg-red-400/[.07] text-red-300'
        },
        LEGACY_UNVERIFIED: {
            label: 'Legacy · nicht verifiziert',
            description:
                'Der Snapshot stammt aus einem älteren Datensatz und konnte serverseitig nicht über einen gespeicherten Hash verifiziert werden.',
            tone: 'border-amber-400/15 bg-amber-400/[.07] text-amber-300'
        },
        NOT_AVAILABLE: {
            label: 'Nicht verfügbar',
            description: 'Für diese Meldung stehen keine prüfbaren Snapshot-Daten zur Verfügung.',
            tone: 'border-zinc-400/15 bg-zinc-400/[.05] text-zinc-400'
        }
    }[status] || {
        label: 'Status nicht gemeldet',
        description: 'Das Detail-DTO enthält keinen bekannten Integritätsstatus. Der Beleg gilt als ungeprüft.',
        tone: 'border-amber-400/15 bg-amber-400/[.07] text-amber-300'
    };

    return (
        <div className="rounded-xl border border-white/[.06] bg-black/20 px-4 py-4 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[9px] font-extrabold uppercase tracking-[.13em] text-zinc-600">
                    Integritätsprüfung
                </span>
                <StatusPill tone={presentation.tone} value={presentation.label} />
            </div>
            <p className="mt-3 text-xs leading-5 text-zinc-500">{presentation.description}</p>
            <div className="mt-3 rounded-lg border border-white/[.05] bg-black/20 px-3 py-2">
                <span className="block text-[9px] font-extrabold uppercase tracking-[.12em] text-zinc-700">
                    SHA-256 des Snapshot-Inhalts
                </span>
                <code className="mt-1 block break-all text-[10px] leading-4 text-zinc-500">
                    {hash || 'Kein Hash im Detail-DTO vorhanden'}
                </code>
            </div>
        </div>
    );
}

export function ForumSuggestionsView() {
    const [page, setPage] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [deletedFilter, setDeletedFilter] = useState('false');
    const [search, setSearch] = useState('');
    const [debouncedSearch, searchDebouncer] = useDebouncedValue(search, { wait: 300 }, (state) => ({
        isPending: state.isPending
    }));
    const normalizedSearch = debouncedSearch.trim();
    const serverSearch = normalizedSearch.length >= 2 ? normalizedSearch : '';
    const loader = useCallback(async () => {
        const [result, categories, statuses] = await Promise.all([
            suggestionsApi.admin.search({
                page,
                size: 25,
                statusId: statusFilter,
                categoryId: categoryFilter,
                deleted: deletedFilter === '' ? undefined : deletedFilter === 'true',
                query: serverSearch
            }),
            suggestionsApi.admin.categories(),
            suggestionsApi.admin.statuses()
        ]);
        const entries = result?.items || [];
        return {
            suggestions: entries.map((entry) => ({ ...(entry.suggestion || entry), deleted: Boolean(entry.deleted) })),
            categories: Array.isArray(categories) ? categories : categories?.items || categories?.categories || [],
            statuses: Array.isArray(statuses) ? statuses : statuses?.items || statuses?.statuses || [],
            total: Number(result?.total) || 0,
            page: Number(result?.page) || 0,
            size: Number(result?.size) || 25
        };
    }, [categoryFilter, deletedFilter, page, serverSearch, statusFilter]);
    const resource = useForumResource(loader, [loader]);
    const [actionError, setActionError] = useState('');
    const data = resource.data || { suggestions: [], categories: [], statuses: [], total: 0, page: 0, size: 25 };

    const patchSuggestion = useCallback(
        async (id, body) => {
            setActionError('');
            try {
                await suggestionsApi.admin.patch(id, body);
                await resource.reload();
            } catch (error) {
                setActionError(error.message);
            }
        },
        [resource]
    );

    const columns = useMemo(
        () =>
            columnHelper.columns([
                columnHelper.accessor('title', {
                    header: 'Vorschlag',
                    cell: (context) => (
                        <div>
                            <b className="block max-w-72 truncate text-sm text-zinc-200">{context.getValue()}</b>
                            <span className="mt-1 block text-[10px] text-zinc-600">
                                {context.row.original.author?.username ||
                                    context.row.original.author?.nickname ||
                                    'Unbekannter Autor'}
                            </span>
                        </div>
                    )
                }),
                columnHelper.accessor('views', {
                    header: 'Aufrufe',
                    cell: (context) => (
                        <span className="text-xs font-bold text-zinc-400">{formatNumber(context.getValue())}</span>
                    )
                }),
                columnHelper.accessor('likesCount', {
                    header: 'Bewertung',
                    cell: (context) => (
                        <span className="inline-flex gap-3 text-xs">
                            <b className="text-emerald-300">+{formatNumber(context.getValue())}</b>
                            <b className="text-red-300">−{formatNumber(context.row.original.dislikesCount)}</b>
                        </span>
                    )
                }),
                columnHelper.display({
                    id: 'status',
                    header: 'Status',
                    cell: (context) => (
                        <select
                            aria-label={`Status für ${context.row.original.title}`}
                            className="admin-forum-select-compact"
                            onChange={(event) =>
                                patchSuggestion(context.row.original.id, { statusId: event.target.value })
                            }
                            value={context.row.original.status?.id || ''}
                        >
                            {data.statuses
                                .filter((status) => !status.deleted || status.id === context.row.original.status?.id)
                                .map((status) => (
                                    <option key={status.id} value={status.id}>
                                        {status.name}
                                    </option>
                                ))}
                        </select>
                    )
                }),
                columnHelper.display({
                    id: 'category',
                    header: 'Kategorie',
                    cell: (context) => (
                        <select
                            aria-label={`Kategorie für ${context.row.original.title}`}
                            className="admin-forum-select-compact"
                            onChange={(event) =>
                                patchSuggestion(context.row.original.id, { categoryId: event.target.value })
                            }
                            value={context.row.original.category?.id || ''}
                        >
                            {!context.row.original.category?.id && <option value="">Nicht zugeordnet</option>}
                            {data.categories
                                .filter(
                                    (category) => !category.deleted || category.id === context.row.original.category?.id
                                )
                                .map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                        </select>
                    )
                }),
                columnHelper.display({
                    id: 'actions',
                    header: '',
                    cell: (context) => (
                        <button
                            className={`admin-forum-icon ${context.row.original.deleted ? 'text-emerald-300' : 'text-red-300'}`}
                            onClick={() =>
                                (context.row.original.deleted || window.confirm('Vorschlag ausblenden?')) &&
                                patchSuggestion(context.row.original.id, { deleted: !context.row.original.deleted })
                            }
                            title={context.row.original.deleted ? 'Wiederherstellen' : 'Vorschlag ausblenden'}
                            type="button"
                        >
                            {context.row.original.deleted ? <FaCheck /> : <FaTrash />}
                        </button>
                    )
                })
            ]),
        [data.categories, data.statuses, patchSuggestion]
    );

    const openStatusIds = new Set(
        data.statuses.filter((status) => status.open && !status.deleted).map((status) => status.id)
    );
    const open = data.suggestions.filter((suggestion) => openStatusIds.has(suggestion.status?.id)).length;
    const likes = data.suggestions.reduce((sum, suggestion) => sum + (Number(suggestion.likesCount) || 0), 0);
    const dislikes = data.suggestions.reduce((sum, suggestion) => sum + (Number(suggestion.dislikesCount) || 0), 0);

    return (
        <ForumAdminPage
            description="Community-Ideen sichten, klassifizieren und durch frei konfigurierbare Bearbeitungsstatus steuern."
            error={resource.error}
            eyebrow="COMMUNITY-FEEDBACK"
            icon={FaLightbulb}
            loading={resource.loading}
            onRetry={resource.reload}
            title="Vorschläge"
        >
            {resource.loading || !resource.data ? (
                <ForumLoading title="Vorschläge werden geladen" />
            ) : (
                <>
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <AdminMetricCard
                            detail="Treffer für den aktuellen Filter"
                            icon={FaLightbulb}
                            label="Vorschläge"
                            tone="orange"
                            value={formatNumber(data.total)}
                        />
                        <AdminMetricCard
                            detail="auf dieser geladenen Seite"
                            icon={FaEye}
                            label="In Bearbeitung"
                            tone="sky"
                            value={formatNumber(open)}
                        />
                        <AdminMetricCard
                            detail="Summe der geladenen Vorschläge"
                            icon={FaThumbsUp}
                            label="Zustimmungen"
                            tone="emerald"
                            value={formatNumber(likes)}
                        />
                        <AdminMetricCard
                            detail="Summe der geladenen Vorschläge"
                            icon={FaThumbsDown}
                            label="Ablehnungen"
                            tone="red"
                            value={formatNumber(dislikes)}
                        />
                    </section>
                    {actionError && (
                        <p className="mt-5 rounded-xl border border-red-400/15 bg-red-400/[.05] px-4 py-3 text-xs text-red-300">
                            {actionError}
                        </p>
                    )}
                    <section className="mt-6">
                        <ForumPanel
                            actions={
                                <div className="grid w-full gap-2 sm:grid-cols-2 xl:w-auto xl:grid-cols-4">
                                    <label className="relative min-w-56">
                                        <span className="sr-only">Vorschläge serverseitig durchsuchen</span>
                                        <FaMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600" />
                                        <input
                                            className="admin-forum-select-compact h-full min-h-9 w-full pl-8"
                                            onChange={(event) => {
                                                setSearch(event.target.value);
                                                setPage(0);
                                            }}
                                            placeholder="Alle Vorschläge suchen …"
                                            type="search"
                                            value={search}
                                        />
                                        {searchDebouncer.state.isPending && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-orange-300">
                                                …
                                            </span>
                                        )}
                                        {!searchDebouncer.state.isPending && search.trim().length === 1 && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-bold text-zinc-600">
                                                min. 2
                                            </span>
                                        )}
                                    </label>
                                    <FilterSelect
                                        label="Status filtern"
                                        onChange={(value) => {
                                            setStatusFilter(value);
                                            setPage(0);
                                        }}
                                        options={[
                                            ['', 'Alle Status'],
                                            ...data.statuses.map((status) => [status.id, status.name])
                                        ]}
                                        value={statusFilter}
                                    />
                                    <FilterSelect
                                        label="Kategorie filtern"
                                        onChange={(value) => {
                                            setCategoryFilter(value);
                                            setPage(0);
                                        }}
                                        options={[
                                            ['', 'Alle Kategorien'],
                                            ...data.categories.map((category) => [category.id, category.name])
                                        ]}
                                        value={categoryFilter}
                                    />
                                    <FilterSelect
                                        label="Sichtbarkeit filtern"
                                        onChange={(value) => {
                                            setDeletedFilter(value);
                                            setPage(0);
                                        }}
                                        options={[
                                            ['false', 'Sichtbar'],
                                            ['true', 'Ausgeblendet'],
                                            ['', 'Alle']
                                        ]}
                                        value={deletedFilter}
                                    />
                                </div>
                            }
                            description="Status und Kategorie lassen sich direkt in der Tabelle anpassen."
                            eyebrow="EINGANG"
                            title="Vorschlagsverwaltung"
                        >
                            <LiveDataTable
                                columns={columns}
                                emptyText="Für den gewählten Filter wurden keine Community-Ideen gefunden."
                                emptyTitle="Keine Vorschläge vorhanden"
                                getSearchValue={(row) =>
                                    `${row.title} ${row.author?.username} ${row.status?.name} ${row.category?.name}`
                                }
                                rows={data.suggestions}
                                searchPlaceholder="Geladene Treffer weiter filtern …"
                            />
                            {data.total > data.size && (
                                <Pagination
                                    page={page}
                                    pages={Math.max(1, Math.ceil(data.total / data.size))}
                                    setPage={setPage}
                                />
                            )}
                        </ForumPanel>
                    </section>
                    <section className="mt-6 grid gap-6 xl:grid-cols-2">
                        <TaxonomyPanel items={data.categories} kind="category" onReload={resource.reload} />
                        <TaxonomyPanel items={data.statuses} kind="status" onReload={resource.reload} />
                    </section>
                </>
            )}
        </ForumAdminPage>
    );
}

function TaxonomyPanel({ items, kind, onReload }) {
    const [selectedId, setSelectedId] = useState('new');
    const selected = items.find((item) => item.id === selectedId) || null;
    const isStatus = kind === 'status';
    return (
        <ForumPanel
            actions={
                <button
                    className="admin-forum-icon"
                    onClick={() => setSelectedId('new')}
                    title="Neu anlegen"
                    type="button"
                >
                    <FaPlus />
                </button>
            }
            description={
                isStatus
                    ? 'Offene Status zählen in die aktive Bearbeitung.'
                    : 'Kategorien strukturieren den öffentlichen Feedback-Bereich.'
            }
            eyebrow={isStatus ? 'WORKFLOW' : 'KLASSIFIZIERUNG'}
            title={isStatus ? 'Bearbeitungsstatus' : 'Kategorien'}
        >
            <div className="grid gap-0 lg:grid-cols-[minmax(170px,.7fr)_minmax(0,1.3fr)]">
                <div className="max-h-80 overflow-y-auto border-b border-white/[.055] p-3 lg:border-b-0 lg:border-r">
                    {items.map((item) => (
                        <button
                            className={`mb-1 block w-full rounded-xl px-3 py-2 text-left text-xs font-bold ${selectedId === item.id ? 'bg-orange-400/[.09] text-orange-200' : 'text-zinc-500 hover:bg-white/[.03] hover:text-zinc-200'}`}
                            key={item.id}
                            onClick={() => setSelectedId(item.id)}
                            type="button"
                        >
                            {item.name}
                        </button>
                    ))}
                    {items.length === 0 && <p className="p-3 text-xs text-zinc-700">Noch keine Einträge.</p>}
                </div>
                <TaxonomyForm
                    initial={selected}
                    isStatus={isStatus}
                    key={`${kind}-${selected?.id || 'new'}`}
                    onReload={onReload}
                />
            </div>
        </ForumPanel>
    );
}

function TaxonomyForm({ initial, isStatus, onReload }) {
    const [message, setMessage] = useState('');
    const form = useForm({
        defaultValues: isStatus
            ? {
                  name: initial?.name || '',
                  html: initial?.html || '',
                  open: initial?.open ?? true,
                  deleted: initial?.deleted || false
              }
            : {
                  name: initial?.name || '',
                  displayOrder: initial?.displayOrder || 0,
                  deleted: initial?.deleted || false
              },
        onSubmit: async ({ value }) => {
            setMessage('');
            try {
                if (isStatus) await suggestionsApi.admin.saveStatus(initial?.id || 'new', value);
                else
                    await suggestionsApi.admin.saveCategory(initial?.id || 'new', {
                        ...value,
                        displayOrder: Number(value.displayOrder) || 0
                    });
                setMessage('Gespeichert.');
                await onReload();
            } catch (error) {
                setMessage(error.message);
            }
        }
    });
    return (
        <form
            className="p-4 sm:p-5"
            onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                form.handleSubmit();
            }}
        >
            <form.Field name="name">
                {(field) => (
                    <label className="admin-forum-field">
                        <span>Name</span>
                        <input
                            className="admin-forum-input"
                            maxLength={64}
                            required
                            value={field.state.value}
                            onChange={(event) => field.handleChange(event.target.value)}
                        />
                    </label>
                )}
            </form.Field>
            {isStatus ? (
                <form.Field name="html">
                    {(field) => (
                        <label className="admin-forum-field mt-4">
                            <span>Darstellung / HTML</span>
                            <input
                                className="admin-forum-input"
                                maxLength={256}
                                value={field.state.value}
                                onChange={(event) => field.handleChange(event.target.value)}
                            />
                        </label>
                    )}
                </form.Field>
            ) : (
                <form.Field name="displayOrder">
                    {(field) => (
                        <label className="admin-forum-field mt-4">
                            <span>Sortierung</span>
                            <input
                                className="admin-forum-input"
                                min="0"
                                type="number"
                                value={field.state.value}
                                onChange={(event) => field.handleChange(Number(event.target.value))}
                            />
                        </label>
                    )}
                </form.Field>
            )}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {isStatus && (
                    <form.Field name="open">
                        {(field) => (
                            <SmallToggle
                                checked={field.state.value}
                                label="Offener Status"
                                onChange={field.handleChange}
                            />
                        )}
                    </form.Field>
                )}
                {initial && (
                    <form.Field name="deleted">
                        {(field) => (
                            <SmallToggle
                                checked={field.state.value}
                                danger
                                label="Archiviert"
                                onChange={field.handleChange}
                            />
                        )}
                    </form.Field>
                )}
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
                <span className="text-[10px] text-zinc-600">{message}</span>
                <form.Subscribe
                    selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
                >
                    {({ canSubmit, isSubmitting }) => (
                        <button className="admin-forum-primary" disabled={!canSubmit || isSubmitting} type="submit">
                            <FaFolderPlus /> {isSubmitting ? 'Speichert …' : 'Speichern'}
                        </button>
                    )}
                </form.Subscribe>
            </div>
        </form>
    );
}

function SmallToggle({ checked, onChange, label, danger = false }) {
    return (
        <label
            className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-[10px] font-bold ${danger ? 'border-red-400/15 text-red-300' : 'border-white/[.06] text-zinc-400'}`}
        >
            <input
                checked={Boolean(checked)}
                className="accent-orange-500"
                onChange={(event) => onChange(event.target.checked)}
                type="checkbox"
            />
            {label}
        </label>
    );
}

function FilterSelect({ label, value, options, onChange }) {
    return (
        <label>
            <span className="sr-only">{label}</span>
            <select
                className="admin-forum-select-compact w-full"
                onChange={(event) => onChange(event.target.value)}
                value={value}
            >
                {options.map(([optionValue, text]) => (
                    <option key={`${label}-${optionValue}`} value={optionValue}>
                        {text}
                    </option>
                ))}
            </select>
        </label>
    );
}

function Pagination({ page, pages, setPage }) {
    return (
        <div className="flex items-center justify-between border-t border-white/[.055] px-5 py-4 text-xs text-zinc-500 sm:px-6">
            <button
                className="admin-forum-secondary py-2"
                disabled={page <= 0}
                onClick={() => setPage((value) => Math.max(0, value - 1))}
                type="button"
            >
                Zurück
            </button>
            <span>
                Seite {page + 1} von {pages}
            </span>
            <button
                className="admin-forum-secondary py-2"
                disabled={page >= pages - 1}
                onClick={() => setPage((value) => Math.min(pages - 1, value + 1))}
                type="button"
            >
                Weiter
            </button>
        </div>
    );
}

function shortId(value) {
    if (!value) return '—';
    const text = String(value);
    return text.length > 16 ? `${text.slice(0, 8)}…${text.slice(-5)}` : text;
}

function translateReportStatus(status) {
    return (
        {
            OPEN: 'Offen',
            IN_REVIEW: 'In Prüfung',
            RESOLVED: 'Erledigt',
            REJECTED: 'Abgelehnt',
            CLOSED: 'Geschlossen'
        }[status] || status
    );
}

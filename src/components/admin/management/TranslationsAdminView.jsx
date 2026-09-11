import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { FaBookOpen, FaCircleCheck, FaGlobe, FaLanguage, FaPlus, FaTags, FaTrash } from 'react-icons/fa6';
import { hasAnyPermission } from '../../../lib/auth';
import { forumApi } from '../../../lib/forumApi';
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
import { ServerSearch, SnapshotChart, humanize, pageRows, useServerSearch } from './SocialAdminShared';

const PAGE_SIZE = 50;
const STATUSES = ['DRAFT', 'IN_REVIEW', 'PUBLISHED'];
export default function TranslationsAdminView({ user }) {
    const [input, setInput] = useState('');
    const [query, debouncer] = useServerSearch(input);
    const [page, setPage] = useState(0);
    const [namespace, setNamespace] = useState('');
    const [status, setStatus] = useState('');
    const [selected, setSelected] = useState(null);
    const [editor, setEditor] = useState('');
    const canWrite = hasAnyPermission(user, 'forum.translations.write');
    const canPublish = hasAnyPermission(user, 'forum.translations.publish');
    const overview = useAdminResource(
        useCallback(() => forumApi.admin.translationsOverview(), []),
        []
    );
    const localeResource = useAdminResource(
        useCallback(() => forumApi.admin.translationLocales(), []),
        []
    );
    const entriesLoader = useCallback(
        () => forumApi.admin.translationEntries({ q: query, namespace, status, page, size: PAGE_SIZE }),
        [namespace, page, query, status]
    );
    const entries = useAdminResource(entriesLoader, [entriesLoader]);
    const rows = pageRows(entries.data);
    useEffect(() => setPage(0), [query, namespace, status]);
    const reload = () => Promise.all([overview.reload(), localeResource.reload(), entries.reload()]);
    return (
        <AdminManagementPage
            backend="Forum-Backend"
            description="Sprachvarianten, Übersetzungsschlüssel und den geprüften Veröffentlichungsablauf für Homepage, Launcher und Client verwalten."
            error={overview.error || localeResource.error || entries.error}
            eyebrow="LOKALISIERUNG"
            icon={FaLanguage}
            loading={overview.loading || entries.loading}
            onRetry={reload}
            title="Übersetzungen"
        >
            {overview.loading && !overview.data ? (
                <AdminManagementLoading title="Übersetzungskatalog wird ausgewertet" />
            ) : (
                <>
                    <TranslationMetrics data={overview.data || {}} />
                    <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(310px,.36fr)_minmax(0,.64fr)]">
                        <LocalesPanel canWrite={canWrite} locales={localeResource.data || []} onChanged={reload} />
                        <SnapshotChart
                            description="Abdeckung je aktivierter Sprache, direkt aus den veröffentlichten und bearbeiteten Einträgen berechnet."
                            rows={(overview.data?.locales || [])
                                .filter((locale) => locale.enabled)
                                .map((locale) => ({
                                    label: locale.code,
                                    value: Number(locale.coveragePercent || 0)
                                }))}
                            title="Sprachabdeckung in Prozent"
                        />
                    </section>
                    <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.35fr)_minmax(390px,.65fr)]">
                        <AdminPanel
                            actions={
                                <div className="flex flex-wrap gap-2">
                                    <input
                                        aria-label="Namespace filtern"
                                        className="admin-forum-select-compact max-w-36"
                                        onChange={(e) => setNamespace(e.target.value)}
                                        placeholder="Namespace"
                                        value={namespace}
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
                                    {canWrite && (
                                        <button
                                            className="forum-button-primary"
                                            onClick={() => {
                                                setSelected(null);
                                                setEditor('entry');
                                            }}
                                            type="button"
                                        >
                                            <FaPlus /> Schlüssel
                                        </button>
                                    )}
                                </div>
                            }
                            description="Suche, Namespace und Workflow-Status werden serverseitig gefiltert."
                            eyebrow="SCHLÜSSEL"
                            title="Übersetzungseinträge"
                        >
                            <div className="border-b border-white/[.05] p-5">
                                <ServerSearch
                                    onChange={setInput}
                                    pending={debouncer.state.isPending}
                                    placeholder="Schlüssel oder Beschreibung …"
                                    value={input}
                                />
                            </div>
                            {entries.loading ? (
                                <div className="p-6">
                                    <AdminManagementLoading title="Übersetzungsschlüssel werden geladen" />
                                </div>
                            ) : (
                                <EntriesTable
                                    onOpen={(entry) => {
                                        setSelected(entry);
                                        setEditor('');
                                    }}
                                    rows={rows}
                                />
                            )}
                            <AdminPagination
                                onPage={setPage}
                                page={Number(entries.data?.page) || 0}
                                size={Number(entries.data?.size) || PAGE_SIZE}
                                total={Number(entries.data?.total) || 0}
                            />
                        </AdminPanel>
                        {editor === 'entry' ? (
                            <EntryEditor
                                entry={selected}
                                locales={localeResource.data || []}
                                onCancel={() => setEditor('')}
                                onSaved={async () => {
                                    setEditor('');
                                    setSelected(null);
                                    await reload();
                                }}
                            />
                        ) : (
                            <EntryDetail
                                canPublish={canPublish}
                                canWrite={canWrite}
                                entry={selected}
                                onChanged={async () => {
                                    setSelected(null);
                                    await reload();
                                }}
                                onEdit={() => setEditor('entry')}
                            />
                        )}
                    </section>
                </>
            )}
        </AdminManagementPage>
    );
}
function TranslationMetrics({ data }) {
    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminMetricCard
                detail="konfigurierte Sprachen"
                icon={FaGlobe}
                label="Locales"
                tone="orange"
                value={formatNumber(data.localeCount)}
            />
            <AdminMetricCard
                detail="für Clients verfügbar"
                icon={FaCircleCheck}
                label="Aktive Locales"
                tone="emerald"
                value={formatNumber(data.enabledLocaleCount)}
            />
            <AdminMetricCard
                detail="persistierte Schlüssel"
                icon={FaTags}
                label="Einträge"
                tone="sky"
                value={formatNumber(data.entryCount)}
            />
            <AdminMetricCard
                detail={`zuletzt ${formatDate(data.lastUpdatedAt)}`}
                icon={FaBookOpen}
                label="Veröffentlicht"
                tone="violet"
                value={formatNumber(data.publishedEntryCount)}
            />
        </section>
    );
}
function LocalesPanel({ locales, canWrite, onChanged }) {
    const [editing, setEditing] = useState(null);
    return (
        <AdminPanel
            actions={
                canWrite ? (
                    <button className="admin-forum-secondary" onClick={() => setEditing({})} type="button">
                        <FaPlus /> Sprache
                    </button>
                ) : null
            }
            className="h-fit"
            description="Fallback-Ketten werden serverseitig auf Zyklen geprüft."
            eyebrow="SPRACHEN"
            title="Locales"
        >
            <div className="divide-y divide-white/[.045]">
                {locales.map((locale) => (
                    <button
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/[.018]"
                        key={locale.code}
                        onClick={() => canWrite && setEditing(locale)}
                        type="button"
                    >
                        <div>
                            <b className="text-sm text-zinc-200">{locale.nativeName}</b>
                            <span className="ml-2 text-[9px] uppercase text-zinc-600">{locale.code}</span>
                            <p className="mt-1 text-[9px] text-zinc-600">
                                Fallback: {locale.fallbackLocale || 'keiner'}
                            </p>
                        </div>
                        <div className="text-right">
                            <b className="text-xs text-orange-200">
                                {Number(locale.coveragePercent || 0).toLocaleString('de-DE', {
                                    maximumFractionDigits: 1
                                })}{' '}
                                %
                            </b>
                            <span className="mt-1 block text-[8px] text-zinc-600">
                                {locale.enabled ? 'aktiv' : 'deaktiviert'}
                                {locale.defaultLocale ? ' · Standard' : ''}
                            </span>
                        </div>
                    </button>
                ))}
                {!locales.length && (
                    <AdminManagementEmpty
                        title="Keine Sprachen konfiguriert"
                        text="Lege die Standardsprache an, bevor Übersetzungsschlüssel veröffentlicht werden."
                    />
                )}
            </div>
            {editing && (
                <LocaleEditor
                    locale={editing}
                    locales={locales}
                    onCancel={() => setEditing(null)}
                    onSaved={async () => {
                        setEditing(null);
                        await onChanged();
                    }}
                />
            )}
        </AdminPanel>
    );
}
function LocaleEditor({ locale, locales, onCancel, onSaved }) {
    const [message, setMessage] = useState('');
    const exists = Boolean(locale.id);
    const form = useForm({
        defaultValues: {
            code: locale.code || '',
            displayName: locale.displayName || '',
            nativeName: locale.nativeName || '',
            fallbackLocale: locale.fallbackLocale || '',
            enabled: locale.enabled ?? true,
            defaultLocale: Boolean(locale.defaultLocale),
            sortOrder: String(locale.sortOrder || 0)
        },
        onSubmit: async ({ value }) => {
            setMessage('');
            try {
                await forumApi.admin.saveTranslationLocale(exists ? locale.code : '', {
                    ...value,
                    code: value.code.trim(),
                    displayName: value.displayName.trim(),
                    nativeName: value.nativeName.trim(),
                    fallbackLocale: value.fallbackLocale || null,
                    sortOrder: Number(value.sortOrder) || 0
                });
                await onSaved();
            } catch (error) {
                setMessage(error.message);
            }
        }
    });
    return (
        <form
            className="space-y-3 border-t border-white/[.05] bg-black/10 p-5"
            onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
            }}
        >
            <div className="grid gap-3 sm:grid-cols-2">
                <Field disabled={exists} form={form} label="Code" name="code" required />
                <Field form={form} label="Anzeigename" name="displayName" required />
                <Field form={form} label="Eigenname" name="nativeName" required />
                <form.Field name="fallbackLocale">
                    {(field) => (
                        <label className="admin-forum-field">
                            <span>Fallback</span>
                            <select
                                className="admin-forum-input"
                                onChange={(e) => field.handleChange(e.target.value)}
                                value={field.state.value}
                            >
                                <option value="">Kein Fallback</option>
                                {locales
                                    .filter((item) => item.code !== locale.code)
                                    .map((item) => (
                                        <option key={item.code} value={item.code}>
                                            {item.code}
                                        </option>
                                    ))}
                            </select>
                        </label>
                    )}
                </form.Field>
            </div>
            <div className="flex flex-wrap gap-5 text-xs text-zinc-500">
                <Check form={form} label="Aktiv" name="enabled" />
                <Check form={form} label="Standardsprache" name="defaultLocale" />
            </div>
            {message && <p className="text-xs text-red-300">{message}</p>}
            <div className="flex justify-between gap-2">
                <div>
                    {exists && !locale.defaultLocale && (
                        <button
                            className="admin-forum-danger"
                            onClick={async () => {
                                if (!window.confirm('Sprache deaktivieren?')) return;
                                await forumApi.admin.disableTranslationLocale(locale.code);
                                await onSaved();
                            }}
                            type="button"
                        >
                            <FaTrash /> Deaktivieren
                        </button>
                    )}
                </div>
                <div className="flex gap-2">
                    <button className="admin-forum-secondary" onClick={onCancel} type="button">
                        Abbrechen
                    </button>
                    <button className="forum-button-primary" type="submit">
                        Speichern
                    </button>
                </div>
            </div>
        </form>
    );
}
function EntriesTable({ rows, onOpen }) {
    const columns = useMemo(
        () =>
            columnHelper.columns([
                columnHelper.accessor('key', {
                    header: 'Schlüssel',
                    cell: (c) => (
                        <div>
                            <b className="block font-mono text-xs text-zinc-200">{c.getValue()}</b>
                            <span className="text-[9px] text-zinc-600">{c.row.original.namespace}</span>
                        </div>
                    )
                }),
                columnHelper.accessor('values', {
                    header: 'Sprachen',
                    cell: (c) => <b className="text-xs">{Object.keys(c.getValue() || {}).length}</b>
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
            getSearchValue={(r) => `${r.key} ${r.namespace} ${r.description}`}
            rows={rows}
            searchPlaceholder="Geladene Seite filtern …"
        />
    ) : (
        <AdminManagementEmpty
            title="Keine Übersetzungsschlüssel"
            text="Lege den ersten Schlüssel an oder passe die Filter an."
        />
    );
}
function EntryDetail({ entry, canWrite, canPublish, onEdit, onChanged }) {
    if (!entry)
        return (
            <AdminPanel className="h-fit" eyebrow="DETAILS" title="Übersetzung">
                <AdminManagementEmpty
                    title="Kein Schlüssel ausgewählt"
                    text="Öffne links einen Eintrag oder erstelle einen neuen Schlüssel."
                />
            </AdminPanel>
        );
    const change = async (status) => {
        await forumApi.admin.setTranslationStatus(entry.id, status);
        await onChanged();
    };
    const archive = async () => {
        if (!window.confirm(`„${entry.key}“ archivieren?`)) return;
        await forumApi.admin.archiveTranslationEntry(entry.id);
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
                        <button className="admin-forum-danger" onClick={archive} type="button">
                            <FaTrash />
                        </button>
                    )}
                </>
            }
            className="h-fit"
            eyebrow="DETAILS"
            title={entry.key}
        >
            <div className="space-y-5 p-5">
                <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[10px] text-zinc-600">{entry.namespace}</span>
                    <StatusPill value={humanize(entry.status)} />
                </div>
                <p className="text-xs leading-5 text-zinc-500">
                    {entry.description || 'Keine interne Beschreibung hinterlegt.'}
                </p>
                <div className="space-y-2">
                    {Object.entries(entry.values || {}).map(([locale, text]) => (
                        <div className="rounded-xl border border-white/[.05] bg-black/15 p-3" key={locale}>
                            <b className="text-[9px] uppercase text-orange-300">{locale}</b>
                            <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-zinc-400">{text}</p>
                        </div>
                    ))}
                </div>
                {canPublish && (
                    <div className="flex flex-wrap gap-2 border-t border-white/[.05] pt-4">
                        <button className="admin-forum-secondary" onClick={() => change('DRAFT')} type="button">
                            Entwurf
                        </button>
                        <button className="admin-forum-secondary" onClick={() => change('IN_REVIEW')} type="button">
                            Zur Prüfung
                        </button>
                        <button className="forum-button-primary" onClick={() => change('PUBLISHED')} type="button">
                            Veröffentlichen
                        </button>
                    </div>
                )}
            </div>
        </AdminPanel>
    );
}
function EntryEditor({ entry, locales, onCancel, onSaved }) {
    const [message, setMessage] = useState('');
    const localeCodes = locales.map((locale) => locale.code);
    const defaults = Object.fromEntries(localeCodes.map((code) => [code, entry?.values?.[code] || '']));
    const form = useForm({
        defaultValues: {
            key: entry?.key || '',
            namespace: entry?.namespace || 'common',
            description: entry?.description || '',
            values: defaults
        },
        onSubmit: async ({ value }) => {
            setMessage('');
            try {
                const values = Object.fromEntries(
                    Object.entries(value.values)
                        .filter(([, text]) => String(text).trim())
                        .map(([code, text]) => [code, String(text).trim()])
                );
                if (!Object.keys(values).length) throw new Error('Mindestens eine Übersetzung ist erforderlich.');
                await forumApi.admin.saveTranslationEntry(entry?.id, {
                    key: value.key.trim(),
                    namespace: value.namespace.trim(),
                    description: value.description.trim() || null,
                    values
                });
                await onSaved();
            } catch (error) {
                setMessage(error.message);
            }
        }
    });
    return (
        <AdminPanel className="h-fit" eyebrow={entry ? 'BEARBEITEN' : 'NEU'} title={entry?.key || 'Schlüssel anlegen'}>
            <form
                className="space-y-4 p-5"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit();
                }}
            >
                <Field form={form} label="Schlüssel" name="key" required />
                <Field form={form} label="Namespace" name="namespace" required />
                <Field form={form} label="Interne Beschreibung" name="description" />
                {localeCodes.map((code) => (
                    <form.Field key={code} name={`values.${code}`}>
                        {(field) => (
                            <label className="admin-forum-field">
                                <span>{code}</span>
                                <textarea
                                    className="admin-forum-input min-h-20"
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    value={field.state.value}
                                />
                            </label>
                        )}
                    </form.Field>
                ))}
                {!localeCodes.length && (
                    <p className="text-xs text-amber-200">Lege zuerst mindestens eine Sprache an.</p>
                )}
                {message && <p className="text-xs text-red-300">{message}</p>}
                <div className="flex justify-end gap-2 border-t border-white/[.05] pt-4">
                    <button className="admin-forum-secondary" onClick={onCancel} type="button">
                        Abbrechen
                    </button>
                    <button className="forum-button-primary" disabled={!localeCodes.length} type="submit">
                        Speichern
                    </button>
                </div>
            </form>
        </AdminPanel>
    );
}
function Field({ form, name, label, required = false, disabled = false }) {
    return (
        <form.Field name={name}>
            {(field) => (
                <label className="admin-forum-field">
                    <span>{label}</span>
                    <input
                        className="admin-forum-input"
                        disabled={disabled}
                        onChange={(e) => field.handleChange(e.target.value)}
                        required={required}
                        value={field.state.value}
                    />
                </label>
            )}
        </form.Field>
    );
}
function Check({ form, name, label }) {
    return (
        <form.Field name={name}>
            {(field) => (
                <label className="flex items-center gap-2">
                    <input
                        checked={field.state.value}
                        onChange={(e) => field.handleChange(e.target.checked)}
                        type="checkbox"
                    />{' '}
                    {label}
                </label>
            )}
        </form.Field>
    );
}

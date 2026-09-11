import { useCallback, useMemo, useState } from 'react';
import { barY, defineChart } from '@tanstack/charts';
import { Chart } from '@tanstack/charts/react/tooltip';
import { scaleBand, scaleLinear } from 'd3-scale';
import { FaChartColumn, FaFilter } from 'react-icons/fa6';
import { TEAM_ACTIVITY_ACTIONS, teamApi } from '../../../lib/teamApi';
import {
    TeamAdminPage,
    TeamEmpty,
    TeamLoading,
    TeamPagination,
    TeamPanel,
    TeamTable,
    formatTeamDate,
    formatTeamNumber,
    humanizeTeamValue,
    shortTeamId,
    teamColumnHelper,
    useTeamResource
} from './AdminTeamShared';

export default function TeamActivityView() {
    const defaults = useMemo(defaultFilters, []);
    const [draft, setDraft] = useState(defaults);
    const [filters, setFilters] = useState(defaults);
    const [page, setPage] = useState(0);
    const [filterError, setFilterError] = useState('');
    const loader = useCallback(
        () =>
            teamApi.activity({
                ...filters,
                from: optionalIso(filters.from),
                to: optionalIso(filters.to),
                page,
                size: 50
            }),
        [filters, page]
    );
    const resource = useTeamResource(loader, [loader]);
    const data = resource.data;
    const applyFilters = (event) => {
        event.preventDefault();
        const fromDate = draft.from ? new Date(draft.from) : null;
        const toDate = draft.to ? new Date(draft.to) : null;
        if ((fromDate && Number.isNaN(fromDate.getTime())) || (toDate && Number.isNaN(toDate.getTime()))) {
            setFilterError('Bitte gültige Zeitpunkte wählen.');
            return;
        }
        const effectiveTo = toDate || new Date();
        const effectiveFrom = fromDate || new Date(effectiveTo.getTime() - 7 * DAY_MS);
        if (effectiveTo <= effectiveFrom) {
            setFilterError('Das Ende des Zeitraums muss nach dem Beginn liegen.');
            return;
        }
        const windowMs = effectiveTo.getTime() - effectiveFrom.getTime();
        if (windowMs > 365 * DAY_MS) {
            setFilterError('Der Aktivitätszeitraum darf höchstens 365 Tage umfassen.');
            return;
        }
        if (draft.bucket === 'HOUR' && windowMs > 31 * DAY_MS) {
            setFilterError('Die Stundenauflösung ist auf Zeiträume bis 31 Tage begrenzt.');
            return;
        }
        if (draft.actorId && !UUID_PATTERN.test(draft.actorId.trim())) {
            setFilterError('Die Akteur-ID muss eine gültige UUID sein.');
            return;
        }
        setFilterError('');
        setPage(0);
        setFilters({ ...draft, area: draft.area.trim(), actorId: draft.actorId.trim() });
    };

    return (
        <TeamAdminPage
            description="Protokollierte Kalender-, Aufgaben- und Notizänderungen serverseitig filtern und als Tabelle sowie Zeitreihe auswerten."
            error={resource.error}
            eyebrow="AUDIT"
            icon={FaChartColumn}
            loading={resource.loading}
            onRetry={resource.reload}
            preserveChildrenOnError
            title="Teamaktivität"
        >
            <TeamPanel
                className="mb-6"
                description="Alle Filter werden an den User-Service übergeben; die Tabelle enthält keine lokal erfundenen Einträge."
                eyebrow="FILTER"
                title="Aktivitätsabfrage"
            >
                <form className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4" onSubmit={applyFilters}>
                    <FilterInput
                        label="Von"
                        onChange={(value) => setDraft((current) => ({ ...current, from: value }))}
                        type="datetime-local"
                        value={draft.from}
                    />
                    <FilterInput
                        label="Bis"
                        onChange={(value) => setDraft((current) => ({ ...current, to: value }))}
                        type="datetime-local"
                        value={draft.to}
                    />
                    <FilterInput
                        label="Bereich"
                        maxLength={40}
                        onChange={(value) => setDraft((current) => ({ ...current, area: value }))}
                        placeholder="Exakter Bereich"
                        value={draft.area}
                    />
                    <FilterInput
                        label="Akteur-ID"
                        onChange={(value) => setDraft((current) => ({ ...current, actorId: value }))}
                        placeholder="UUID"
                        value={draft.actorId}
                    />
                    <FilterSelect
                        label="Aktion"
                        onChange={(value) => setDraft((current) => ({ ...current, action: value }))}
                        options={TEAM_ACTIVITY_ACTIONS}
                        placeholder="Alle Aktionen"
                        value={draft.action}
                    />
                    <FilterSelect
                        label="Auflösung"
                        onChange={(value) => setDraft((current) => ({ ...current, bucket: value }))}
                        options={['HOUR', 'DAY']}
                        value={draft.bucket}
                    />
                    <div className="flex items-end sm:col-span-2 xl:justify-end">
                        <button className="admin-forum-primary w-full sm:w-auto" type="submit">
                            <FaFilter /> Filter anwenden
                        </button>
                    </div>
                    {filterError && (
                        <p className="text-xs text-red-300 sm:col-span-2 xl:col-span-4" role="alert">
                            {filterError}
                        </p>
                    )}
                </form>
            </TeamPanel>
            {resource.error ? null : resource.loading || !data ? (
                <TeamLoading title="Aktivitätsverlauf wird geladen" />
            ) : (
                <div className="space-y-6">
                    <ActivityBuckets buckets={data.buckets || []} bucket={filters.bucket} />
                    <ActivityTable data={data} onPage={setPage} />
                </div>
            )}
        </TeamAdminPage>
    );
}

function ActivityBuckets({ buckets, bucket }) {
    const rows = useMemo(
        () => buckets.map((entry) => ({ label: bucketLabel(entry.startsAt, bucket), count: Number(entry.count) || 0 })),
        [bucket, buckets]
    );
    const definition = useMemo(
        () =>
            rows.length
                ? defineChart({
                      marks: [
                          barY(rows, {
                              id: 'team-activity-buckets',
                              x: 'label',
                              y: 'count',
                              fill: '#fb923c',
                              cornerRadius: 6
                          })
                      ],
                      scales: {
                          x: {
                              scale: () => scaleBand().padding(0.25),
                              axis: { label: bucket === 'HOUR' ? 'Stunde' : 'Tag' }
                          },
                          y: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'Aktionen' } }
                      },
                      clip: true,
                      theme: {
                          foreground: '#d4d4d8',
                          muted: '#5f6069',
                          grid: '#272931',
                          background: 'transparent',
                          palette: ['#fb923c']
                      }
                  })
                : null,
        [bucket, rows]
    );
    return (
        <TeamPanel
            description={`Vom Backend in ${bucket === 'HOUR' ? 'Stunden' : 'Tage'} gruppierte Treffer der aktuellen Abfrage.`}
            eyebrow="ZEITREIHE"
            title="Aktivitätsvolumen"
        >
            {definition ? (
                <div className="px-2 pb-5 pt-6 sm:px-5">
                    <Chart ariaLabel="Anzahl der Teamaktionen je Zeitraum" definition={definition} height={280} />
                </div>
            ) : (
                <TeamEmpty
                    title="Keine Aktivität im Zeitraum"
                    text="Für die gesetzten Filter wurden keine Aktivitäts-Buckets geliefert."
                />
            )}
        </TeamPanel>
    );
}

function ActivityTable({ data, onPage }) {
    const rows = Array.isArray(data.content) ? data.content : [];
    const columns = useMemo(
        () =>
            teamColumnHelper.columns([
                teamColumnHelper.accessor('occurredAt', {
                    header: 'Zeit',
                    cell: (context) => <time dateTime={context.getValue()}>{formatTeamDate(context.getValue())}</time>
                }),
                teamColumnHelper.accessor('action', {
                    header: 'Aktion',
                    cell: (context) => <b className="text-zinc-200">{humanizeTeamValue(context.getValue())}</b>
                }),
                teamColumnHelper.accessor('actorUsername', {
                    header: 'Akteur',
                    cell: (context) => (
                        <span title={context.row.original.actorId}>
                            {context.getValue() || shortTeamId(context.row.original.actorId)}
                        </span>
                    )
                }),
                teamColumnHelper.accessor('area', {
                    header: 'Bereich',
                    cell: (context) => context.getValue() || 'Ohne Bereich'
                }),
                teamColumnHelper.accessor('entityType', {
                    header: 'Objekt',
                    cell: (context) => (
                        <span title={context.row.original.entityId}>
                            {humanizeTeamValue(context.getValue())} · {shortTeamId(context.row.original.entityId)}
                        </span>
                    )
                }),
                teamColumnHelper.accessor('metadata', {
                    header: 'Details',
                    cell: (context) => (
                        <span className="block max-w-xs break-words text-[10px] text-zinc-600">
                            {metadataText(context.getValue())}
                        </span>
                    )
                })
            ]),
        []
    );
    return (
        <TeamPanel
            description={`${formatTeamNumber(data.totalElements)} Treffer · generiert ${formatTeamDate(data.generatedAt)}`}
            eyebrow="EREIGNISSE"
            title="Aktivitätsprotokoll"
        >
            <TeamTable
                caption="Gefilterte Teamaktivitäten"
                columns={columns}
                emptyTitle="Keine Aktivitäten gefunden"
                emptyText="Passe Zeitraum oder Filter an, um andere Teamaktionen abzufragen."
                rows={rows}
            />
            <TeamPagination onPage={onPage} page={Number(data.page) || 0} totalPages={Number(data.totalPages) || 0} />
        </TeamPanel>
    );
}

function FilterInput({ label, value, onChange, type = 'text', placeholder, maxLength }) {
    return (
        <label className="admin-forum-field">
            <span>{label}</span>
            <input
                className="admin-forum-input"
                maxLength={maxLength}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                type={type}
                value={value}
            />
        </label>
    );
}
function FilterSelect({ label, value, onChange, options, placeholder }) {
    return (
        <label className="admin-forum-field">
            <span>{label}</span>
            <select className="admin-forum-input" onChange={(event) => onChange(event.target.value)} value={value}>
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((option) => (
                    <option key={option} value={option}>
                        {humanizeTeamValue(option)}
                    </option>
                ))}
            </select>
        </label>
    );
}
function defaultFilters() {
    const to = new Date();
    const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { from: toLocalDateTime(from), to: toLocalDateTime(to), area: '', actorId: '', action: '', bucket: 'DAY' };
}
function toLocalDateTime(value) {
    const date = new Date(value);
    const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return shifted.toISOString().slice(0, 16);
}
function optionalIso(value) {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}
function bucketLabel(value, bucket) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value || '');
    return new Intl.DateTimeFormat(
        'de-DE',
        bucket === 'HOUR' ? { day: '2-digit', month: '2-digit', hour: '2-digit' } : { day: '2-digit', month: '2-digit' }
    ).format(date);
}
function metadataText(metadata) {
    const entries = Object.entries(metadata || {});
    return entries.length
        ? entries.map(([key, value]) => `${humanizeTeamValue(key)}: ${value}`).join(' · ')
        : 'Keine Zusatzdetails';
}
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY_MS = 24 * 60 * 60 * 1000;

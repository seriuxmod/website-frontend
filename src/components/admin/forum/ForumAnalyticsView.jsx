import { useCallback, useMemo, useState } from 'react';
import { areaY, barY, defineChart, lineY } from '@tanstack/charts';
import { pie, polar, radialArc } from '@tanstack/charts/polar';
import { Chart } from '@tanstack/charts/react/tooltip';
import { scaleBand, scaleLinear, scalePoint } from 'd3-scale';
import {
    FaChartLine,
    FaComments,
    FaEye,
    FaFileLines,
    FaFlag,
    FaHeart,
    FaLightbulb,
    FaNewspaper,
    FaUsers
} from 'react-icons/fa6';
import { forumApi } from '../../../lib/forumApi';
import { AdminEmptyState, AdminMetricCard } from '../AdminUi';
import {
    ForumAdminPage,
    ForumLoading,
    ForumPanel,
    LiveDataTable,
    columnHelper,
    formatDate,
    formatNumber,
    useForumResource
} from './AdminForumShared';

const PERIODS = [7, 30, 90];
const COLORS = ['#ff721b', '#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#fb7185'];

export default function ForumAnalyticsView() {
    const [days, setDays] = useState(30);
    const loader = useCallback(() => forumApi.admin.analytics(days), [days]);
    const resource = useForumResource(loader, [loader]);
    const overview = useMemo(() => normalizeOverview(resource.data), [resource.data]);

    return (
        <ForumAdminPage
            actions={
                <div className="flex rounded-xl border border-white/[.07] bg-[#0b0c10] p-1">
                    {PERIODS.map((period) => (
                        <button
                            className={`rounded-lg px-3 py-2 text-[10px] font-extrabold transition ${days === period ? 'bg-orange-500 text-white' : 'text-zinc-500 hover:text-zinc-200'}`}
                            key={period}
                            onClick={() => setDays(period)}
                            type="button"
                        >
                            {period} Tage
                        </button>
                    ))}
                </div>
            }
            description="Reichweite, Beteiligung und Moderationsaufkommen aus echten Forum-Daten in einem Zeitfenster vergleichen."
            error={resource.error}
            eyebrow="LIVE-ANALYSE"
            icon={FaChartLine}
            loading={resource.loading}
            onRetry={resource.reload}
            title="Nutzungsstatistik"
        >
            {resource.loading || !resource.data ? (
                <ForumLoading
                    title="Nutzungsstatistik wird berechnet"
                    text="Beiträge, Themen und Interaktionen werden aggregiert."
                />
            ) : (
                <>
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <Metric
                            icon={FaComments}
                            label="Neue Themen"
                            value={overview.period.topics}
                            detail={`im Zeitraum von ${days} Tagen`}
                            tone="orange"
                        />
                        <Metric
                            icon={FaFileLines}
                            label="Neue Beiträge"
                            value={overview.period.posts}
                            detail={`im Zeitraum von ${days} Tagen`}
                            tone="sky"
                        />
                        <Metric
                            icon={FaUsers}
                            label="Aktive Autoren"
                            value={overview.period.activeContributors}
                            detail="eindeutige Beteiligte im Zeitraum"
                            tone="violet"
                        />
                        <Metric
                            icon={FaEye}
                            label="Aufrufe gesamt"
                            value={overview.totalViews}
                            detail="kumulativ über alle aktiven Foren"
                            tone="emerald"
                        />
                        <Metric
                            icon={FaHeart}
                            label="Neue Reaktionen"
                            value={overview.period.reactions}
                            detail={`im Zeitraum von ${days} Tagen`}
                            tone="red"
                        />
                        <Metric
                            icon={FaFlag}
                            label="Offene Meldungen"
                            value={overview.totals.openReports}
                            detail="wartet auf Moderation"
                            tone="red"
                        />
                        <Metric
                            icon={FaLightbulb}
                            label="Offene Vorschläge"
                            value={overview.totals.openSuggestions}
                            detail="Community-Feedback in Bearbeitung"
                            tone="orange"
                        />
                        <Metric
                            icon={FaNewspaper}
                            label="Veröffentlichte News"
                            value={overview.totals.publishedBlogPosts}
                            detail="sichtbare Blogbeiträge"
                            tone="sky"
                        />
                    </section>

                    <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.5fr)_minmax(330px,.5fr)]">
                        <ActivityChart rows={overview.activity} />
                        <DistributionChart rows={overview.distribution} />
                    </section>

                    <section className="mt-6">
                        <TopForumsTable rows={overview.topForums} generatedAt={overview.generatedAt} />
                    </section>
                </>
            )}
        </ForumAdminPage>
    );
}

function Metric({ icon, label, value, detail, tone }) {
    const available = Number.isFinite(Number(value));
    return (
        <AdminMetricCard
            detail={available ? detail : 'Vom Backend nicht ermittelbar'}
            icon={icon}
            label={label}
            tone={tone}
            value={available ? formatNumber(value) : 'Nicht verfügbar'}
        />
    );
}

function ActivityChart({ rows }) {
    const definition = useMemo(() => (rows.length ? createActivityDefinition(rows) : null), [rows]);
    return (
        <ForumPanel
            description="Themen und Beiträge pro Kalendertag; die Daten stammen direkt aus dem Forum-Service."
            eyebrow="AKTIVITÄTSVERLAUF"
            title="Community-Puls"
        >
            {definition ? (
                <div className="min-h-[370px] px-2 pb-5 pt-6 text-zinc-300 sm:px-5">
                    <Chart ariaLabel="Forum-Aktivität nach Tag" definition={definition} height={330} />
                </div>
            ) : (
                <div className="p-6">
                    <AdminEmptyState
                        title="Noch keine Aktivitätsdaten"
                        text="Im gewählten Zeitraum wurden keine Beiträge oder Themen erfasst."
                    />
                </div>
            )}
        </ForumPanel>
    );
}

function createActivityDefinition(rows) {
    return defineChart({
        marks: [
            areaY(rows, {
                id: 'forum-posts-area',
                x: 'label',
                y: 'posts',
                fill: 'url(#forum-activity-fill)',
                fillOpacity: 0.72
            }),
            lineY(rows, {
                id: 'forum-posts-line',
                x: 'label',
                y: 'posts',
                stroke: '#ff721b',
                strokeWidth: 2.5,
                points: true
            }),
            lineY(rows, {
                id: 'forum-topics-line',
                x: 'label',
                y: 'topics',
                stroke: '#38bdf8',
                strokeWidth: 2,
                points: true
            })
        ],
        scales: {
            x: { scale: () => scalePoint().padding(0.22), axis: { label: 'Datum' } },
            y: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'Neue Inhalte' } }
        },
        gradients: [
            {
                id: 'forum-activity-fill',
                x1: 0,
                y1: 1,
                x2: 0,
                y2: 0,
                stops: [
                    { offset: 0, color: '#ff721b', opacity: 0.01 },
                    { offset: 1, color: '#ff721b', opacity: 0.36 }
                ]
            }
        ],
        clip: true,
        theme: chartTheme(['#ff721b', '#38bdf8'])
    });
}

function DistributionChart({ rows }) {
    const usable = rows.filter((row) => Number(row.value) > 0);
    const total = usable.reduce((sum, row) => sum + Number(row.value), 0);
    const definition = useMemo(() => (usable.length ? createDistributionDefinition(usable) : null), [usable]);
    return (
        <ForumPanel
            description="Anteil der vom Backend erfassten Inhaltstypen."
            eyebrow="INHALTSMIX"
            title="Verteilung"
        >
            {definition ? (
                <>
                    <div className="relative mx-auto h-[285px] max-w-[330px] p-4">
                        <Chart ariaLabel="Verteilung der Forum-Inhalte" definition={definition} height={260} />
                        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                            <div>
                                <span className="text-[9px] font-extrabold uppercase tracking-[.15em] text-zinc-600">
                                    Gesamt
                                </span>
                                <strong className="mt-1 block font-display text-2xl font-black">
                                    {formatNumber(total)}
                                </strong>
                            </div>
                        </div>
                    </div>
                    <div className="grid gap-2 border-t border-white/[.055] p-5 sm:grid-cols-2 2xl:grid-cols-1">
                        {usable.map((row, index) => (
                            <div className="flex items-center justify-between gap-3 text-xs" key={row.key}>
                                <span className="flex items-center gap-2 text-zinc-500">
                                    <i
                                        className="h-2 w-2 rounded-full"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    {row.label}
                                </span>
                                <b>{formatNumber(row.value)}</b>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="p-6">
                    <AdminEmptyState
                        title="Keine Verteilung verfügbar"
                        text="Das Backend hat für den Zeitraum keine Inhaltswerte geliefert."
                    />
                </div>
            )}
        </ForumPanel>
    );
}

function createDistributionDefinition(rows) {
    const arcs = pie(rows, { value: 'value', gapAngle: (Math.PI / 180) * 3 });
    return defineChart({
        marks: [
            polar({
                radiusRatio: 0.86,
                marks: [
                    radialArc(arcs, {
                        id: 'forum-content-distribution',
                        key: 'key',
                        innerRadius: ({ radius }) => radius * 0.62,
                        cornerRadius: 8,
                        color: 'key'
                    })
                ],
                scales: { angle: null, radius: null }
            })
        ],
        scales: { x: null, y: null },
        color: { domain: rows.map((row) => row.key), range: COLORS },
        margin: 0,
        theme: chartTheme(COLORS)
    });
}

function TopForumsTable({ rows, generatedAt }) {
    const chartRows = useMemo(
        () =>
            rows.slice(0, 8).map((row) => ({
                ...row,
                shortTitle: row.title.length > 18 ? `${row.title.slice(0, 17)}…` : row.title
            })),
        [rows]
    );
    const definition = useMemo(
        () => (chartRows.length ? createForumPerformanceDefinition(chartRows) : null),
        [chartRows]
    );
    const columns = useMemo(
        () =>
            columnHelper.columns([
                columnHelper.accessor('title', {
                    header: 'Forum',
                    cell: (context) => <b className="text-sm text-zinc-200">{context.getValue()}</b>
                }),
                columnHelper.accessor('topics', {
                    header: 'Themen',
                    cell: (context) => (
                        <span className="text-xs font-bold text-zinc-400">{formatNumber(context.getValue())}</span>
                    )
                }),
                columnHelper.accessor('posts', {
                    header: 'Beiträge',
                    cell: (context) => (
                        <span className="text-xs font-bold text-zinc-400">{formatNumber(context.getValue())}</span>
                    )
                }),
                columnHelper.accessor('views', {
                    header: 'Aufrufe',
                    cell: (context) => (
                        <span className="text-xs font-bold text-zinc-400">{formatNumber(context.getValue())}</span>
                    )
                }),
                columnHelper.accessor('lastActivityAt', {
                    header: 'Letzte Aktivität',
                    cell: (context) => <time className="text-xs text-zinc-500">{formatDate(context.getValue())}</time>
                })
            ]),
        []
    );

    return (
        <ForumPanel
            description={`Zuletzt berechnet: ${formatDate(generatedAt)}`}
            eyebrow="REICHWEITE"
            title="Aktivste Foren"
        >
            {definition && (
                <div className="border-b border-white/[.055] px-2 pb-5 pt-6 text-zinc-300 sm:px-5">
                    <Chart ariaLabel="Beiträge je aktivem Forum" definition={definition} height={260} />
                </div>
            )}
            <LiveDataTable
                columns={columns}
                emptyText="Sobald Themen entstehen, erscheint hier der Vergleich nach Forum."
                emptyTitle="Keine Forum-Aktivität vorhanden"
                getSearchValue={(row) => `${row.title} ${row.forumId}`}
                rows={rows}
                searchPlaceholder="Foren durchsuchen …"
            />
        </ForumPanel>
    );
}

function createForumPerformanceDefinition(rows) {
    return defineChart({
        marks: [
            barY(rows, {
                id: 'forum-performance-bars',
                x: 'shortTitle',
                y: 'posts',
                fill: '#ff721b',
                cornerRadius: 7
            })
        ],
        scales: {
            x: { scale: () => scaleBand().padding(0.3), axis: { label: 'Forum' } },
            y: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'Beiträge gesamt' } }
        },
        clip: true,
        theme: chartTheme(['#ff721b'])
    });
}

function normalizeOverview(payload) {
    const totals = payload?.totals || payload?.summary || {};
    const period = payload?.period || {};
    const activity = (payload?.activity || payload?.timeline || []).map((row) => ({
        ...row,
        label: row.label || formatShortDate(row.date || row.recordedAt),
        topics: Number(row.topics),
        posts: Number(row.posts)
    }));
    const distributionSource = payload?.contentDistribution || payload?.distribution || [];
    const distribution = distributionSource.length
        ? distributionSource.map((row, index) => ({
              key: row.key || `content-${index}`,
              label: row.label || row.key || 'Inhalt',
              value: numericOrNull(row.value)
          }))
        : [
              { key: 'topics', label: 'Neue Themen', value: numericOrNull(period.topics) },
              { key: 'posts', label: 'Neue Beiträge', value: numericOrNull(period.posts) },
              { key: 'reactions', label: 'Neue Reaktionen', value: numericOrNull(period.reactions) }
          ];
    const forumPerformance = payload?.forumPerformance || payload?.topForums || [];
    const totalViews =
        forumPerformance.length && forumPerformance.every((row) => Number.isFinite(Number(row.views)))
            ? forumPerformance.reduce((sum, row) => sum + Number(row.views), 0)
            : null;
    return {
        generatedAt: payload?.generatedAt || payload?.period?.to,
        totals: {
            openReports: totals.openReports,
            openSuggestions: totals.openSuggestions,
            publishedBlogPosts: totals.publishedBlogPosts
        },
        period: {
            topics: period.topics,
            posts: period.posts,
            reactions: period.reactions,
            activeContributors: period.activeContributors
        },
        totalViews,
        activity,
        distribution,
        topForums: forumPerformance
    };
}

function numericOrNull(value) {
    return Number.isFinite(Number(value)) ? Number(value) : null;
}

function formatShortDate(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? String(value)
        : new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' }).format(date);
}

function chartTheme(palette) {
    return { foreground: '#d4d4d8', muted: '#5f6069', grid: '#272931', background: 'transparent', palette };
}

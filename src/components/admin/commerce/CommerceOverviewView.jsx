import { useCallback, useMemo, useState } from 'react';
import { areaY, barY, defineChart, lineY } from '@tanstack/charts';
import { pie, polar, radialArc } from '@tanstack/charts/polar';
import { Chart } from '@tanstack/charts/react/tooltip';
import { scaleBand, scaleLinear, scalePoint } from 'd3-scale';
import {
    FaChartLine,
    FaCircleCheck,
    FaCoins,
    FaCube,
    FaReceipt,
    FaUsers
} from 'react-icons/fa6';
import { formatStorePrice, storeApi } from '../../../lib/storeApi';
import { AdminEmptyState, AdminMetricCard } from '../AdminUi';
import {
    CommerceAdminPage,
    CommerceLoading,
    CommercePanel,
    LiveDataTable,
    StatusPill,
    columnHelper,
    formatDate,
    formatNumber,
    shortId,
    useCommerceResource
} from './AdminCommerceShared';

const PERIODS = [7, 30, 90];
const COLORS = ['#ff721b', '#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#f87171'];

export default function CommerceOverviewView() {
    const [days, setDays] = useState(30);
    const overview = useCommerceResource(useCallback(() => storeApi.admin.overview(), []), []);
    const analyticsLoader = useCallback(() => storeApi.admin.analytics(days), [days]);
    const analytics = useCommerceResource(analyticsLoader, [analyticsLoader]);
    const orders = useCommerceResource(useCallback(() => storeApi.admin.orders(0, 8), []), []);
    const audits = useCommerceResource(useCallback(() => storeApi.admin.auditLogs({ page: 0, size: 8 }), []), []);
    const data = useMemo(() => normalizeAnalytics(analytics.data), [analytics.data]);
    const loading = overview.loading || analytics.loading;
    const error = overview.error || analytics.error;
    const reload = () => Promise.all([overview.reload(), analytics.reload(), orders.reload(), audits.reload()]);

    return (
        <CommerceAdminPage
            actions={
                <div className="flex rounded-xl border border-white/[.07] bg-[#0b0c10] p-1">
                    {PERIODS.map((period) => (
                        <button
                            className={
                                'rounded-lg px-3 py-2 text-[10px] font-extrabold transition ' +
                                (days === period ? 'bg-orange-500 text-white' : 'text-zinc-500 hover:text-zinc-200')
                            }
                            key={period}
                            onClick={() => setDays(period)}
                            type="button"
                        >
                            {period} Tage
                        </button>
                    ))}
                </div>
            }
            description="Umsatz, Bestellungen, Zahlungen und Produktleistung direkt aus dem Store-Service auswerten."
            error={error}
            eyebrow="LIVE-ANALYSE"
            icon={FaChartLine}
            loading={loading}
            onRetry={reload}
            title="Shopübersicht"
        >
            {loading || !overview.data || !analytics.data ? (
                <CommerceLoading
                    title="Shopkennzahlen werden berechnet"
                    text="Bestellungen, Zahlungen und Katalogdaten werden für den gewählten Zeitraum aggregiert."
                />
            ) : (
                <>
                    <Metrics overview={overview.data} period={data.period} previous={data.previousPeriod} />
                    <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]">
                        <ActivityChart rows={data.activity} />
                        <StatusOverview orders={data.orderStatuses} payments={data.paymentStatuses} />
                    </section>
                    <section className="mt-6 grid gap-6 xl:grid-cols-2">
                        <DistributionChart
                            description="Abgeschlossene Zahlungen nach angebundenem Zahlungsanbieter."
                            empty="Im Zeitraum wurden keine Zahlungen einem Anbieter zugeordnet."
                            rows={data.gateways}
                            title="Zahlungsanbieter"
                        />
                        <TopProductsChart rows={data.topProducts} />
                    </section>
                    <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,.75fr)]">
                        <RecentOrders resource={orders} />
                        <RecentAudits resource={audits} generatedAt={data.generatedAt} />
                    </section>
                </>
            )}
        </CommerceAdminPage>
    );
}

function Metrics({ overview, period, previous }) {
    const revenue = period.revenueCents ?? sumCurrencies(period.revenueByCurrency) ?? sumCurrencies(overview.revenueByCurrency);
    const orderCount = period.orders ?? overview.orders;
    const completed = period.completedPayments ?? overview.completedPayments;
    const customers = period.newCustomers ?? period.customers ?? overview.customers;
    const average = period.averageOrderValueCents ?? (orderCount > 0 ? revenue / orderCount : 0);
    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminMetricCard
                detail={comparison(revenue, previous.revenueCents, 'zum vorherigen Zeitraum')}
                icon={FaCoins}
                label="Umsatz"
                tone="orange"
                value={formatStorePrice(revenue)}
            />
            <AdminMetricCard
                detail={comparison(orderCount, previous.orders, 'zum vorherigen Zeitraum')}
                icon={FaReceipt}
                label="Bestellungen"
                tone="sky"
                value={formatNumber(orderCount)}
            />
            <AdminMetricCard
                detail={formatNumber(completed) + ' erfolgreiche Zahlungen'}
                icon={FaCircleCheck}
                label="Ø Bestellwert"
                tone="emerald"
                value={formatStorePrice(average)}
            />
            <AdminMetricCard
                detail={comparison(customers, previous.newCustomers ?? previous.customers, 'zum vorherigen Zeitraum')}
                icon={FaUsers}
                label="Neue Kunden"
                tone="violet"
                value={formatNumber(customers)}
            />
        </section>
    );
}

function ActivityChart({ rows }) {
    const definition = useMemo(() => (rows.length ? activityDefinition(rows) : null), [rows]);
    return (
        <CommercePanel
            description="Tagesgenaue Umsatzentwicklung im ausgewählten Vergleichszeitraum."
            eyebrow="ZEITREIHE"
            title="Umsatzentwicklung"
        >
            {definition ? (
                <div className="min-h-[370px] px-2 pb-5 pt-6 text-zinc-300 sm:px-5">
                    <Chart ariaLabel="Umsatzentwicklung des Stores" definition={definition} height={330} />
                </div>
            ) : (
                <div className="p-6">
                    <AdminEmptyState title="Noch kein Umsatzverlauf" text="Für diesen Zeitraum liegen keine Zahlungen vor." />
                </div>
            )}
        </CommercePanel>
    );
}

function activityDefinition(rows) {
    return defineChart({
        marks: [
            areaY(rows, {
                id: 'commerce-revenue-area',
                x: 'label',
                y: 'revenue',
                fill: 'url(#commerce-revenue-fill)',
                fillOpacity: 0.7
            }),
            lineY(rows, {
                id: 'commerce-revenue-line',
                x: 'label',
                y: 'revenue',
                stroke: '#ff721b',
                strokeWidth: 2.5,
                points: true
            })
        ],
        scales: {
            x: { scale: () => scalePoint().padding(0.22), axis: { label: 'Datum' } },
            y: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'Umsatz in EUR' } }
        },
        gradients: [
            {
                id: 'commerce-revenue-fill',
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
        theme: chartTheme(['#ff721b'])
    });
}

function StatusOverview({ orders, payments }) {
    return (
        <CommercePanel
            description="Verteilung der aktuellen Bestell- und Zahlungszustände."
            eyebrow="STATUS"
            title="Vorgangsstatus"
        >
            <div className="grid gap-5 p-5 sm:grid-cols-2 2xl:grid-cols-1">
                <MiniDonut rows={orders} title="Bestellungen" />
                <MiniDonut rows={payments} title="Zahlungen" />
            </div>
        </CommercePanel>
    );
}

function MiniDonut({ rows, title }) {
    const usable = rows.filter((row) => row.value > 0);
    const definition = useMemo(() => (usable.length ? donutDefinition(usable) : null), [usable]);
    const total = usable.reduce((sum, row) => sum + row.value, 0);
    if (!definition) {
        return <AdminEmptyState title={'Keine ' + title} text="Für den Zeitraum sind keine Vorgänge vorhanden." />;
    }
    return (
        <article className="grid min-h-[220px] grid-cols-[150px_1fr] items-center gap-3 rounded-2xl border border-white/[.055] bg-black/15 p-3">
            <div className="relative h-[145px]">
                <Chart ariaLabel={title + ' nach Status'} definition={definition} height={145} />
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                    <div>
                        <strong className="block font-display text-xl">{formatNumber(total)}</strong>
                        <span className="text-[8px] uppercase tracking-wider text-zinc-600">{title}</span>
                    </div>
                </div>
            </div>
            <div className="space-y-2">
                {usable.slice(0, 6).map((row, index) => (
                    <div className="flex items-center justify-between gap-3 text-[10px]" key={row.key}>
                        <span className="flex min-w-0 items-center gap-2 truncate text-zinc-500">
                            <i className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            {row.label}
                        </span>
                        <b>{formatNumber(row.value)}</b>
                    </div>
                ))}
            </div>
        </article>
    );
}

function DistributionChart({ rows, title, description, empty }) {
    const usable = rows.filter((row) => row.value > 0);
    const definition = useMemo(() => (usable.length ? donutDefinition(usable) : null), [usable]);
    return (
        <CommercePanel description={description} eyebrow="ZAHLUNGEN" title={title}>
            {definition ? (
                <div className="grid items-center gap-2 p-5 sm:grid-cols-[260px_1fr]">
                    <div className="h-[245px]">
                        <Chart ariaLabel={title} definition={definition} height={240} />
                    </div>
                    <div className="space-y-3">
                        {usable.map((row, index) => (
                            <div className="flex items-center justify-between gap-4 text-xs" key={row.key}>
                                <span className="flex items-center gap-2 text-zinc-500">
                                    <i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    {row.label}
                                </span>
                                <b>{formatNumber(row.value)}</b>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="p-6">
                    <AdminEmptyState title={'Keine ' + title} text={empty} />
                </div>
            )}
        </CommercePanel>
    );
}

function donutDefinition(rows) {
    const arcs = pie(rows, { value: 'value', gapAngle: (Math.PI / 180) * 3 });
    return defineChart({
        marks: [
            polar({
                radiusRatio: 0.86,
                marks: [
                    radialArc(arcs, {
                        id: 'commerce-distribution-' + rows.map((row) => row.key).join('-'),
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

function TopProductsChart({ rows }) {
    const chartRows = rows.slice(0, 8).map((row) => ({
        ...row,
        shortName: row.name.length > 20 ? row.name.slice(0, 19) + '…' : row.name
    }));
    const definition = useMemo(() => (chartRows.length ? topProductsDefinition(chartRows) : null), [chartRows]);
    return (
        <CommercePanel
            description="Meistverkaufte Produkte nach Stückzahl im gewählten Zeitraum."
            eyebrow="KATALOGLEISTUNG"
            title="Topprodukte"
        >
            {definition ? (
                <div className="px-2 pb-5 pt-6 text-zinc-300 sm:px-5">
                    <Chart ariaLabel="Meistverkaufte Produkte" definition={definition} height={280} />
                </div>
            ) : (
                <div className="p-6">
                    <AdminEmptyState title="Noch keine Produktverkäufe" text="Erfolgreiche Bestellungen erscheinen hier." />
                </div>
            )}
        </CommercePanel>
    );
}

function topProductsDefinition(rows) {
    return defineChart({
        marks: [
            barY(rows, {
                id: 'commerce-top-products',
                x: 'shortName',
                y: 'quantity',
                fill: '#ff721b',
                cornerRadius: 7
            })
        ],
        scales: {
            x: { scale: () => scaleBand().padding(0.3), axis: { label: 'Produkt' } },
            y: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'Verkaufte Einheiten' } }
        },
        clip: true,
        theme: chartTheme(['#ff721b'])
    });
}

function RecentOrders({ resource }) {
    const rows = pageItems(resource.data);
    const columns = useMemo(
        () =>
            columnHelper.columns([
                columnHelper.accessor('id', {
                    header: 'Bestellung',
                    cell: (context) => <b className="font-mono text-xs text-zinc-200">#{shortId(context.getValue())}</b>
                }),
                columnHelper.accessor('fromUserId', {
                    header: 'Kunde',
                    cell: (context) => <span className="font-mono text-[10px] text-zinc-500">{shortId(context.getValue())}</span>
                }),
                columnHelper.accessor('totalCents', {
                    header: 'Gesamt',
                    cell: (context) => <b className="text-xs">{formatStorePrice(context.getValue(), context.row.original.currency)}</b>
                }),
                columnHelper.accessor('status', {
                    header: 'Status',
                    cell: (context) => <StatusPill value={context.getValue()} />
                }),
                columnHelper.accessor('createdAt', {
                    header: 'Erstellt',
                    cell: (context) => <time className="text-xs text-zinc-500">{formatDate(context.getValue())}</time>
                })
            ]),
        []
    );
    return (
        <CommercePanel description="Die zuletzt im Store erstellten Vorgänge." eyebrow="LIVE-BESTELLUNGEN" title="Letzte Bestellungen">
            {resource.loading ? (
                <div className="p-6"><CommerceLoading title="Bestellungen werden geladen" /></div>
            ) : resource.error ? (
                <div className="p-6 text-sm text-red-300">{resource.error}</div>
            ) : (
                <LiveDataTable
                    columns={columns}
                    emptyText="Sobald ein Checkout abgeschlossen wird, erscheint er hier."
                    emptyTitle="Keine Bestellungen vorhanden"
                    getSearchValue={(row) => [row.id, row.fromUserId, row.toUserId, row.status].join(' ')}
                    rows={rows}
                    searchPlaceholder="Bestellungen durchsuchen …"
                />
            )}
        </CommercePanel>
    );
}

function RecentAudits({ resource, generatedAt }) {
    const rows = pageItems(resource.data);
    return (
        <CommercePanel
            description={'Analytics aktualisiert: ' + formatDate(generatedAt)}
            eyebrow="ÄNDERUNGSVERLAUF"
            title="Letzte Store-Aktionen"
        >
            {resource.loading ? (
                <div className="p-6"><CommerceLoading title="Änderungsverlauf wird geladen" /></div>
            ) : resource.error ? (
                <div className="p-6 text-sm text-red-300">{resource.error}</div>
            ) : rows.length ? (
                <div className="divide-y divide-white/[.05]">
                    {rows.map((row) => (
                        <article className="flex items-start gap-3 px-5 py-4 sm:px-6" key={row.id}>
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orange-400/[.08] text-orange-300">
                                <FaCube />
                            </span>
                            <div className="min-w-0 flex-1">
                                <b className="block truncate text-xs text-zinc-300">{humanize(row.action)}</b>
                                <p className="mt-1 truncate font-mono text-[9px] text-zinc-600">
                                    {row.entityType || 'store'} · {shortId(row.entityId)}
                                </p>
                            </div>
                            <time className="text-right text-[9px] text-zinc-600">{formatDate(row.createdAt)}</time>
                        </article>
                    ))}
                </div>
            ) : (
                <CommerceEmpty title="Noch keine Änderungen" text="Administrative Store-Aktionen werden hier protokolliert." />
            )}
        </CommercePanel>
    );
}

function normalizeAnalytics(payload) {
    const period = payload?.period || {};
    const previousPeriod = payload?.previousPeriod || {};
    const activity = (payload?.activity || []).map((row) => ({
        ...row,
        label: row.label || shortDate(row.date || row.day || row.recordedAt),
        revenue: moneyValue(row.revenueCents ?? row.amountCents ?? row.revenue),
        orders: numeric(row.orders ?? row.orderCount)
    }));
    return {
        generatedAt: payload?.generatedAt,
        period: {
            ...period,
            revenueCents: numericNullable(period.revenueCents ?? period.amountCents ?? period.revenue),
            orders: numericNullable(period.orders ?? period.orderCount),
            completedPayments: numericNullable(period.completedPayments),
            newCustomers: numericNullable(period.newCustomers),
            customers: numericNullable(period.customers),
            averageOrderValueCents: numericNullable(period.averageOrderValueCents)
        },
        previousPeriod,
        activity,
        orderStatuses: normalizeDistribution(payload?.orderStatusDistribution),
        paymentStatuses: normalizeDistribution(payload?.paymentStatusDistribution),
        gateways: normalizeDistribution(payload?.gatewayDistribution),
        topProducts: (payload?.topProducts || []).map((row, index) => ({
            key: row.productId || row.id || 'product-' + index,
            name: row.productName || row.name || row.productId || 'Produkt',
            quantity: numeric(row.quantity ?? row.sales ?? row.count),
            revenueCents: numeric(row.revenueCents)
        }))
    };
}

function normalizeDistribution(rows) {
    if (!rows) return [];
    const source = Array.isArray(rows) ? rows : Object.entries(rows).map(([key, value]) => ({ key, value }));
    return source.map((row, index) => ({
        key: row.key || row.status || row.gateway || row.provider || 'item-' + index,
        label: humanize(row.label || row.status || row.gateway || row.provider || row.key || 'Unbekannt'),
        value: numeric(row.value ?? row.count ?? row.total)
    }));
}

function pageItems(payload) {
    return payload?.items || payload?.content || [];
}

function numeric(value) {
    return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function numericNullable(value) {
    return Number.isFinite(Number(value)) ? Number(value) : null;
}

function moneyValue(value) {
    const cents = numeric(value);
    return cents / 100;
}

function sumCurrencies(values) {
    if (!values || typeof values !== 'object') return null;
    return Object.values(values).reduce((sum, value) => sum + numeric(value), 0);
}

function comparison(value, previous, suffix) {
    if (!Number.isFinite(Number(value)) || !Number.isFinite(Number(previous))) return suffix;
    if (Number(previous) === 0) return Number(value) === 0 ? 'unverändert ' + suffix : 'neu ' + suffix;
    const delta = ((Number(value) - Number(previous)) / Math.abs(Number(previous))) * 100;
    return (delta >= 0 ? '+' : '') + new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(delta) + ' % ' + suffix;
}

function shortDate(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? String(value)
        : new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' }).format(date);
}

function humanize(value) {
    return String(value || 'Unbekannt')
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function chartTheme(palette) {
    return { foreground: '#d4d4d8', muted: '#5f6069', grid: '#272931', background: 'transparent', palette };
}

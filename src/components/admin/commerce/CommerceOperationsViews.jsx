import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
    FaBagShopping,
    FaBan,
    FaBoxOpen,
    FaCircleCheck,
    FaCoins,
    FaCreditCard,
    FaMagnifyingGlass,
    FaReceipt,
    FaSpinner,
    FaUser,
    FaUsers
} from 'react-icons/fa6';
import { hasAnyPermission } from '../../../lib/auth';
import { formatStorePrice, storeApi } from '../../../lib/storeApi';
import {
    CommerceAdminPage,
    CommerceEmpty,
    CommerceError,
    CommerceLoading,
    CommercePagination,
    CommercePanel,
    LiveDataTable,
    StatusPill,
    columnHelper,
    formatDate,
    formatNumber,
    shortId,
    useCommerceResource
} from './AdminCommerceShared';

const PAGE_SIZE = 25;

export function CommerceCustomersView({ user }) {
    const [input, setInput] = useState('');
    const [query, debouncer] = useDebouncedValue(input, { wait: 320 }, (state) => ({ isPending: state.isPending }));
    const [page, setPage] = useState(0);
    const [selectedId, setSelectedId] = useState('');
    const listLoader = useCallback(() => storeApi.admin.customers(page, PAGE_SIZE, query.trim()), [page, query]);
    const customers = useCommerceResource(listLoader, [listLoader]);
    const detailLoader = useCallback(
        () => (selectedId ? storeApi.admin.customer(selectedId, 50) : Promise.resolve(null)),
        [selectedId]
    );
    const detail = useCommerceResource(detailLoader, [detailLoader]);
    const rows = pageItems(customers.data);
    const selected = normalizeCustomerDetail(detail.data);
    const canAdjust = hasAnyPermission(user, 'store.credits.write');
    const columns = useMemo(
        () =>
            columnHelper.columns([
                columnHelper.accessor('username', {
                    header: 'Kunde',
                    cell: (context) => (
                        <div>
                            <b className="block text-sm text-zinc-200">{context.getValue() || 'Unbekannter Spieler'}</b>
                            <span className="font-mono text-[9px] text-zinc-600">{shortId(context.row.original.id)}</span>
                        </div>
                    )
                }),
                columnHelper.accessor('billingEmail', {
                    header: 'Rechnungskontakt',
                    cell: (context) => <span className="text-xs text-zinc-500">{context.getValue() || 'Nicht hinterlegt'}</span>
                }),
                columnHelper.accessor('orderCount', {
                    header: 'Bestellungen',
                    cell: (context) => <b className="text-xs">{formatNumber(context.getValue())}</b>
                }),
                columnHelper.accessor('creditsCents', {
                    header: 'Credits',
                    cell: (context) => <b className="text-xs text-orange-200">{formatCredits(context.getValue())}</b>
                }),
                columnHelper.accessor('lastOrderAt', {
                    header: 'Letzter Kauf',
                    cell: (context) => <time className="text-xs text-zinc-500">{formatDate(context.getValue())}</time>
                }),
                columnHelper.display({
                    id: 'actions',
                    header: '',
                    cell: (context) => (
                        <button
                            className="admin-forum-secondary !px-3 !py-2"
                            onClick={() => setSelectedId(context.row.original.id)}
                            type="button"
                        >
                            Öffnen
                        </button>
                    )
                })
            ]),
        []
    );

    useEffect(() => setPage(0), [query]);

    return (
        <CommerceAdminPage
            description="Kaufverläufe, Rechnungsprofile, Freischaltungen und Store-Credits je Minecraft-Konto prüfen."
            error={customers.error}
            eyebrow="KUNDENVERWALTUNG"
            icon={FaUsers}
            loading={customers.loading}
            onRetry={customers.reload}
            title="Kunden"
        >
            <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.3fr)_minmax(390px,.7fr)]">
                <CommercePanel
                    actions={
                        <label className="relative block w-full min-w-[280px]">
                            <span className="sr-only">Kunden serverseitig suchen</span>
                            <FaMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-zinc-600" />
                            <input
                                className="h-11 w-full rounded-xl border border-white/[.075] bg-[#0b0c10] pl-10 pr-10 text-xs text-zinc-200 outline-none transition placeholder:text-zinc-700 focus:border-orange-400/35"
                                onChange={(event) => setInput(event.target.value)}
                                placeholder="Name, UUID oder E-Mail …"
                                type="search"
                                value={input}
                            />
                            {debouncer.state.isPending && (
                                <FaSpinner className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-xs text-orange-300" />
                            )}
                        </label>
                    }
                    description="Die Suche wird gedrosselt und vom Store-Service über alle Kunden ausgeführt."
                    eyebrow="VERZEICHNIS"
                    title="Store-Konten"
                >
                    {customers.loading ? (
                        <div className="p-6"><CommerceLoading title="Kunden werden geladen" /></div>
                    ) : (
                        <>
                            <LiveDataTable
                                columns={columns}
                                emptyText={query ? 'Passe den Suchbegriff an.' : 'Nach dem ersten Checkout erscheint das Konto hier.'}
                                emptyTitle={query ? 'Kein Kunde gefunden' : 'Noch keine Store-Kunden'}
                                getSearchValue={(row) => [row.username, row.id, row.billingEmail].join(' ')}
                                rows={rows}
                                searchPlaceholder="Sichtbare Seite filtern …"
                            />
                            <CommercePagination
                                onPage={setPage}
                                page={pageNumber(customers.data, page)}
                                size={pageSize(customers.data)}
                                total={pageTotal(customers.data)}
                            />
                        </>
                    )}
                </CommercePanel>
                <CustomerDetail
                    canAdjust={canAdjust}
                    onChanged={async () => {
                        await Promise.all([customers.reload(), detail.reload()]);
                    }}
                    resource={detail}
                    selected={selected}
                    selectedId={selectedId}
                />
            </div>
        </CommerceAdminPage>
    );
}

function CustomerDetail({ resource, selected, selectedId, canAdjust, onChanged }) {
    if (!selectedId) {
        return (
            <CommercePanel className="h-fit" eyebrow="DETAILS" title="Kundenkonto">
                <CommerceEmpty title="Kein Kunde ausgewählt" text="Öffne links einen Eintrag für Kaufverlauf und Freischaltungen." />
            </CommercePanel>
        );
    }
    if (resource.error) {
        return (
            <CommercePanel className="h-fit" eyebrow="DETAILS" title="Kundenkonto">
                <div className="p-5 sm:p-6"><CommerceError message={resource.error} retry={resource.reload} /></div>
            </CommercePanel>
        );
    }
    if (resource.loading || !resource.data) {
        return (
            <CommercePanel className="h-fit" eyebrow="DETAILS" title="Kundenkonto">
                <div className="p-6"><CommerceLoading title="Kundendetails werden geladen" /></div>
            </CommercePanel>
        );
    }
    const customer = selected.customer;
    return (
        <CommercePanel className="h-fit" eyebrow="DETAILS" title={customer.username || 'Store-Kunde'}>
            <div className="space-y-5 p-5 sm:p-6">
                <div className="rounded-2xl border border-white/[.06] bg-black/15 p-4">
                    <div className="flex items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-400/[.08] text-orange-300"><FaUser /></span>
                        <div className="min-w-0">
                            <b className="block truncate text-sm">{customer.billingEmail || 'Keine Rechnungs-E-Mail'}</b>
                            <span className="mt-1 block break-all font-mono text-[9px] text-zinc-600">{customer.id}</span>
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <DetailMetric label="Credits" value={formatCredits(customer.creditsCents)} />
                        <DetailMetric label="Lifetime-Umsatz" value={formatCurrencyMap(customer.lifetimeRevenueByCurrency)} />
                        <DetailMetric label="Bestellungen" value={formatNumber(customer.orderCount)} />
                        <DetailMetric label="Freischaltungen" value={formatNumber(customer.entitlementCount)} />
                    </div>
                </div>
                {customer.billingAddress && <BillingAddress value={customer.billingAddress} />}
                {canAdjust && <CreditForm customer={customer} onChanged={onChanged} />}
                <VirtualCustomerTimeline data={selected} />
            </div>
        </CommercePanel>
    );
}

function CreditForm({ customer, onChanged }) {
    const [message, setMessage] = useState('');
    const form = useForm({
        defaultValues: { amount: '' },
        onSubmit: async ({ value }) => {
            const amount = Number(String(value.amount).replace(',', '.'));
            const deltaCents = Math.round(amount * 100);
            if (!Number.isFinite(deltaCents) || deltaCents === 0) {
                setMessage('Bitte einen Betrag ungleich 0 eingeben.');
                return;
            }
            const direction = deltaCents > 0 ? 'gutschreiben' : 'abziehen';
            if (!window.confirm(formatCredits(Math.abs(deltaCents)) + ' für ' + (customer.username || customer.id) + ' ' + direction + '?')) return;
            setMessage('');
            try {
                await storeApi.admin.adjustCredits(customer.id, deltaCents);
                form.reset();
                setMessage('Credit-Guthaben wurde aktualisiert.');
                await onChanged();
            } catch (error) {
                setMessage(error.message);
            }
        }
    });
    return (
        <form
            className="rounded-2xl border border-white/[.06] bg-black/15 p-4"
            onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                form.handleSubmit();
            }}
        >
            <b className="text-xs">Credits sicher anpassen</b>
            <p className="mt-1 text-[10px] leading-4 text-zinc-600">Negative Werte ziehen Guthaben ab. Jede Änderung wird protokolliert.</p>
            <form.Field name="amount">
                {(field) => (
                    <label className="mt-3 flex gap-2">
                        <span className="sr-only">Betrag in Credits</span>
                        <input
                            className="forum-input !mt-0 min-w-0 flex-1"
                            inputMode="decimal"
                            onBlur={field.handleBlur}
                            onChange={(event) => field.handleChange(event.target.value)}
                            placeholder="± Credits"
                            required
                            value={field.state.value}
                        />
                        <button className="forum-button-primary shrink-0" type="submit"><FaCoins /> Anwenden</button>
                    </label>
                )}
            </form.Field>
            {message && <p className="mt-3 text-[10px] text-zinc-500">{message}</p>}
        </form>
    );
}

function VirtualCustomerTimeline({ data }) {
    const entries = useMemo(
        () => [
            ...data.orders.map((item) => ({ id: 'order-' + item.id, type: 'Bestellung', icon: FaReceipt, item })),
            ...data.payments.map((item) => ({ id: 'payment-' + item.id, type: 'Zahlung', icon: FaCreditCard, item })),
            ...data.entitlements.map((item) => ({ id: 'entitlement-' + item.id, type: 'Freischaltung', icon: FaBoxOpen, item }))
        ].sort((a, b) => new Date(eventDate(b.item)).getTime() - new Date(eventDate(a.item)).getTime()),
        [data.entitlements, data.orders, data.payments]
    );
    const scrollRef = useRef(null);
    const virtualizer = useVirtualizer({
        count: entries.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 76,
        getItemKey: (index) => entries[index].id,
        overscan: 5
    });
    return (
        <div className="overflow-hidden rounded-2xl border border-white/[.06] bg-black/15">
            <div className="border-b border-white/[.05] px-4 py-3">
                <b className="text-xs">Kaufverlauf & Freischaltungen</b>
                <span className="ml-2 text-[9px] text-zinc-600">{entries.length} Einträge</span>
            </div>
            {entries.length ? (
                <div className="h-[310px] overflow-auto [scrollbar-color:#3f3f46_transparent]" ref={scrollRef}>
                    <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
                        {virtualizer.getVirtualItems().map((virtualRow) => {
                            const entry = entries[virtualRow.index];
                            const Icon = entry.icon;
                            return (
                                <div
                                    className="absolute left-0 top-0 w-full px-4"
                                    key={entry.id}
                                    ref={virtualizer.measureElement}
                                    style={{ transform: 'translateY(' + virtualRow.start + 'px)' }}
                                >
                                    <div className="flex min-h-[76px] items-center gap-3 border-b border-white/[.045] py-3">
                                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-orange-400/[.07] text-[10px] text-orange-300"><Icon /></span>
                                        <div className="min-w-0 flex-1">
                                            <b className="block truncate text-[11px]">{entry.type}</b>
                                            <span className="mt-1 block truncate font-mono text-[9px] text-zinc-600">{shortId(entry.item.id)}</span>
                                        </div>
                                        <div className="text-right">
                                            {entry.item.status ? (
                                                <StatusPill value={entry.item.status} />
                                            ) : (
                                                <span className="text-[9px] font-bold text-zinc-500">
                                                    {formatNumber(entry.item.quantity)}× gewährt
                                                </span>
                                            )}
                                            <time className="mt-1 block text-[8px] text-zinc-700">{formatDate(eventDate(entry.item))}</time>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <CommerceEmpty title="Keine Kundenaktivität" text="Für dieses Konto liegen noch keine Store-Vorgänge vor." />
            )}
        </div>
    );
}

export function CommerceOrdersView({ user }) {
    const [page, setPage] = useState(0);
    const [status, setStatus] = useState('');
    const [selectedId, setSelectedId] = useState('');
    const [mutation, setMutation] = useState({ pending: false, message: '' });
    const listLoader = useCallback(() => storeApi.admin.orders(page, PAGE_SIZE, status), [page, status]);
    const orders = useCommerceResource(listLoader, [listLoader]);
    const detailLoader = useCallback(
        () => (selectedId ? storeApi.admin.order(selectedId) : Promise.resolve(null)),
        [selectedId]
    );
    const detail = useCommerceResource(detailLoader, [detailLoader]);
    const canWrite = hasAnyPermission(user, 'store.orders.write');
    const rows = pageItems(orders.data);
    const columns = useMemo(
        () =>
            columnHelper.columns([
                columnHelper.accessor('id', {
                    header: 'Bestellung',
                    cell: (context) => <b className="font-mono text-xs">#{shortId(context.getValue())}</b>
                }),
                columnHelper.accessor('fromUserId', {
                    header: 'Käufer',
                    cell: (context) => <span className="font-mono text-[10px] text-zinc-500">{shortId(context.getValue())}</span>
                }),
                columnHelper.accessor('toUserId', {
                    header: 'Empfänger',
                    cell: (context) => <span className="font-mono text-[10px] text-zinc-500">{shortId(context.getValue())}</span>
                }),
                columnHelper.accessor('totalCents', {
                    header: 'Gesamt',
                    cell: (context) => <b>{formatStorePrice(context.getValue(), context.row.original.currency)}</b>
                }),
                columnHelper.accessor('status', {
                    header: 'Status',
                    cell: (context) => <StatusPill value={context.getValue()} />
                }),
                columnHelper.accessor('createdAt', {
                    header: 'Erstellt',
                    cell: (context) => <time className="text-xs text-zinc-500">{formatDate(context.getValue())}</time>
                }),
                columnHelper.display({
                    id: 'actions',
                    header: '',
                    cell: (context) => (
                        <button className="admin-forum-secondary !px-3 !py-2" onClick={() => setSelectedId(context.row.original.id)} type="button">
                            Details
                        </button>
                    )
                })
            ]),
        []
    );
    const runAction = async (action) => {
        const order = detail.data?.order || detail.data;
        if (!order?.id || !canWrite || mutation.pending) return;
        const verb = action === 'cancel' ? 'stornieren' : 'manuell ausliefern';
        if (!window.confirm('Bestellung #' + shortId(order.id) + ' wirklich ' + verb + '? Diese Aktion wird protokolliert.')) return;
        setMutation({ pending: true, message: '' });
        try {
            if (action === 'cancel') await storeApi.admin.cancelOrder(order.id);
            else await storeApi.admin.fulfillOrder(order.id);
            setMutation({ pending: false, message: action === 'cancel' ? 'Bestellung storniert.' : 'Bestellung ausgeliefert.' });
            await Promise.all([orders.reload(), detail.reload()]);
        } catch (error) {
            setMutation({ pending: false, message: error.message });
        }
    };

    return (
        <CommerceAdminPage
            actions={
                <label className="block min-w-52 text-[9px] font-extrabold uppercase tracking-wider text-zinc-600">
                    Status
                    <select
                        className="admin-forum-select-compact !mt-1"
                        onChange={(event) => {
                            setStatus(event.target.value);
                            setPage(0);
                        }}
                        value={status}
                    >
                        <option value="">Alle Bestellungen</option>
                        {['CREATED', 'PAID', 'FULFILLED', 'CANCELLED', 'REFUNDED', 'CHARGEBACK'].map((value) => (
                            <option key={value} value={value}>{humanize(value)}</option>
                        ))}
                    </select>
                </label>
            }
            description="Bestellungen und zugehörige Zahlungen prüfen sowie freigegebene manuelle Aktionen sicher ausführen."
            error={orders.error}
            eyebrow="ORDER OPERATIONS"
            icon={FaBagShopping}
            loading={orders.loading}
            onRetry={orders.reload}
            title="Bestellungen"
        >
            <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.3fr)_minmax(390px,.7fr)]">
                <CommercePanel description="Serverseitig gefilterte Bestellvorgänge." eyebrow="BESTELLLISTE" title="Vorgänge">
                    {orders.loading ? (
                        <div className="p-6"><CommerceLoading title="Bestellungen werden geladen" /></div>
                    ) : (
                        <>
                            <LiveDataTable
                                columns={columns}
                                emptyText="Passe den Statusfilter an oder warte auf den ersten Checkout."
                                emptyTitle="Keine Bestellungen gefunden"
                                getSearchValue={(row) => [row.id, row.fromUserId, row.toUserId, row.status].join(' ')}
                                rows={rows}
                                searchPlaceholder="Sichtbare Bestellungen filtern …"
                            />
                            <CommercePagination
                                onPage={setPage}
                                page={pageNumber(orders.data, page)}
                                size={pageSize(orders.data)}
                                total={pageTotal(orders.data)}
                            />
                        </>
                    )}
                </CommercePanel>
                <OrderDetail
                    canWrite={canWrite}
                    mutation={mutation}
                    onAction={runAction}
                    resource={detail}
                    selectedId={selectedId}
                />
            </div>
        </CommerceAdminPage>
    );
}

function OrderDetail({ resource, selectedId, canWrite, mutation, onAction }) {
    if (!selectedId) {
        return (
            <CommercePanel className="h-fit" eyebrow="DETAILS" title="Bestellung">
                <CommerceEmpty title="Keine Bestellung ausgewählt" text="Öffne einen Vorgang aus der Liste." />
            </CommercePanel>
        );
    }
    if (resource.error) {
        return (
            <CommercePanel className="h-fit" eyebrow="DETAILS" title="Bestellung">
                <div className="p-5 sm:p-6"><CommerceError message={resource.error} retry={resource.reload} /></div>
            </CommercePanel>
        );
    }
    if (resource.loading || !resource.data) {
        return (
            <CommercePanel className="h-fit" eyebrow="DETAILS" title="Bestellung">
                <div className="p-6"><CommerceLoading title="Bestelldetails werden geladen" /></div>
            </CommercePanel>
        );
    }
    const order = resource.data.order;
    const payments = resource.data.payments || [];
    const entitlements = resource.data.entitlements || [];
    const cancelAllowed = order.status === 'CREATED';
    const fulfillAllowed = order.status === 'PAID';
    return (
        <CommercePanel className="h-fit" eyebrow="DETAILS" title={'#' + shortId(order.id)}>
            <div className="space-y-5 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-white/[.06] bg-black/15 p-4">
                    <div>
                        <StatusPill value={order.status} />
                        <p className="mt-3 font-mono text-[9px] text-zinc-600">{order.id}</p>
                    </div>
                    <div className="text-right">
                        <b className="font-display text-2xl">{formatStorePrice(order.totalCents, order.currency)}</b>
                        <time className="mt-1 block text-[9px] text-zinc-600">{formatDate(order.createdAt)}</time>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <DetailMetric label="Käufer" value={shortId(order.fromUserId)} />
                    <DetailMetric label="Empfänger" value={shortId(order.toUserId)} />
                </div>
                <div className="rounded-2xl border border-white/[.06] bg-black/15 p-4">
                    <b className="text-xs">Positionen</b>
                    <div className="mt-3 space-y-3">
                        {(order.items || []).map((item, index) => (
                            <div className="flex items-start justify-between gap-4 text-xs" key={item.productId || index}>
                                <span className="text-zinc-400">{item.quantity}× {item.name || item.productId || 'Nicht verfügbar'}</span>
                                <b>{formatStorePrice(item.unitPriceCents * item.quantity, order.currency)}</b>
                            </div>
                        ))}
                    </div>
                </div>
                <RelatedList icon={FaCreditCard} items={payments} title="Zahlungen" />
                <RelatedList icon={FaBoxOpen} items={entitlements} title="Freischaltungen" />
                {canWrite && (cancelAllowed || fulfillAllowed) && (
                    <div className="grid gap-2 sm:grid-cols-2">
                        {cancelAllowed && (
                            <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/[.07] px-4 py-2.5 text-xs font-extrabold text-red-300 transition hover:bg-red-400/[.12] disabled:opacity-40" disabled={mutation.pending} onClick={() => onAction('cancel')} type="button">
                                <FaBan /> Bestellung stornieren
                            </button>
                        )}
                        {fulfillAllowed && (
                            <button className="forum-button-primary" disabled={mutation.pending} onClick={() => onAction('fulfill')} type="button">
                                <FaCircleCheck /> Manuell ausliefern
                            </button>
                        )}
                    </div>
                )}
                {mutation.message && <p className="rounded-xl border border-white/[.06] bg-black/15 p-3 text-[10px] text-zinc-400">{mutation.message}</p>}
            </div>
        </CommercePanel>
    );
}

function RelatedList({ icon: Icon, items, title }) {
    return (
        <div className="rounded-2xl border border-white/[.06] bg-black/15 p-4">
            <b className="flex items-center gap-2 text-xs"><Icon className="text-orange-300" /> {title}</b>
            {items.length ? (
                <div className="mt-3 space-y-2">
                    {items.map((item) => (
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[.045] px-3 py-2 text-[10px]" key={item.id}>
                            <span className="font-mono text-zinc-500">{shortId(item.id)}</span>
                            {item.status ? (
                                <StatusPill value={item.status} />
                            ) : (
                                <span className="font-bold text-zinc-500">{formatNumber(item.quantity)}× gewährt</span>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="mt-3 text-[10px] text-zinc-600">Keine Einträge vorhanden.</p>
            )}
        </div>
    );
}

function BillingAddress({ value }) {
    return (
        <div className="rounded-2xl border border-white/[.06] bg-black/15 p-4 text-xs leading-5 text-zinc-500">
            <b className="mb-2 block text-zinc-300">Rechnungsanschrift</b>
            <p>{value.fullName || value.company}</p>
            {value.company && value.company !== value.fullName && <p>{value.company}</p>}
            <p>{value.addressLine1}</p>
            {value.addressLine2 && <p>{value.addressLine2}</p>}
            <p>{[value.postalCode, value.city].filter(Boolean).join(' ')}</p>
            <p>{value.countryCode}</p>
        </div>
    );
}

function DetailMetric({ label, value }) {
    return (
        <div className="rounded-xl border border-white/[.05] bg-white/[.018] p-3">
            <span className="block text-[8px] font-extrabold uppercase tracking-wider text-zinc-600">{label}</span>
            <b className="mt-1 block truncate text-xs">{value ?? '—'}</b>
        </div>
    );
}

function normalizeCustomerDetail(payload) {
    if (!payload) return { customer: {}, orders: [], payments: [], entitlements: [] };
    return {
        customer: payload.customer || {},
        orders: payload.orders || [],
        payments: payload.payments || [],
        entitlements: payload.entitlements || []
    };
}

function pageItems(payload) {
    return payload?.items || [];
}
function pageNumber(payload, fallback = 0) {
    return Number.isFinite(Number(payload?.page)) ? Number(payload.page) : fallback;
}
function pageSize(payload) {
    return Number(payload?.size) || PAGE_SIZE;
}
function pageTotal(payload) {
    return Number(payload?.total) || 0;
}
function eventDate(item) {
    return item.createdAt || item.completedAt || item.grantedAt || item.updatedAt;
}
function formatCurrencyMap(values) {
    if (!values || typeof values !== 'object' || !Object.keys(values).length) return 'Kein Umsatz';
    return Object.entries(values)
        .map(([currency, cents]) => formatStorePrice(cents, currency))
        .join(' · ');
}
function formatCredits(cents) {
    if (!Number.isFinite(Number(cents))) return 'Nicht verfügbar';
    return `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(Number(cents) / 100)} Credits`;
}
function humanize(value) {
    return String(value || '').replace(/[._-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

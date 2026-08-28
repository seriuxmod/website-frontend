import { useEffect, useState } from 'react';
import { FaBagShopping, FaBox, FaCoins, FaCreditCard, FaRightToBracket } from 'react-icons/fa6';
import { Link, useLocation } from 'react-router-dom';
import { beginLogin, getAuthenticatedUser } from '../../lib/auth';
import { formatStorePrice, storeApi } from '../../lib/storeApi';

const statusLabels = {
    CREATED: 'Zahlung ausstehend',
    PAID: 'Bezahlt',
    FULFILLED: 'Freigeschaltet',
    CANCELLED: 'Storniert',
    REFUNDED: 'Erstattet',
    CHARGEBACK: 'Rückbelastet'
};

export default function StoreAccount() {
    const user = getAuthenticatedUser();
    const location = useLocation();
    const [state, setState] = useState({
        loading: true,
        orders: [],
        entitlements: [],
        payments: [],
        credits: null,
        error: ''
    });

    useEffect(() => {
        if (!user) {
            setState((current) => ({ ...current, loading: false }));
            return;
        }
        let active = true;
        Promise.all([storeApi.orders(), storeApi.entitlements(), storeApi.payments(), storeApi.credits()])
            .then(
                ([orders, entitlements, payments, credits]) =>
                    active &&
                    setState({
                        loading: false,
                        orders: orders.items ?? [],
                        entitlements: entitlements.entitlements ?? [],
                        payments: payments.payments ?? [],
                        credits,
                        error: ''
                    })
            )
            .catch((error) => active && setState((current) => ({ ...current, loading: false, error: error.message })));
        return () => {
            active = false;
        };
    }, [user?.playerId]);

    if (!user)
        return (
            <main className="grid min-h-screen place-items-center bg-[#090a0d] px-4 pt-44 text-white">
                <div className="forum-panel max-w-lg rounded-3xl p-8 text-center">
                    <FaBagShopping className="mx-auto text-4xl text-orange-400" />
                    <h1 className="mt-5 font-display text-3xl font-bold">Deine Käufe</h1>
                    <p className="mt-3 text-sm leading-6 text-zinc-500">
                        Melde dich mit deinem Minecraft-Account an, um Bestellungen und Freischaltungen zu sehen.
                    </p>
                    <button className="forum-button-primary mt-6" onClick={() => beginLogin('/store/account')}>
                        <FaRightToBracket /> Anmelden
                    </button>
                </div>
            </main>
        );

    return (
        <main className="min-h-screen bg-[#090a0d] px-4 pb-24 pt-48 text-white sm:px-6 sm:pt-52">
            <div className="mx-auto max-w-7xl">
                <div className="flex flex-wrap items-end justify-between gap-6">
                    <div>
                        <p className="eyebrow">MEIN STORE</p>
                        <h1 className="mt-3 font-display text-5xl font-bold">Käufe & Freischaltungen</h1>
                        <p className="mt-4 text-sm text-zinc-500">
                            Alle Bestellungen sind fest mit deiner Minecraft-UUID verknüpft.
                        </p>
                    </div>
                    <Link className="forum-button-secondary" to="/store">
                        Weiter einkaufen
                    </Link>
                </div>
                {location.state?.orderCreated && (
                    <p className="mt-7 rounded-2xl border border-emerald-400/15 bg-emerald-400/[.055] p-4 text-sm text-emerald-200">
                        Bestellung {location.state.orderCreated} wurde angelegt. Die Zahlung wartet auf Bestätigung.
                    </p>
                )}
                {state.error && (
                    <p className="mt-7 rounded-2xl border border-red-500/20 bg-red-500/[.06] p-4 text-sm text-red-200">
                        {state.error}
                    </p>
                )}
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <Summary icon={FaBagShopping} label="Bestellungen" value={state.orders.length} />
                    <Summary icon={FaBox} label="Freischaltungen" value={state.entitlements.length} />
                    <Summary
                        icon={FaCoins}
                        label="Credits"
                        value={state.credits ? formatStorePrice(state.credits.cents, 'EUR') : '0,00 €'}
                    />
                </div>
                <div className="mt-8 grid gap-7 lg:grid-cols-[1fr_360px]">
                    <section className="forum-panel overflow-hidden rounded-3xl">
                        <header className="border-b border-white/[.06] p-6">
                            <h2 className="font-display text-2xl font-bold">Bestellungen</h2>
                        </header>
                        {!state.loading && state.orders.length === 0 ? (
                            <Empty label="Noch keine Bestellungen vorhanden." />
                        ) : (
                            state.orders.map((order) => (
                                <article className="border-b border-white/[.055] p-6 last:border-0" key={order.id}>
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <b className="font-mono text-xs text-zinc-400">#{order.id}</b>
                                            <p className="mt-2 text-xs text-zinc-600">
                                                {new Date(order.createdAt).toLocaleString('de-DE')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="rounded-full bg-orange-500/10 px-3 py-1.5 text-[10px] font-bold text-orange-300">
                                                {statusLabels[order.status] || order.status}
                                            </span>
                                            <b className="mt-3 block font-display text-xl">
                                                {formatStorePrice(order.totalCents, order.currency)}
                                            </b>
                                        </div>
                                    </div>
                                    <div className="mt-5 space-y-2">
                                        {order.items.map((item) => (
                                            <div
                                                className="flex justify-between gap-4 text-sm text-zinc-400"
                                                key={item.productId}
                                            >
                                                <span>
                                                    {item.quantity}× {item.name}
                                                </span>
                                                <span>
                                                    {formatStorePrice(
                                                        item.unitPriceCents * item.quantity,
                                                        order.currency
                                                    )}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </article>
                            ))
                        )}
                    </section>
                    <div className="space-y-7">
                        <section className="forum-panel rounded-3xl p-6">
                            <div className="flex items-center gap-3">
                                <FaBox className="text-orange-400" />
                                <h2 className="font-display text-2xl font-bold">Freigeschaltet</h2>
                            </div>
                            {state.entitlements.length === 0 ? (
                                <p className="mt-5 text-sm text-zinc-500">Noch keine digitalen Produkte.</p>
                            ) : (
                                <div className="mt-5 space-y-3">
                                    {state.entitlements.map((item) => (
                                        <div className="rounded-2xl border border-white/[.06] p-4" key={item.id}>
                                            <b>{item.productId}</b>
                                            <span className="mt-1 block text-xs text-zinc-600">
                                                seit {new Date(item.grantedAt).toLocaleDateString('de-DE')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                        <section className="forum-panel rounded-3xl p-6">
                            <div className="flex items-center gap-3">
                                <FaCreditCard className="text-orange-400" />
                                <h2 className="font-display text-2xl font-bold">Zahlungen</h2>
                            </div>
                            <p className="mt-4 text-sm text-zinc-500">
                                {state.payments.length === 0
                                    ? 'Noch keine Zahlungen vorhanden.'
                                    : `${state.payments.length} Zahlungsvorgänge gespeichert.`}
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    );
}

function Summary({ icon: Icon, label, value }) {
    return (
        <article className="forum-panel rounded-3xl p-6">
            <Icon className="text-orange-400" />
            <b className="mt-5 block font-display text-3xl">{value}</b>
            <span className="mt-1 block text-xs text-zinc-500">{label}</span>
        </article>
    );
}
function Empty({ label }) {
    return <p className="p-8 text-sm text-zinc-500">{label}</p>;
}

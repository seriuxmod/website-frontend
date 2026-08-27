import { useEffect, useMemo, useState } from 'react';
import {
    FaArrowRight,
    FaBagShopping,
    FaBoxOpen,
    FaCartShopping,
    FaCheck,
    FaMinus,
    FaPlus,
    FaShieldHalved,
    FaTrash,
    FaXmark
} from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import useStoreCart from '../../hooks/useStoreCart';
import { isAuthenticated } from '../../lib/auth';
import { formatStorePrice, storeApi } from '../../lib/storeApi';

export default function StoreIndex() {
    const [state, setState] = useState({ loading: true, categories: [], products: [], config: null, error: '' });
    const [category, setCategory] = useState('');
    const [cartOpen, setCartOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const cart = useStoreCart();

    useEffect(() => {
        let active = true;
        Promise.all([storeApi.config(), storeApi.categories(), storeApi.products()])
            .then(([config, categories, products]) => {
                if (active)
                    setState({
                        loading: false,
                        config,
                        categories: categories.categories ?? [],
                        products: products.products ?? [],
                        error: ''
                    });
            })
            .catch((error) => active && setState((current) => ({ ...current, loading: false, error: error.message })));
        return () => {
            active = false;
        };
    }, []);

    const products = category ? state.products.filter((product) => product.categoryId === category) : state.products;
    const cartProducts = useMemo(
        () =>
            cart.items
                .map((item) => ({ ...item, product: state.products.find((product) => product.id === item.productId) }))
                .filter((item) => item.product),
        [cart.items, state.products]
    );
    const total = cartProducts.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0);

    return (
        <main className="min-h-screen bg-[#090a0d] pb-24 pt-32 text-white sm:pt-36">
            <section className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="store-hero relative overflow-hidden rounded-[34px] border border-white/[.08] px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
                    <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
                        <div className="max-w-3xl">
                            <p className="eyebrow">SERIUXMOD STORE</p>
                            <h1 className="mt-4 font-display text-5xl font-bold tracking-[-.055em] sm:text-7xl">
                                Dein Client. Dein Stil.
                            </h1>
                            <p className="mt-6 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
                                Cosmetics, Ränge und digitale Erweiterungen werden direkt deiner Minecraft-UUID
                                zugewiesen – dauerhaft nachvollziehbar über deine Seriux-ID.
                            </p>
                            <div className="mt-7 flex flex-wrap gap-3 text-xs text-zinc-500">
                                <span className="store-trust-item">
                                    <FaShieldHalved /> Sicherer Checkout
                                </span>
                                <span className="store-trust-item">
                                    <FaCheck /> Direkte Freischaltung
                                </span>
                                <span className="store-trust-item">
                                    <FaBoxOpen /> Rein digitale Produkte
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {isAuthenticated() && (
                                <Link className="forum-button-secondary" to="/store/account">
                                    <FaBagShopping /> Meine Käufe
                                </Link>
                            )}
                            <button className="forum-button-primary" onClick={() => setCartOpen(true)}>
                                <FaCartShopping /> Warenkorb ({cart.count})
                            </button>
                        </div>
                    </div>
                </div>

                {state.config && !state.config.checkoutEnabled && (
                    <div className="mt-6 rounded-2xl border border-amber-400/15 bg-amber-400/[.055] px-5 py-4 text-sm text-amber-100/75">
                        Der Katalog ist bereits live. Bezahlvorgänge werden freigeschaltet, sobald Zahlungsanbieter,
                        Steuerkonfiguration und Rechnungssteller vollständig hinterlegt sind.
                    </div>
                )}

                <div className="mt-10 flex flex-wrap items-center justify-between gap-5">
                    <div>
                        <p className="eyebrow">KATALOG</p>
                        <h2 className="mt-2 font-display text-3xl font-bold">Produkte entdecken</h2>
                    </div>
                    <div className="flex max-w-full gap-2 overflow-x-auto pb-2">
                        <button
                            className={`store-category ${category === '' ? 'store-category-active' : ''}`}
                            onClick={() => setCategory('')}
                        >
                            Alle
                        </button>
                        {state.categories.map((item) => (
                            <button
                                className={`store-category ${category === item.id ? 'store-category-active' : ''}`}
                                key={item.id}
                                onClick={() => setCategory(item.id)}
                            >
                                {item.name}
                            </button>
                        ))}
                    </div>
                </div>

                {state.loading ? (
                    <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {[0, 1, 2].map((item) => (
                            <div className="h-[410px] animate-pulse rounded-3xl bg-white/[.035]" key={item} />
                        ))}
                    </div>
                ) : state.error ? (
                    <div className="mt-8 rounded-3xl border border-red-500/20 bg-red-500/[.06] p-8 text-red-200">
                        {state.error}
                    </div>
                ) : products.length === 0 ? (
                    <div className="mt-8 grid min-h-80 place-items-center rounded-3xl border border-dashed border-white/10 bg-white/[.018] p-8 text-center">
                        <div>
                            <FaBoxOpen className="mx-auto text-4xl text-orange-400" />
                            <h3 className="mt-5 font-display text-2xl font-bold">Produkte werden vorbereitet</h3>
                            <p className="mt-3 max-w-md text-sm leading-6 text-zinc-500">
                                In dieser Kategorie sind noch keine veröffentlichten Produkte vorhanden.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {products.map((product) => (
                            <ProductCard
                                product={product}
                                key={product.id}
                                onSelect={() => setSelectedProduct(product)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {selectedProduct && (
                <ProductDialog
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    onAdd={(fields) => {
                        cart.add(selectedProduct, fields);
                        setSelectedProduct(null);
                        setCartOpen(true);
                    }}
                />
            )}
            {cartOpen && (
                <CartDrawer
                    items={cartProducts}
                    total={total}
                    currency={state.config?.currency || 'EUR'}
                    cart={cart}
                    onClose={() => setCartOpen(false)}
                />
            )}
        </main>
    );
}

function ProductCard({ product, onSelect }) {
    return (
        <article className="group overflow-hidden rounded-3xl border border-white/[.07] bg-[#111218] transition hover:-translate-y-1 hover:border-orange-500/25">
            <div className="relative grid h-52 place-items-center overflow-hidden bg-gradient-to-br from-orange-500/15 via-[#17191f] to-[#0b0c10]">
                {product.imageUrl ? (
                    <img
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        src={product.imageUrl}
                        alt=""
                    />
                ) : (
                    <FaBoxOpen className="text-6xl text-orange-400/60" />
                )}
                <span className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-xs font-bold backdrop-blur-lg">
                    Digital
                </span>
            </div>
            <div className="p-6">
                <h3 className="font-display text-2xl font-bold">{product.name}</h3>
                <p className="mt-3 line-clamp-3 min-h-[66px] text-sm leading-6 text-zinc-500">
                    {product.description || 'Eine digitale Erweiterung für deinen SeriuxMod-Account.'}
                </p>
                <div className="mt-6 flex items-center justify-between gap-4">
                    <b className="font-display text-2xl text-white">
                        {formatStorePrice(product.priceCents, product.currency)}
                    </b>
                    <button className="forum-button-primary" onClick={onSelect}>
                        Auswählen <FaArrowRight />
                    </button>
                </div>
            </div>
        </article>
    );
}

function ProductDialog({ product, onClose, onAdd }) {
    const [values, setValues] = useState(() =>
        Object.fromEntries((product.fields ?? []).map((field) => [field.identifier, field.defaultValue || '']))
    );
    const submit = (event) => {
        event.preventDefault();
        onAdd(Object.entries(values).map(([identifier, value]) => ({ identifier, value })));
    };
    return (
        <div
            className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md"
            role="dialog"
        >
            <form className="forum-panel my-8 w-full max-w-xl rounded-[30px] p-7 sm:p-9" onSubmit={submit}>
                <div className="flex items-start justify-between gap-5">
                    <div>
                        <p className="eyebrow">PRODUKT</p>
                        <h2 className="mt-2 font-display text-3xl font-bold">{product.name}</h2>
                    </div>
                    <button type="button" className="forum-icon-button" onClick={onClose}>
                        <FaXmark />
                    </button>
                </div>
                <p className="mt-5 text-sm leading-7 text-zinc-400">{product.description}</p>
                {(product.fields ?? []).map((field) => (
                    <label className="forum-label mt-5" key={field.id}>
                        {field.description || field.identifier}
                        {field.typeId === 3 ? (
                            <select
                                className="forum-input"
                                required={field.required}
                                value={values[field.identifier]}
                                onChange={(event) =>
                                    setValues((current) => ({ ...current, [field.identifier]: event.target.value }))
                                }
                            >
                                <option value="">Bitte auswählen</option>
                                {(field.options ?? []).map((option) => (
                                    <option value={option} key={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                className="forum-input"
                                type={field.typeId === 4 ? 'number' : 'text'}
                                required={field.required}
                                min={field.min || undefined}
                                max={field.max || undefined}
                                value={values[field.identifier]}
                                onChange={(event) =>
                                    setValues((current) => ({ ...current, [field.identifier]: event.target.value }))
                                }
                            />
                        )}
                    </label>
                ))}
                <div className="mt-7 flex items-center justify-between gap-4 border-t border-white/[.06] pt-6">
                    <b className="font-display text-2xl">{formatStorePrice(product.priceCents, product.currency)}</b>
                    <button className="forum-button-primary">
                        <FaCartShopping /> In den Warenkorb
                    </button>
                </div>
            </form>
        </div>
    );
}

function CartDrawer({ items, total, currency, cart, onClose }) {
    return (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <aside
                className="ml-auto flex h-full w-full max-w-lg flex-col border-l border-white/[.08] bg-[#0d0e12] p-6 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <header className="flex items-center justify-between">
                    <div>
                        <p className="eyebrow">WARENKORB</p>
                        <h2 className="mt-2 font-display text-3xl font-bold">Deine Auswahl</h2>
                    </div>
                    <button className="forum-icon-button" onClick={onClose}>
                        <FaXmark />
                    </button>
                </header>
                <div className="mt-7 flex-1 space-y-3 overflow-y-auto">
                    {items.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-zinc-500">
                            Dein Warenkorb ist leer.
                        </p>
                    ) : (
                        items.map((item) => (
                            <article
                                className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4"
                                key={item.productId}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <b>{item.product.name}</b>
                                        <span className="mt-1 block text-xs text-zinc-500">
                                            {formatStorePrice(item.product.priceCents, item.product.currency)}
                                        </span>
                                    </div>
                                    <button
                                        className="forum-icon-button text-red-300"
                                        onClick={() => cart.remove(item.productId)}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                    <button
                                        className="forum-icon-button"
                                        onClick={() => cart.setQuantity(item.productId, item.quantity - 1)}
                                    >
                                        <FaMinus />
                                    </button>
                                    <b className="min-w-8 text-center">{item.quantity}</b>
                                    <button
                                        className="forum-icon-button"
                                        onClick={() => cart.setQuantity(item.productId, item.quantity + 1)}
                                    >
                                        <FaPlus />
                                    </button>
                                </div>
                            </article>
                        ))
                    )}
                </div>
                <footer className="border-t border-white/[.07] pt-6">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-500">Gesamtsumme</span>
                        <b className="font-display text-3xl">{formatStorePrice(total, currency)}</b>
                    </div>
                    {items.length > 0 && (
                        <Link className="forum-button-primary mt-5 w-full" to="/store/checkout">
                            Weiter zur Kasse <FaArrowRight />
                        </Link>
                    )}
                </footer>
            </aside>
        </div>
    );
}

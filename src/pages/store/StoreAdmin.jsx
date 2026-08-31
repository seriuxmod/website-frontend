import { useCallback, useEffect, useState } from 'react';
import {
    FaArrowLeft,
    FaBagShopping,
    FaBoxesStacked,
    FaCreditCard,
    FaBuilding,
    FaFloppyDisk,
    FaGear,
    FaList,
    FaPlus,
    FaTicket,
    FaTrash,
    FaUsers
} from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import { fetchAuthenticatedUser, getAuthenticatedUser, isStoreAdministrator } from '../../lib/auth';
import { formatStorePrice, storeApi } from '../../lib/storeApi';
import { ForumError, ForumLoading, ForumShell, Pagination, formatDate } from '../forum/ForumComponents';

const emptyCategory = {
    name: '',
    description: '',
    imageUrl: '',
    parentCategoryId: '',
    onlySubcategories: false,
    hidden: false,
    disabled: false,
    order: 0
};
const emptyField = {
    identifier: '',
    description: '',
    typeId: 1,
    required: false,
    min: 0,
    max: 0,
    optionsText: '',
    regex: '',
    defaultValue: '',
    order: 0
};
const emptyProduct = {
    categoryId: '',
    name: '',
    price: '0.00',
    currency: 'EUR',
    description: '',
    imageUrl: '',
    hidden: false,
    disabled: false,
    order: 0,
    fieldIds: [],
    requiredProductIds: [],
    requiredGroupIdsText: ''
};
const emptyCoupon = {
    code: '',
    type: 'PERCENT',
    value: 10,
    minimumOrder: '0.00',
    productIds: [],
    enabled: true,
    startsAt: '',
    expiresAt: '',
    maxRedemptions: 0
};

export default function StoreAdmin() {
    const [user, setUser] = useState(() => getAuthenticatedUser());
    const [checking, setChecking] = useState(true);
    const [tab, setTab] = useState('settings');
    const [state, setState] = useState({
        loading: true,
        overview: null,
        categories: [],
        products: [],
        fields: [],
        coupons: [],
        settings: null,
        error: ''
    });

    const load = useCallback(async () => {
        setState((current) => ({ ...current, loading: true, error: '' }));
        try {
            const [overview, categories, products, fields, coupons, settings] = await Promise.all([
                storeApi.admin.overview(),
                storeApi.admin.categories(),
                storeApi.admin.products(),
                storeApi.admin.fields(),
                storeApi.admin.coupons(),
                storeApi.admin.settings()
            ]);
            setState({ loading: false, overview, categories, products, fields, coupons, settings, error: '' });
        } catch (error) {
            setState((current) => ({ ...current, loading: false, error: error.message }));
        }
    }, []);

    useEffect(() => {
        fetchAuthenticatedUser().then((profile) => {
            setUser(profile);
            setChecking(false);
        });
    }, []);
    useEffect(() => {
        if (!checking && isStoreAdministrator(user)) load();
    }, [checking, load, user]);

    if (checking)
        return (
            <ForumShell title="Shop-Administration">
                <ForumLoading label="Berechtigungen werden geprüft …" />
            </ForumShell>
        );
    if (!isStoreAdministrator(user))
        return (
            <ForumShell title="Kein Zugriff" description="Für diesen Bereich benötigst du store.admin.">
                <Link className="forum-button-secondary" to="/store">
                    <FaArrowLeft /> Zurück zum Shop
                </Link>
            </ForumShell>
        );

    const tabs = [
        ['settings', FaGear, 'Shop-Einstellungen'],
        ['catalog', FaBoxesStacked, 'Katalog'],
        ['fields', FaList, 'Produktfelder'],
        ['coupons', FaTicket, 'Coupons'],
        ['orders', FaBagShopping, 'Bestellungen'],
        ['customers', FaUsers, 'Kunden']
    ];

    return (
        <ForumShell
            eyebrow="STORE ADMINISTRATION"
            title="Shop verwalten"
            description="Pflege Kategorien, Produkte und Coupons und kontrolliere Bestellungen, Zahlungen und Freischaltungen."
            rootBreadcrumb={{ label: 'Administration', to: '/admin' }}
            breadcrumbs={[{ label: 'Shop' }]}
            actions={
                <div className="flex flex-wrap gap-2">
                    <Link className="forum-button-secondary" to="/admin">
                        <FaArrowLeft /> Admin-Zentrale
                    </Link>
                    <Link className="forum-button-secondary" to="/store">
                        Shop öffnen
                    </Link>
                </div>
            }
        >
            {state.overview && <Overview data={state.overview} />}
            <div className="mb-7 flex flex-wrap gap-2 rounded-2xl border border-white/[.06] bg-white/[.025] p-2">
                {tabs.map(([key, Icon, label]) => (
                    <button
                        key={key}
                        className={`forum-admin-tab ${tab === key ? 'forum-admin-tab-active' : ''}`}
                        onClick={() => setTab(key)}
                    >
                        <Icon /> {label}
                    </button>
                ))}
            </div>
            {state.loading && <ForumLoading label="Shop-Konfiguration wird geladen …" />}
            {state.error && <ForumError message={state.error} retry={load} />}
            {!state.loading && !state.error && tab === 'catalog' && (
                <CatalogEditor
                    categories={state.categories}
                    products={state.products}
                    fields={state.fields}
                    onChanged={load}
                />
            )}
            {!state.loading && !state.error && tab === 'settings' && (
                <StoreSettingsEditor settings={state.settings} onChanged={load} />
            )}
            {!state.loading && !state.error && tab === 'fields' && (
                <FieldEditor fields={state.fields} onChanged={load} />
            )}
            {!state.loading && !state.error && tab === 'coupons' && (
                <CouponEditor coupons={state.coupons} products={state.products} onChanged={load} />
            )}
            {!state.loading && !state.error && tab === 'orders' && <OrderOperations />}
            {!state.loading && !state.error && tab === 'customers' && <CustomerOperations />}
        </ForumShell>
    );
}

function Overview({ data }) {
    const entries = [
        ['Produkte', data.products],
        ['Kategorien', data.categories],
        ['Bestellungen', data.orders],
        ['Kunden', data.customers]
    ];
    return (
        <div className="mb-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {entries.map(([label, value]) => (
                <article className="forum-panel rounded-2xl p-5" key={label}>
                    <b className="font-display text-3xl">{value}</b>
                    <span className="mt-1 block text-xs text-zinc-600">{label}</span>
                </article>
            ))}
        </div>
    );
}

function StoreSettingsEditor({ settings, onChanged }) {
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!settings) return;
        setForm({
            checkoutEnabled: Boolean(settings.checkoutEnabled),
            currency: settings.currency || 'EUR',
            merchant: {
                legalName: '',
                tradingName: '',
                addressLine1: '',
                addressLine2: '',
                postalCode: '',
                city: '',
                region: '',
                countryCode: 'DE',
                email: '',
                phone: '',
                website: '',
                vatId: '',
                taxNumber: '',
                registrationCourt: '',
                registrationNumber: '',
                managingDirector: '',
                ...(settings.merchant || {})
            },
            invoicePrefix: settings.invoicePrefix || 'SM',
            pricesIncludeVat: settings.pricesIncludeVat !== false,
            vatRate: (settings.defaultVatRateBasisPoints || 0) / 100,
            paymentMethods: (settings.paymentMethods || []).map((method) => ({ ...method }))
        });
        setMessage('');
    }, [settings]);

    if (!form) return <ForumLoading label="Shop-Einstellungen werden geladen …" />;

    const merchant = (field, value) =>
        setForm((current) => ({ ...current, merchant: { ...current.merchant, [field]: value } }));
    const method = (id, changes) =>
        setForm((current) => ({
            ...current,
            paymentMethods: current.paymentMethods.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry))
        }));
    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            await storeApi.admin.saveSettings({
                checkoutEnabled: form.checkoutEnabled,
                currency: form.currency,
                merchant: form.merchant,
                invoicePrefix: form.invoicePrefix,
                pricesIncludeVat: form.pricesIncludeVat,
                defaultVatRateBasisPoints: Math.round(Number(form.vatRate || 0) * 100),
                paymentMethods: form.paymentMethods.map(({ id, enabled, order }) => ({ id, enabled, order }))
            });
            setMessage('Shop-Einstellungen gespeichert.');
            await onChanged();
        } catch (error) {
            setMessage(error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="space-y-8" onSubmit={save}>
            <section className="forum-panel rounded-3xl p-6 sm:p-8">
                <EditorHeader eyebrow="ZAHLUNGSVERKEHR" title="Zahlungsmethoden" />
                <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500">
                    Apple Pay, Google Pay und Kartenzahlungen laufen über Stripe. PayPal verwendet einen eigenen
                    Provider. API-Schlüssel werden ausschließlich als Server-Secrets hinterlegt und hier nie angezeigt.
                </p>
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                    {form.paymentMethods.map((entry) => (
                        <article
                            className="rounded-2xl border border-white/[.07] bg-black/15 p-5"
                            key={entry.id}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300">
                                        <FaCreditCard />
                                    </span>
                                    <div>
                                        <b className="block text-sm text-white">{entry.displayName}</b>
                                        <span className="text-[11px] uppercase tracking-wider text-zinc-600">
                                            Provider: {entry.provider}
                                        </span>
                                    </div>
                                </div>
                                <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                        entry.providerConfigured
                                            ? 'bg-emerald-400/10 text-emerald-300'
                                            : 'bg-amber-400/10 text-amber-200'
                                    }`}
                                >
                                    {entry.providerConfigured ? 'Server bereit' : 'Secrets fehlen'}
                                </span>
                            </div>
                            <div className="mt-5 grid grid-cols-[1fr_100px] items-end gap-3">
                                <Toggle
                                    label="Im Checkout anzeigen"
                                    checked={entry.enabled}
                                    onChange={(enabled) => method(entry.id, { enabled })}
                                />
                                <Field
                                    label="Reihenfolge"
                                    type="number"
                                    min="0"
                                    max="1000"
                                    value={entry.order}
                                    onChange={(order) => method(entry.id, { order: Number(order) })}
                                />
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="forum-panel rounded-3xl p-6 sm:p-8">
                <EditorHeader eyebrow="RECHNUNGSSTELLER" title="Firmendaten">
                    <FaBuilding className="text-orange-300" />
                </EditorHeader>
                <p className="mt-3 text-sm leading-6 text-zinc-500">
                    Diese Angaben werden als unveränderlicher Rechnungssteller in zukünftige Rechnungen übernommen.
                </p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <Field label="Rechtlicher Firmenname" value={form.merchant.legalName} onChange={(v) => merchant('legalName', v)} required />
                    <Field label="Marken-/Handelsname" value={form.merchant.tradingName} onChange={(v) => merchant('tradingName', v)} />
                    <Field label="Geschäftsführer/Inhaber" value={form.merchant.managingDirector} onChange={(v) => merchant('managingDirector', v)} />
                    <Field label="Kontakt-E-Mail" type="email" value={form.merchant.email} onChange={(v) => merchant('email', v)} required />
                    <Field label="Straße und Hausnummer" value={form.merchant.addressLine1} onChange={(v) => merchant('addressLine1', v)} required />
                    <Field label="Adresszusatz" value={form.merchant.addressLine2} onChange={(v) => merchant('addressLine2', v)} />
                    <Field label="Postleitzahl" value={form.merchant.postalCode} onChange={(v) => merchant('postalCode', v)} required />
                    <Field label="Ort" value={form.merchant.city} onChange={(v) => merchant('city', v)} required />
                    <Field label="Bundesland/Region" value={form.merchant.region} onChange={(v) => merchant('region', v)} />
                    <Field label="Ländercode" value={form.merchant.countryCode} onChange={(v) => merchant('countryCode', v)} required maxLength={2} />
                    <Field label="Telefon" value={form.merchant.phone} onChange={(v) => merchant('phone', v)} />
                    <Field label="Website" type="url" value={form.merchant.website} onChange={(v) => merchant('website', v)} />
                    <Field label="USt-IdNr." value={form.merchant.vatId} onChange={(v) => merchant('vatId', v)} />
                    <Field label="Steuernummer" value={form.merchant.taxNumber} onChange={(v) => merchant('taxNumber', v)} />
                    <Field label="Registergericht" value={form.merchant.registrationCourt} onChange={(v) => merchant('registrationCourt', v)} />
                    <Field label="Registernummer" value={form.merchant.registrationNumber} onChange={(v) => merchant('registrationNumber', v)} />
                </div>
            </section>

            <section className="forum-panel rounded-3xl p-6 sm:p-8">
                <EditorHeader eyebrow="CHECKOUT" title="Rechnung und Freigabe" />
                <div className="mt-6 grid gap-5 sm:grid-cols-3">
                    <Field label="Währung" value={form.currency} onChange={(currency) => setForm({ ...form, currency })} required maxLength={3} />
                    <Field label="Rechnungspräfix" value={form.invoicePrefix} onChange={(invoicePrefix) => setForm({ ...form, invoicePrefix })} required />
                    <Field label="Standard-USt. in %" type="number" min="0" max="100" step="0.01" value={form.vatRate} onChange={(vatRate) => setForm({ ...form, vatRate })} />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Toggle label="Preise enthalten Umsatzsteuer" checked={form.pricesIncludeVat} onChange={(pricesIncludeVat) => setForm({ ...form, pricesIncludeVat })} />
                    <Toggle label="Produktiven Checkout aktivieren" checked={form.checkoutEnabled} onChange={(checkoutEnabled) => setForm({ ...form, checkoutEnabled })} />
                </div>
                {settings?.missingRequirements?.length > 0 && (
                    <div className="mt-5 rounded-2xl border border-amber-400/15 bg-amber-400/[.05] p-4 text-xs leading-6 text-amber-100/75">
                        Noch nicht vollständig: {settings.missingRequirements.join(', ')}
                    </div>
                )}
                <SaveBar saving={saving} message={message} />
            </section>
        </form>
    );
}

function CatalogEditor({ categories, products, fields, onChanged }) {
    return (
        <div className="space-y-8">
            <CategoryEditor categories={categories} onChanged={onChanged} />
            <ProductEditor categories={categories} products={products} fields={fields} onChanged={onChanged} />
        </div>
    );
}

function CategoryEditor({ categories, onChanged }) {
    const [selectedId, setSelectedId] = useState('new');
    const selected = categories.find((item) => item.id === selectedId);
    const [form, setForm] = useState(emptyCategory);
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setForm(
            selected
                ? { ...emptyCategory, ...selected, parentCategoryId: selected.parentCategoryId || '' }
                : emptyCategory
        );
        setMessage('');
    }, [selected]);

    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            await storeApi.admin.saveCategory(selected?.id, form);
            setSelectedId('new');
            setMessage('Kategorie gespeichert.');
            await onChanged();
        } catch (error) {
            setMessage(error.message);
        } finally {
            setSaving(false);
        }
    };
    const remove = async () => {
        if (!selected || !window.confirm(`Kategorie „${selected.name}“ wirklich deaktivieren?`)) return;
        try {
            await storeApi.admin.deleteCategory(selected.id);
            setSelectedId('new');
            await onChanged();
        } catch (error) {
            setMessage(error.message);
        }
    };

    return (
        <form className="forum-panel rounded-3xl p-6 sm:p-8" onSubmit={save}>
            <EditorHeader eyebrow="STRUKTUR" title="Kategorien" onDelete={selected && remove}>
                <select
                    className="forum-input max-w-sm"
                    value={selectedId}
                    onChange={(event) => setSelectedId(event.target.value)}
                >
                    <option value="new">Neue Kategorie anlegen</option>
                    {categories.map((category) => (
                        <option value={category.id} key={category.id}>
                            {category.name}
                            {category.deleted ? ' (gelöscht)' : ''}
                        </option>
                    ))}
                </select>
            </EditorHeader>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} required />
                <label className="forum-label">
                    Übergeordnete Kategorie
                    <select
                        className="forum-input"
                        value={form.parentCategoryId}
                        onChange={(event) => setForm({ ...form, parentCategoryId: event.target.value })}
                    >
                        <option value="">Keine</option>
                        {categories
                            .filter((item) => item.id !== selected?.id && !item.deleted)
                            .map((item) => (
                                <option value={item.id} key={item.id}>
                                    {item.name}
                                </option>
                            ))}
                    </select>
                </label>
                <div className="sm:col-span-2">
                    <Area
                        label="Beschreibung"
                        value={form.description}
                        onChange={(description) => setForm({ ...form, description })}
                    />
                </div>
                <Field label="Bild-URL" value={form.imageUrl} onChange={(imageUrl) => setForm({ ...form, imageUrl })} />
                <Field
                    label="Sortierung"
                    type="number"
                    value={form.order}
                    onChange={(order) => setForm({ ...form, order: Number(order) })}
                />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Toggle
                    label="Nur Unterkategorien"
                    checked={form.onlySubcategories}
                    onChange={(onlySubcategories) => setForm({ ...form, onlySubcategories })}
                />
                <Toggle
                    label="Im Shop verstecken"
                    checked={form.hidden}
                    onChange={(hidden) => setForm({ ...form, hidden })}
                />
                <Toggle
                    label="Deaktivieren"
                    checked={form.disabled}
                    onChange={(disabled) => setForm({ ...form, disabled })}
                />
            </div>
            <SaveBar saving={saving} message={message} />
        </form>
    );
}

function ProductEditor({ categories, products, fields, onChanged }) {
    const [selectedId, setSelectedId] = useState('new');
    const selected = products.find((item) => item.id === selectedId);
    const [form, setForm] = useState(emptyProduct);
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setForm(
            selected
                ? {
                      ...emptyProduct,
                      ...selected,
                      price: ((selected.priceCents || 0) / 100).toFixed(2),
                      fieldIds: selected.fieldIds ?? [],
                      requiredProductIds: selected.requiredProductIds ?? [],
                      requiredGroupIdsText: (selected.requiredGroupIds ?? []).join('\n')
                  }
                : { ...emptyProduct, categoryId: categories.find((item) => !item.deleted)?.id || '' }
        );
        setMessage('');
    }, [categories, selected]);

    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            await storeApi.admin.saveProduct(selected?.id, {
                categoryId: form.categoryId,
                name: form.name,
                priceCents: Math.round(Number(form.price) * 100),
                currency: form.currency,
                description: form.description,
                imageUrl: form.imageUrl,
                globalLimit: { limit: 0, interval: 1, period: 'no_period' },
                userLimit: { limit: 0, interval: 1, period: 'no_period' },
                requiredProductIds: form.requiredProductIds,
                requiredGroupIds: lines(form.requiredGroupIdsText),
                paymentType: 1,
                hidden: form.hidden,
                disabled: form.disabled,
                order: Number(form.order),
                fieldIds: form.fieldIds
            });
            setSelectedId('new');
            setMessage('Produkt gespeichert.');
            await onChanged();
        } catch (error) {
            setMessage(error.message);
        } finally {
            setSaving(false);
        }
    };
    const remove = async () => {
        if (!selected || !window.confirm(`Produkt „${selected.name}“ wirklich deaktivieren?`)) return;
        try {
            await storeApi.admin.deleteProduct(selected.id);
            setSelectedId('new');
            await onChanged();
        } catch (error) {
            setMessage(error.message);
        }
    };

    return (
        <form className="forum-panel rounded-3xl p-6 sm:p-8" onSubmit={save}>
            <EditorHeader eyebrow="ANGEBOT" title="Produkte" onDelete={selected && remove}>
                <select
                    className="forum-input max-w-sm"
                    value={selectedId}
                    onChange={(event) => setSelectedId(event.target.value)}
                >
                    <option value="new">Neues Produkt anlegen</option>
                    {products.map((product) => (
                        <option value={product.id} key={product.id}>
                            {product.name}
                            {product.deleted ? ' (gelöscht)' : ''}
                        </option>
                    ))}
                </select>
            </EditorHeader>
            {categories.filter((item) => !item.deleted).length === 0 && (
                <p className="mt-6 rounded-2xl border border-amber-400/15 bg-amber-400/[.05] p-4 text-sm text-amber-100/70">
                    Lege zuerst mindestens eine Kategorie an.
                </p>
            )}
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label="Produktname" value={form.name} onChange={(name) => setForm({ ...form, name })} required />
                <label className="forum-label">
                    Kategorie
                    <select
                        className="forum-input"
                        required
                        value={form.categoryId}
                        onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
                    >
                        <option value="">Bitte wählen</option>
                        {categories
                            .filter((item) => !item.deleted && !item.disabled)
                            .map((item) => (
                                <option value={item.id} key={item.id}>
                                    {item.name}
                                </option>
                            ))}
                    </select>
                </label>
                <Field
                    label="Bruttopreis in EUR"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(price) => setForm({ ...form, price })}
                    required
                />
                <Field
                    label="Sortierung"
                    type="number"
                    value={form.order}
                    onChange={(order) => setForm({ ...form, order: Number(order) })}
                />
                <div className="sm:col-span-2">
                    <Field
                        label="Bild-URL"
                        value={form.imageUrl}
                        onChange={(imageUrl) => setForm({ ...form, imageUrl })}
                    />
                </div>
                <div className="sm:col-span-2">
                    <Area
                        label="Beschreibung"
                        value={form.description}
                        onChange={(description) => setForm({ ...form, description })}
                    />
                </div>
                <div className="sm:col-span-2">
                    <Area
                        label="Benötigte PermissionGroup-Keys (optional, einer pro Zeile)"
                        value={form.requiredGroupIdsText}
                        onChange={(requiredGroupIdsText) => setForm({ ...form, requiredGroupIdsText })}
                    />
                </div>
            </div>
            <Selection
                title="Zusätzliche Eingabefelder"
                items={fields
                    .filter((item) => !item.deleted)
                    .map((item) => [item.id, item.description || item.identifier])}
                selected={form.fieldIds}
                onChange={(fieldIds) => setForm({ ...form, fieldIds })}
            />
            <Selection
                title="Vorausgesetzte Produkte"
                items={products
                    .filter((item) => !item.deleted && item.id !== selected?.id)
                    .map((item) => [item.id, item.name])}
                selected={form.requiredProductIds}
                onChange={(requiredProductIds) => setForm({ ...form, requiredProductIds })}
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Toggle
                    label="Im Katalog verstecken"
                    checked={form.hidden}
                    onChange={(hidden) => setForm({ ...form, hidden })}
                />
                <Toggle
                    label="Verkauf deaktivieren"
                    checked={form.disabled}
                    onChange={(disabled) => setForm({ ...form, disabled })}
                />
            </div>
            <SaveBar saving={saving || !form.categoryId} message={message} />
        </form>
    );
}

function FieldEditor({ fields, onChanged }) {
    const [selectedId, setSelectedId] = useState('new');
    const selected = fields.find((item) => item.id === selectedId);
    const [form, setForm] = useState(emptyField);
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        setForm(
            selected ? { ...emptyField, ...selected, optionsText: (selected.options ?? []).join('\n') } : emptyField
        );
        setMessage('');
    }, [selected]);
    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
            await storeApi.admin.saveField(selected?.id, {
                ...form,
                typeId: Number(form.typeId),
                min: Number(form.min),
                max: Number(form.max),
                order: Number(form.order),
                options: lines(form.optionsText)
            });
            setSelectedId('new');
            setMessage('Produktfeld gespeichert.');
            await onChanged();
        } catch (error) {
            setMessage(error.message);
        } finally {
            setSaving(false);
        }
    };
    const remove = async () => {
        if (!selected || !window.confirm('Produktfeld wirklich deaktivieren?')) return;
        try {
            await storeApi.admin.deleteField(selected.id);
            setSelectedId('new');
            await onChanged();
        } catch (error) {
            setMessage(error.message);
        }
    };
    return (
        <form className="forum-panel rounded-3xl p-6 sm:p-8" onSubmit={save}>
            <EditorHeader eyebrow="DYNAMISCHE DATEN" title="Produktfelder" onDelete={selected && remove}>
                <select
                    className="forum-input max-w-sm"
                    value={selectedId}
                    onChange={(event) => setSelectedId(event.target.value)}
                >
                    <option value="new">Neues Feld anlegen</option>
                    {fields.map((field) => (
                        <option value={field.id} key={field.id}>
                            {field.identifier}
                            {field.deleted ? ' (gelöscht)' : ''}
                        </option>
                    ))}
                </select>
            </EditorHeader>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field
                    label="Identifier"
                    value={form.identifier}
                    onChange={(identifier) => setForm({ ...form, identifier })}
                    required
                />
                <label className="forum-label">
                    Feldtyp
                    <select
                        className="forum-input"
                        value={form.typeId}
                        onChange={(event) => setForm({ ...form, typeId: Number(event.target.value) })}
                    >
                        <option value="1">Text</option>
                        <option value="2">Mehrzeiliger Text</option>
                        <option value="3">Auswahl</option>
                        <option value="4">Zahl</option>
                    </select>
                </label>
                <div className="sm:col-span-2">
                    <Field
                        label="Bezeichnung/Hilfe"
                        value={form.description}
                        onChange={(description) => setForm({ ...form, description })}
                    />
                </div>
                <Field
                    label="Minimum"
                    type="number"
                    min="0"
                    value={form.min}
                    onChange={(min) => setForm({ ...form, min: Number(min) })}
                />
                <Field
                    label="Maximum (0 = offen)"
                    type="number"
                    min="0"
                    value={form.max}
                    onChange={(max) => setForm({ ...form, max: Number(max) })}
                />
                <Field
                    label="Standardwert"
                    value={form.defaultValue}
                    onChange={(defaultValue) => setForm({ ...form, defaultValue })}
                />
                <Field
                    label="Sortierung"
                    type="number"
                    value={form.order}
                    onChange={(order) => setForm({ ...form, order: Number(order) })}
                />
                <div className="sm:col-span-2">
                    <Field
                        label="Validierungs-Regex (optional)"
                        value={form.regex}
                        onChange={(regex) => setForm({ ...form, regex })}
                    />
                </div>
                {form.typeId === 3 && (
                    <div className="sm:col-span-2">
                        <Area
                            label="Optionen (eine pro Zeile)"
                            value={form.optionsText}
                            onChange={(optionsText) => setForm({ ...form, optionsText })}
                            required
                        />
                    </div>
                )}
            </div>
            <div className="mt-5">
                <Toggle
                    label="Pflichtfeld"
                    checked={form.required}
                    onChange={(required) => setForm({ ...form, required })}
                />
            </div>
            <SaveBar saving={saving} message={message} />
        </form>
    );
}

function CouponEditor({ coupons, products, onChanged }) {
    const [selectedId, setSelectedId] = useState('new');
    const selected = coupons.find((item) => item.id === selectedId);
    const [form, setForm] = useState(emptyCoupon);
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        setForm(
            selected
                ? {
                      ...emptyCoupon,
                      ...selected,
                      minimumOrder: ((selected.minimumOrderCents || 0) / 100).toFixed(2),
                      productIds: selected.productIds ?? [],
                      startsAt: toLocalDateTime(selected.startsAt),
                      expiresAt: toLocalDateTime(selected.expiresAt)
                  }
                : emptyCoupon
        );
        setMessage('');
    }, [selected]);
    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            await storeApi.admin.saveCoupon(selected?.id, {
                code: form.code,
                type: form.type,
                value: Number(form.value),
                minimumOrderCents: Math.round(Number(form.minimumOrder) * 100),
                productIds: form.productIds,
                enabled: form.enabled,
                startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
                expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
                maxRedemptions: Number(form.maxRedemptions)
            });
            setSelectedId('new');
            setMessage('Coupon gespeichert.');
            await onChanged();
        } catch (error) {
            setMessage(error.message);
        } finally {
            setSaving(false);
        }
    };
    const remove = async () => {
        if (!selected || !window.confirm('Coupon wirklich deaktivieren?')) return;
        try {
            await storeApi.admin.deleteCoupon(selected.id);
            setSelectedId('new');
            await onChanged();
        } catch (error) {
            setMessage(error.message);
        }
    };
    return (
        <form className="forum-panel rounded-3xl p-6 sm:p-8" onSubmit={save}>
            <EditorHeader eyebrow="RABATTE" title="Coupons" onDelete={selected && remove}>
                <select
                    className="forum-input max-w-sm"
                    value={selectedId}
                    onChange={(event) => setSelectedId(event.target.value)}
                >
                    <option value="new">Neuen Coupon anlegen</option>
                    {coupons.map((coupon) => (
                        <option value={coupon.id} key={coupon.id}>
                            {coupon.code}
                            {!coupon.enabled ? ' (inaktiv)' : ''}
                        </option>
                    ))}
                </select>
            </EditorHeader>
            <p className="mt-5 rounded-2xl border border-blue-400/15 bg-blue-400/[.04] p-4 text-xs leading-5 text-blue-100/60">
                Coupons können hier vollständig vorbereitet werden. Die Einlösung wird erst gemeinsam mit dem
                Zahlungsanbieter aktiviert, damit Limits nicht durch unbezahlte Bestellungen verbraucht werden.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field
                    label="Code"
                    value={form.code}
                    onChange={(code) => setForm({ ...form, code: code.toUpperCase() })}
                    required
                />
                <label className="forum-label">
                    Rabattart
                    <select
                        className="forum-input"
                        value={form.type}
                        onChange={(event) => setForm({ ...form, type: event.target.value })}
                    >
                        <option value="PERCENT">Prozent</option>
                        <option value="FIXED">Fester Betrag in Cent</option>
                    </select>
                </label>
                <Field
                    label={form.type === 'PERCENT' ? 'Rabatt in Prozent' : 'Rabatt in Cent'}
                    type="number"
                    min="1"
                    value={form.value}
                    onChange={(value) => setForm({ ...form, value: Number(value) })}
                    required
                />
                <Field
                    label="Mindestbestellwert in EUR"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minimumOrder}
                    onChange={(minimumOrder) => setForm({ ...form, minimumOrder })}
                />
                <Field
                    label="Gültig ab (optional)"
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(startsAt) => setForm({ ...form, startsAt })}
                />
                <Field
                    label="Gültig bis (optional)"
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(expiresAt) => setForm({ ...form, expiresAt })}
                />
                <Field
                    label="Maximale Einlösungen (0 = unbegrenzt)"
                    type="number"
                    min="0"
                    value={form.maxRedemptions}
                    onChange={(maxRedemptions) => setForm({ ...form, maxRedemptions: Number(maxRedemptions) })}
                />
            </div>
            <Selection
                title="Auf Produkte begrenzen"
                hint="Keine Auswahl = gesamter Warenkorb"
                items={products.filter((item) => !item.deleted).map((item) => [item.id, item.name])}
                selected={form.productIds}
                onChange={(productIds) => setForm({ ...form, productIds })}
            />
            <div className="mt-5">
                <Toggle
                    label="Coupon aktiv"
                    checked={form.enabled}
                    onChange={(enabled) => setForm({ ...form, enabled })}
                />
            </div>
            <SaveBar saving={saving} message={message} />
        </form>
    );
}

function OrderOperations() {
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(0);
    const [state, setState] = useState({ loading: true, orders: null, payments: null, error: '' });
    const load = useCallback(async () => {
        setState((current) => ({ ...current, loading: true, error: '' }));
        try {
            const [orders, payments] = await Promise.all([
                storeApi.admin.orders(page, status),
                storeApi.admin.payments(0)
            ]);
            setState({ loading: false, orders, payments, error: '' });
        } catch (error) {
            setState({ loading: false, orders: null, payments: null, error: error.message });
        }
    }, [page, status]);
    useEffect(() => {
        load();
    }, [load]);
    return (
        <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_380px]">
            <section className="forum-panel overflow-hidden rounded-3xl">
                <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[.06] p-6">
                    <div>
                        <p className="eyebrow">ORDERS</p>
                        <h2 className="mt-2 font-display text-2xl font-bold">Bestellungen</h2>
                    </div>
                    <label className="forum-label w-52">
                        Status
                        <select
                            className="forum-input"
                            value={status}
                            onChange={(event) => {
                                setStatus(event.target.value);
                                setPage(0);
                            }}
                        >
                            <option value="">Alle</option>
                            {['CREATED', 'PAID', 'FULFILLED', 'CANCELLED', 'REFUNDED', 'CHARGEBACK'].map((value) => (
                                <option key={value}>{value}</option>
                            ))}
                        </select>
                    </label>
                </header>
                {state.loading && (
                    <div className="p-6">
                        <ForumLoading label="Bestellungen werden geladen …" />
                    </div>
                )}
                {state.error && (
                    <div className="p-6">
                        <ForumError message={state.error} retry={load} />
                    </div>
                )}
                {!state.loading && (state.orders?.items ?? []).length === 0 && (
                    <Empty text="Keine Bestellungen vorhanden." />
                )}
                {(state.orders?.items ?? []).map((order) => (
                    <article className="border-b border-white/[.05] p-6 last:border-0" key={order.id}>
                        <div className="flex flex-wrap justify-between gap-4">
                            <div>
                                <b className="font-mono text-xs">#{order.id}</b>
                                <p className="mt-2 text-xs text-zinc-600">
                                    {formatDate(order.createdAt)} · {order.fromUserId}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="rounded-full bg-orange-500/10 px-3 py-1 text-[10px] font-bold text-orange-300">
                                    {order.status}
                                </span>
                                <b className="mt-2 block">{formatStorePrice(order.totalCents, order.currency)}</b>
                            </div>
                        </div>
                        <div className="mt-4 space-y-1 text-sm text-zinc-500">
                            {(order.items ?? []).map((item) => (
                                <p key={item.productId}>
                                    {item.quantity}× {item.name}
                                </p>
                            ))}
                        </div>
                    </article>
                ))}
                {state.orders && (
                    <Pagination
                        page={state.orders.page}
                        size={state.orders.size}
                        total={state.orders.total}
                        onPage={setPage}
                    />
                )}
            </section>
            <section className="forum-panel h-fit rounded-3xl p-6">
                <div className="flex items-center gap-3">
                    <FaCreditCard className="text-orange-400" />
                    <h2 className="font-display text-2xl font-bold">Zahlungen</h2>
                </div>
                <div className="mt-5 space-y-3">
                    {(state.payments?.items ?? []).slice(0, 10).map((payment) => (
                        <div className="rounded-2xl border border-white/[.06] p-4 text-xs" key={payment.id}>
                            <div className="flex justify-between gap-3">
                                <b>{payment.gatewayId || '–'}</b>
                                <span className="text-zinc-500">{payment.status}</span>
                            </div>
                            <p className="mt-2 text-zinc-600">
                                {formatStorePrice(payment.amountCents, payment.currency)}
                            </p>
                        </div>
                    ))}
                </div>
                {!state.loading && (state.payments?.items ?? []).length === 0 && (
                    <p className="mt-5 text-sm text-zinc-600">Keine Zahlungen vorhanden.</p>
                )}
            </section>
        </div>
    );
}

function CustomerOperations() {
    const [page, setPage] = useState(0);
    const [state, setState] = useState({ loading: true, customers: null, entitlements: null, error: '' });
    const load = useCallback(async () => {
        try {
            const [customers, entitlements] = await Promise.all([
                storeApi.admin.customers(page),
                storeApi.admin.entitlements(0)
            ]);
            setState({ loading: false, customers, entitlements, error: '' });
        } catch (error) {
            setState({ loading: false, customers: null, entitlements: null, error: error.message });
        }
    }, [page]);
    useEffect(() => {
        load();
    }, [load]);
    return (
        <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_380px]">
            <section className="forum-panel overflow-hidden rounded-3xl">
                <header className="border-b border-white/[.06] p-6">
                    <p className="eyebrow">CUSTOMERS</p>
                    <h2 className="mt-2 font-display text-2xl font-bold">Kunden & Credits</h2>
                </header>
                {state.loading && (
                    <div className="p-6">
                        <ForumLoading label="Kunden werden geladen …" />
                    </div>
                )}
                {state.error && (
                    <div className="p-6">
                        <ForumError message={state.error} retry={load} />
                    </div>
                )}
                {!state.loading && (state.customers?.items ?? []).length === 0 && (
                    <Empty text="Noch keine Store-Kunden vorhanden." />
                )}
                {(state.customers?.items ?? []).map((customer) => (
                    <CustomerRow customer={customer} onChanged={load} key={customer.id} />
                ))}
                {state.customers && (
                    <Pagination
                        page={state.customers.page}
                        size={state.customers.size}
                        total={state.customers.total}
                        onPage={setPage}
                    />
                )}
            </section>
            <section className="forum-panel h-fit rounded-3xl p-6">
                <h2 className="font-display text-2xl font-bold">Freischaltungen</h2>
                <p className="mt-2 text-sm text-zinc-600">{state.entitlements?.total ?? 0} Entitlements insgesamt</p>
                <div className="mt-5 space-y-3">
                    {(state.entitlements?.items ?? []).slice(0, 10).map((item) => (
                        <div className="rounded-2xl border border-white/[.06] p-4 text-xs" key={item.id}>
                            <b>{item.productId}</b>
                            <p className="mt-2 break-all text-zinc-600">{item.userId}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

function CustomerRow({ customer, onChanged }) {
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const adjust = async () => {
        const deltaCents = Math.round(Number(amount) * 100);
        if (!deltaCents) return;
        try {
            await storeApi.admin.adjustCredits(customer.id, deltaCents);
            setAmount('');
            setMessage('Credits angepasst.');
            await onChanged();
        } catch (error) {
            setMessage(error.message);
        }
    };
    return (
        <article className="border-b border-white/[.05] p-6 last:border-0">
            <div className="flex flex-wrap justify-between gap-5">
                <div>
                    <b>{customer.billingAddress?.fullName || 'Ohne Rechnungsprofil'}</b>
                    <p className="mt-1 break-all font-mono text-[11px] text-zinc-600">{customer.id}</p>
                    <p className="mt-2 text-xs text-zinc-500">{customer.billingEmail || 'Keine Rechnungs-E-Mail'}</p>
                </div>
                <div className="text-right">
                    <b className="font-display text-xl">{formatStorePrice(customer.creditsCents, 'EUR')}</b>
                    <div className="mt-3 flex gap-2">
                        <input
                            className="forum-input !mt-0 w-28"
                            type="number"
                            step="0.01"
                            placeholder="± EUR"
                            value={amount}
                            onChange={(event) => setAmount(event.target.value)}
                        />
                        <button className="forum-button-secondary" onClick={adjust}>
                            Anpassen
                        </button>
                    </div>
                </div>
            </div>
            {message && <p className="mt-3 text-xs text-zinc-500">{message}</p>}
        </article>
    );
}

function EditorHeader({ eyebrow, title, children, onDelete }) {
    return (
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
                <p className="eyebrow">{eyebrow}</p>
                <h2 className="mt-2 font-display text-3xl font-bold">{title}</h2>
            </div>
            <div className="flex flex-1 flex-wrap justify-end gap-2">
                {children}
                {onDelete && (
                    <button
                        type="button"
                        className="forum-icon-button text-red-300"
                        onClick={onDelete}
                        title="Deaktivieren"
                    >
                        <FaTrash />
                    </button>
                )}
            </div>
        </header>
    );
}
function SaveBar({ saving, message }) {
    return (
        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-white/[.06] pt-6">
            {message ? <p className="text-sm text-zinc-400">{message}</p> : <span />}
            <button className="forum-button-primary" disabled={saving}>
                <FaFloppyDisk /> {saving ? 'Wird gespeichert …' : 'Speichern'}
            </button>
        </div>
    );
}
function Field({ label, value, onChange, type = 'text', required = false, ...props }) {
    return (
        <label className="forum-label">
            {label}
            <input
                className="forum-input"
                type={type}
                value={value ?? ''}
                onChange={(event) => onChange(event.target.value)}
                required={required}
                {...props}
            />
        </label>
    );
}
function Area({ label, value, onChange, required = false }) {
    return (
        <label className="forum-label">
            {label}
            <textarea
                className="forum-input min-h-28 resize-y"
                value={value ?? ''}
                onChange={(event) => onChange(event.target.value)}
                required={required}
            />
        </label>
    );
}
function Toggle({ label, checked, onChange }) {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/[.06] bg-black/15 p-4 text-sm text-zinc-300">
            <span>{label}</span>
            <input
                className="h-5 w-5 accent-orange-500"
                type="checkbox"
                checked={Boolean(checked)}
                onChange={(event) => onChange(event.target.checked)}
            />
        </label>
    );
}
function Selection({ title, hint, items, selected, onChange }) {
    const values = selected ?? [];
    const toggle = (id) => onChange(values.includes(id) ? values.filter((value) => value !== id) : [...values, id]);
    return (
        <fieldset className="mt-6">
            <legend className="forum-label">
                {title} {hint && <span className="font-normal normal-case text-zinc-700">({hint})</span>}
            </legend>
            <div className="mt-3 grid max-h-52 gap-2 overflow-y-auto rounded-2xl border border-white/[.06] bg-black/15 p-3 sm:grid-cols-2">
                {items.length === 0 ? (
                    <p className="p-2 text-sm text-zinc-700">Keine Einträge verfügbar.</p>
                ) : (
                    items.map(([id, label]) => (
                        <label
                            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-zinc-400 hover:bg-white/[.035]"
                            key={id}
                        >
                            <input
                                className="accent-orange-500"
                                type="checkbox"
                                checked={values.includes(id)}
                                onChange={() => toggle(id)}
                            />
                            <span>{label}</span>
                        </label>
                    ))
                )}
            </div>
        </fieldset>
    );
}
function Empty({ text }) {
    return <p className="p-8 text-center text-sm text-zinc-600">{text}</p>;
}
const lines = (value) =>
    (value || '')
        .split('\n')
        .map((entry) => entry.trim())
        .filter(Boolean);
const toLocalDateTime = (value) => (value ? new Date(value).toISOString().slice(0, 16) : '');

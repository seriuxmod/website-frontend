import { useCallback, useMemo, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import {
    FaBoxesStacked,
    FaFloppyDisk,
    FaLayerGroup,
    FaPlus,
    FaTags,
    FaTrash
} from 'react-icons/fa6';
import { hasAnyPermission } from '../../../lib/auth';
import { formatStorePrice, storeApi } from '../../../lib/storeApi';
import {
    CommerceAdminPage,
    CommerceEmpty,
    CommerceLoading,
    CommercePanel,
    LiveDataTable,
    StatusPill,
    columnHelper,
    formatDate,
    useCommerceResource
} from './AdminCommerceShared';

const EMPTY_CATEGORY = {
    name: '',
    description: '',
    imageUrl: '',
    parentCategoryId: '',
    onlySubcategories: false,
    hidden: false,
    disabled: false,
    order: 0
};
const EMPTY_PRODUCT = {
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
    requiredGroupIdsText: '',
    globalLimit: 0,
    globalInterval: 1,
    globalPeriod: 'no_period',
    userLimit: 0,
    userInterval: 1,
    userPeriod: 'no_period'
};
const EMPTY_FIELD = {
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
const EMPTY_COUPON = {
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

export function CommerceCatalogView({ user }) {
    const loader = useCallback(
        () =>
            Promise.all([storeApi.admin.categories(), storeApi.admin.products(), storeApi.admin.fields()]).then(
                ([categories, products, fields]) => ({ categories, products, fields })
            ),
        []
    );
    const resource = useCommerceResource(loader, [loader]);
    const [mode, setMode] = useState('products');
    const [selectedId, setSelectedId] = useState('');
    const canWrite = hasAnyPermission(user, 'store.catalog.write');
    const data = resource.data || { categories: [], products: [], fields: [] };
    const selection = mode === 'products'
        ? data.products.find((item) => item.id === selectedId)
        : data.categories.find((item) => item.id === selectedId);

    const productColumns = useMemo(
        () =>
            columnHelper.columns([
                columnHelper.accessor('name', {
                    header: 'Produkt',
                    cell: (context) => <b className="text-sm">{context.getValue()}</b>
                }),
                columnHelper.accessor('categoryId', {
                    header: 'Kategorie',
                    cell: (context) => <span className="text-xs text-zinc-500">{categoryName(data.categories, context.getValue())}</span>
                }),
                columnHelper.accessor('priceCents', {
                    header: 'Preis',
                    cell: (context) => <b className="text-xs text-orange-200">{formatStorePrice(context.getValue(), context.row.original.currency)}</b>
                }),
                columnHelper.accessor((row) => catalogStatus(row), {
                    id: 'status',
                    header: 'Status',
                    cell: (context) => <StatusPill value={context.getValue()} />
                }),
                columnHelper.accessor('updatedAt', {
                    header: 'Geändert',
                    cell: (context) => <time className="text-xs text-zinc-500">{formatDate(context.getValue())}</time>
                }),
                columnHelper.display({
                    id: 'actions',
                    header: '',
                    cell: (context) => <OpenButton onClick={() => setSelectedId(context.row.original.id)} />
                })
            ]),
        [data.categories]
    );
    const categoryColumns = useMemo(
        () =>
            columnHelper.columns([
                columnHelper.accessor('name', {
                    header: 'Kategorie',
                    cell: (context) => <b className="text-sm">{context.getValue()}</b>
                }),
                columnHelper.accessor('parentCategoryId', {
                    header: 'Übergeordnet',
                    cell: (context) => <span className="text-xs text-zinc-500">{categoryName(data.categories, context.getValue())}</span>
                }),
                columnHelper.accessor('order', { header: 'Position' }),
                columnHelper.accessor((row) => catalogStatus(row), {
                    id: 'status',
                    header: 'Status',
                    cell: (context) => <StatusPill value={context.getValue()} />
                }),
                columnHelper.display({
                    id: 'actions',
                    header: '',
                    cell: (context) => <OpenButton onClick={() => setSelectedId(context.row.original.id)} />
                })
            ]),
        [data.categories]
    );

    const selectMode = (nextMode) => {
        setMode(nextMode);
        setSelectedId('');
    };

    return (
        <CommerceAdminPage
            actions={
                canWrite && (
                    <button className="admin-forum-primary" onClick={() => setSelectedId('new')} type="button">
                        <FaPlus /> {mode === 'products' ? 'Produkt' : 'Kategorie'} anlegen
                    </button>
                )
            }
            description="Kategorien und Produkte einschließlich Abhängigkeiten, Limits und dynamischen Eingabefeldern verwalten."
            error={resource.error}
            eyebrow="KATALOGVERWALTUNG"
            icon={FaBoxesStacked}
            loading={resource.loading}
            onRetry={resource.reload}
            title="Katalog"
        >
            {resource.loading || !resource.data ? (
                <CommerceLoading title="Katalog wird geladen" />
            ) : (
                <>
                    <div className="mb-5 inline-flex rounded-xl border border-white/[.07] bg-[#0b0c10] p-1">
                        {[
                            ['products', 'Produkte'],
                            ['categories', 'Kategorien']
                        ].map(([key, label]) => (
                            <button
                                className={
                                    'rounded-lg px-4 py-2.5 text-xs font-bold transition ' +
                                    (mode === key ? 'bg-orange-500 text-white' : 'text-zinc-500 hover:text-white')
                                }
                                key={key}
                                onClick={() => selectMode(key)}
                                type="button"
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.25fr)_minmax(420px,.75fr)]">
                        <CommercePanel
                            description={mode === 'products' ? 'Alle Produktangebote einschließlich deaktivierter Einträge.' : 'Hierarchie und Sichtbarkeit der Shopbereiche.'}
                            eyebrow={mode === 'products' ? 'PRODUKTE' : 'KATEGORIEN'}
                            title={mode === 'products' ? 'Produktkatalog' : 'Kategoriestruktur'}
                        >
                            <LiveDataTable
                                columns={mode === 'products' ? productColumns : categoryColumns}
                                emptyText={mode === 'products' ? 'Lege zuerst eine Kategorie und anschließend ein Produkt an.' : 'Lege die erste Shopkategorie an.'}
                                emptyTitle={mode === 'products' ? 'Keine Produkte vorhanden' : 'Keine Kategorien vorhanden'}
                                getSearchValue={(row) => [row.name, row.description, row.id].join(' ')}
                                rows={mode === 'products' ? data.products : data.categories}
                                searchPlaceholder={mode === 'products' ? 'Produkte durchsuchen …' : 'Kategorien durchsuchen …'}
                            />
                        </CommercePanel>
                        {selectedId ? (
                            mode === 'products' ? (
                                <ProductEditor
                                    canWrite={canWrite}
                                    categories={data.categories}
                                    fields={data.fields}
                                    key={selectedId}
                                    onChanged={async () => {
                                        await resource.reload();
                                        setSelectedId('');
                                    }}
                                    product={selection}
                                    products={data.products}
                                />
                            ) : (
                                <CategoryEditor
                                    canWrite={canWrite}
                                    categories={data.categories}
                                    category={selection}
                                    key={selectedId}
                                    onChanged={async () => {
                                        await resource.reload();
                                        setSelectedId('');
                                    }}
                                />
                            )
                        ) : (
                            <CommercePanel className="h-fit" eyebrow="EDITOR" title="Auswahl">
                                <CommerceEmpty title="Kein Eintrag ausgewählt" text="Öffne einen Eintrag oder lege einen neuen an." />
                            </CommercePanel>
                        )}
                    </div>
                </>
            )}
        </CommerceAdminPage>
    );
}

function CategoryEditor({ category, categories, canWrite, onChanged }) {
    const [message, setMessage] = useState('');
    const defaults = category ? { ...EMPTY_CATEGORY, ...category, parentCategoryId: category.parentCategoryId || '' } : EMPTY_CATEGORY;
    const form = useForm({
        defaultValues: defaults,
        onSubmit: async ({ value }) => {
            setMessage('');
            try {
                await storeApi.admin.saveCategory(category?.id, {
                    ...value,
                    order: Number(value.order),
                    parentCategoryId: value.parentCategoryId || null
                });
                await onChanged();
            } catch (error) {
                setMessage(error.message);
            }
        }
    });
    const remove = async () => {
        if (!category || !window.confirm('Kategorie „' + category.name + '“ wirklich deaktivieren?')) return;
        try {
            await storeApi.admin.deleteCategory(category.id);
            await onChanged();
        } catch (error) {
            setMessage(error.message);
        }
    };
    return (
        <Editor title={category ? 'Kategorie bearbeiten' : 'Kategorie anlegen'} onDelete={canWrite && category ? remove : null}>
            <form onSubmit={submitForm(form)}>
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField form={form} label="Name" name="name" required />
                    <NumberField form={form} label="Position" name="order" />
                    <SelectField
                        form={form}
                        label="Übergeordnete Kategorie"
                        name="parentCategoryId"
                        options={categories
                            .filter((item) => item.id !== category?.id && !item.deleted)
                            .map((item) => [item.id, item.name])}
                        placeholder="Keine"
                    />
                    <TextField form={form} label="Bild-URL" name="imageUrl" />
                    <div className="sm:col-span-2"><AreaField form={form} label="Beschreibung" name="description" /></div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <ToggleField form={form} label="Nur Unterkategorien" name="onlySubcategories" />
                    <ToggleField form={form} label="Im Shop verstecken" name="hidden" />
                    <ToggleField form={form} label="Deaktiviert" name="disabled" />
                </div>
                <SaveBar canWrite={canWrite} form={form} message={message} />
            </form>
        </Editor>
    );
}

function ProductEditor({ product, products, categories, fields, canWrite, onChanged }) {
    const [message, setMessage] = useState('');
    const defaults = product
        ? {
              ...EMPTY_PRODUCT,
              ...product,
              price: ((product.priceCents || 0) / 100).toFixed(2),
              fieldIds: product.fieldIds || [],
              requiredProductIds: [...(product.requiredProductIds || [])],
              requiredGroupIdsText: [...(product.requiredGroupIds || [])].join('\n'),
              globalLimit: product.globalLimit?.limit || 0,
              globalInterval: product.globalLimit?.interval || 1,
              globalPeriod: product.globalLimit?.period || 'no_period',
              userLimit: product.userLimit?.limit || 0,
              userInterval: product.userLimit?.interval || 1,
              userPeriod: product.userLimit?.period || 'no_period'
          }
        : { ...EMPTY_PRODUCT, categoryId: categories.find((item) => !item.deleted && !item.disabled)?.id || '' };
    const form = useForm({
        defaultValues: defaults,
        onSubmit: async ({ value }) => {
            setMessage('');
            try {
                await storeApi.admin.saveProduct(product?.id, {
                    categoryId: value.categoryId,
                    name: value.name,
                    priceCents: Math.round(Number(value.price) * 100),
                    currency: value.currency.toUpperCase(),
                    description: value.description,
                    imageUrl: value.imageUrl,
                    globalLimit: limit(value.globalLimit, value.globalInterval, value.globalPeriod),
                    userLimit: limit(value.userLimit, value.userInterval, value.userPeriod),
                    requiredProductIds: value.requiredProductIds,
                    requiredGroupIds: lines(value.requiredGroupIdsText),
                    paymentType: 1,
                    hidden: value.hidden,
                    disabled: value.disabled,
                    order: Number(value.order),
                    fieldIds: value.fieldIds
                });
                await onChanged();
            } catch (error) {
                setMessage(error.message);
            }
        }
    });
    const remove = async () => {
        if (!product || !window.confirm('Produkt „' + product.name + '“ wirklich deaktivieren?')) return;
        try {
            await storeApi.admin.deleteProduct(product.id);
            await onChanged();
        } catch (error) {
            setMessage(error.message);
        }
    };
    return (
        <Editor title={product ? 'Produkt bearbeiten' : 'Produkt anlegen'} onDelete={canWrite && product ? remove : null}>
            <form onSubmit={submitForm(form)}>
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField form={form} label="Produktname" name="name" required />
                    <SelectField
                        form={form}
                        label="Kategorie"
                        name="categoryId"
                        options={categories.filter((item) => !item.deleted && !item.disabled).map((item) => [item.id, item.name])}
                        placeholder="Bitte wählen"
                        required
                    />
                    <NumberField form={form} label="Bruttopreis" name="price" min="0" step="0.01" required />
                    <TextField form={form} label="Währung" name="currency" required />
                    <NumberField form={form} label="Position" name="order" />
                    <TextField form={form} label="Bild-URL" name="imageUrl" />
                    <div className="sm:col-span-2"><AreaField form={form} label="Beschreibung" name="description" /></div>
                    <div className="sm:col-span-2"><AreaField form={form} label="Benötigte PermissionGroups (eine pro Zeile)" name="requiredGroupIdsText" /></div>
                </div>
                <LimitFields form={form} prefix="global" title="Globales Verkaufslimit" />
                <LimitFields form={form} prefix="user" title="Limit je Benutzer" />
                <CheckGroup
                    form={form}
                    items={fields.filter((item) => !item.deleted).map((item) => [item.id, item.description || item.identifier])}
                    label="Produktfelder"
                    name="fieldIds"
                />
                <CheckGroup
                    form={form}
                    items={products.filter((item) => !item.deleted && item.id !== product?.id).map((item) => [item.id, item.name])}
                    label="Vorausgesetzte Produkte"
                    name="requiredProductIds"
                />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <ToggleField form={form} label="Im Shop verstecken" name="hidden" />
                    <ToggleField form={form} label="Verkauf deaktivieren" name="disabled" />
                </div>
                <SaveBar canWrite={canWrite} form={form} message={message} />
            </form>
        </Editor>
    );
}

export function CommerceFieldsView({ user }) {
    const resource = useCommerceResource(useCallback(() => storeApi.admin.fields(), []), []);
    const [selectedId, setSelectedId] = useState('');
    const canWrite = hasAnyPermission(user, 'store.catalog.write');
    const fields = resource.data || [];
    const selected = fields.find((item) => item.id === selectedId);
    const columns = useMemo(
        () =>
            columnHelper.columns([
                columnHelper.accessor('identifier', {
                    header: 'Identifier',
                    cell: (context) => <b className="font-mono text-xs">{context.getValue()}</b>
                }),
                columnHelper.accessor('description', { header: 'Bezeichnung' }),
                columnHelper.accessor('typeId', {
                    header: 'Typ',
                    cell: (context) => fieldType(context.getValue())
                }),
                columnHelper.accessor('required', {
                    header: 'Pflicht',
                    cell: (context) => <StatusPill value={context.getValue() ? 'Ja' : 'Nein'} />
                }),
                columnHelper.accessor((row) => (row.deleted ? 'Gelöscht' : 'Aktiv'), {
                    id: 'status',
                    header: 'Status',
                    cell: (context) => <StatusPill value={context.getValue()} />
                }),
                columnHelper.display({
                    id: 'actions',
                    header: '',
                    cell: (context) => <OpenButton onClick={() => setSelectedId(context.row.original.id)} />
                })
            ]),
        []
    );
    return (
        <CommerceAdminPage
            actions={
                canWrite && <button className="admin-forum-primary" onClick={() => setSelectedId('new')} type="button"><FaPlus /> Feld anlegen</button>
            }
            description="Validierte Zusatzangaben definieren, die Produkte während des Checkouts abfragen können."
            error={resource.error}
            eyebrow="DYNAMISCHE DATEN"
            icon={FaLayerGroup}
            loading={resource.loading}
            onRetry={resource.reload}
            title="Produktfelder"
        >
            {resource.loading || !resource.data ? (
                <CommerceLoading title="Produktfelder werden geladen" />
            ) : (
                <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.25fr)_minmax(420px,.75fr)]">
                    <CommercePanel eyebrow="FELDKATALOG" title="Konfigurierte Felder">
                        <LiveDataTable
                            columns={columns}
                            emptyText="Lege das erste dynamische Produktfeld an."
                            emptyTitle="Keine Produktfelder vorhanden"
                            rows={fields}
                            searchPlaceholder="Produktfelder durchsuchen …"
                        />
                    </CommercePanel>
                    {selectedId ? (
                        <FieldEditor
                            canWrite={canWrite}
                            field={selected}
                            key={selectedId}
                            onChanged={async () => {
                                await resource.reload();
                                setSelectedId('');
                            }}
                        />
                    ) : (
                        <CommercePanel className="h-fit" eyebrow="EDITOR" title="Produktfeld">
                            <CommerceEmpty title="Kein Feld ausgewählt" text="Öffne einen Eintrag oder lege ein Feld an." />
                        </CommercePanel>
                    )}
                </div>
            )}
        </CommerceAdminPage>
    );
}

function FieldEditor({ field, canWrite, onChanged }) {
    const [message, setMessage] = useState('');
    const defaults = field ? { ...EMPTY_FIELD, ...field, optionsText: (field.options || []).join('\n') } : EMPTY_FIELD;
    const form = useForm({
        defaultValues: defaults,
        onSubmit: async ({ value }) => {
            setMessage('');
            try {
                await storeApi.admin.saveField(field?.id, {
                    identifier: value.identifier,
                    description: value.description,
                    typeId: Number(value.typeId),
                    required: value.required,
                    min: Number(value.min),
                    max: Number(value.max),
                    options: lines(value.optionsText),
                    regex: value.regex,
                    defaultValue: value.defaultValue,
                    order: Number(value.order)
                });
                await onChanged();
            } catch (error) {
                setMessage(error.message);
            }
        }
    });
    const remove = async () => {
        if (!field || !window.confirm('Produktfeld „' + field.identifier + '“ wirklich deaktivieren?')) return;
        try {
            await storeApi.admin.deleteField(field.id);
            await onChanged();
        } catch (error) {
            setMessage(error.message);
        }
    };
    return (
        <Editor title={field ? 'Produktfeld bearbeiten' : 'Produktfeld anlegen'} onDelete={canWrite && field ? remove : null}>
            <form onSubmit={submitForm(form)}>
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField form={form} label="Identifier" name="identifier" required />
                    <SelectField
                        form={form}
                        label="Feldtyp"
                        name="typeId"
                        options={[[1, 'Text'], [2, 'Mehrzeiliger Text'], [3, 'Auswahl'], [4, 'Zahl']]}
                    />
                    <div className="sm:col-span-2"><TextField form={form} label="Bezeichnung / Hilfe" name="description" /></div>
                    <NumberField form={form} label="Minimum" min="0" name="min" />
                    <NumberField form={form} label="Maximum (0 = offen)" min="0" name="max" />
                    <NumberField form={form} label="Position" name="order" />
                    <TextField form={form} label="Standardwert" name="defaultValue" />
                    <div className="sm:col-span-2"><TextField form={form} label="Validierungs-RegEx" name="regex" /></div>
                    <div className="sm:col-span-2"><AreaField form={form} label="Auswahloptionen (eine pro Zeile)" name="optionsText" /></div>
                </div>
                <div className="mt-5"><ToggleField form={form} label="Pflichtfeld" name="required" /></div>
                <SaveBar canWrite={canWrite} form={form} message={message} />
            </form>
        </Editor>
    );
}

export function CommerceCouponsView({ user }) {
    const loader = useCallback(
        () => Promise.all([storeApi.admin.coupons(), storeApi.admin.products()]).then(([coupons, products]) => ({ coupons, products })),
        []
    );
    const resource = useCommerceResource(loader, [loader]);
    const [selectedId, setSelectedId] = useState('');
    const canWrite = hasAnyPermission(user, 'store.catalog.write');
    const coupons = resource.data?.coupons || [];
    const products = resource.data?.products || [];
    const selected = coupons.find((item) => item.id === selectedId);
    const columns = useMemo(
        () =>
            columnHelper.columns([
                columnHelper.accessor('code', {
                    header: 'Code',
                    cell: (context) => <b className="font-mono text-sm text-orange-200">{context.getValue()}</b>
                }),
                columnHelper.accessor((row) => couponValue(row), { id: 'discount', header: 'Rabatt' }),
                columnHelper.accessor((row) => redemptionText(row), { id: 'redemptions', header: 'Einlösungen' }),
                columnHelper.accessor('expiresAt', {
                    header: 'Gültig bis',
                    cell: (context) => <time className="text-xs text-zinc-500">{formatDate(context.getValue(), false)}</time>
                }),
                columnHelper.accessor((row) => couponStatus(row), {
                    id: 'status',
                    header: 'Status',
                    cell: (context) => <StatusPill value={context.getValue()} />
                }),
                columnHelper.display({
                    id: 'actions',
                    header: '',
                    cell: (context) => <OpenButton onClick={() => setSelectedId(context.row.original.id)} />
                })
            ]),
        []
    );
    return (
        <CommerceAdminPage
            actions={
                canWrite && <button className="admin-forum-primary" onClick={() => setSelectedId('new')} type="button"><FaPlus /> Coupon anlegen</button>
            }
            description="Rabattcodes, Zeitfenster, Produktbindungen und Einlösungslimits zentral steuern."
            error={resource.error}
            eyebrow="RABATTVERWALTUNG"
            icon={FaTags}
            loading={resource.loading}
            onRetry={resource.reload}
            title="Coupons"
        >
            {resource.loading || !resource.data ? (
                <CommerceLoading title="Coupons werden geladen" />
            ) : (
                <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.25fr)_minmax(420px,.75fr)]">
                    <CommercePanel eyebrow="COUPONLISTE" title="Rabattcodes">
                        <LiveDataTable
                            columns={columns}
                            emptyText="Lege den ersten Rabattcode an."
                            emptyTitle="Keine Coupons vorhanden"
                            rows={coupons}
                            searchPlaceholder="Coupons durchsuchen …"
                        />
                    </CommercePanel>
                    {selectedId ? (
                        <CouponEditor
                            canWrite={canWrite}
                            coupon={selected}
                            key={selectedId}
                            onChanged={async () => {
                                await resource.reload();
                                setSelectedId('');
                            }}
                            products={products}
                        />
                    ) : (
                        <CommercePanel className="h-fit" eyebrow="EDITOR" title="Coupon">
                            <CommerceEmpty title="Kein Coupon ausgewählt" text="Öffne einen Code oder lege einen neuen an." />
                        </CommercePanel>
                    )}
                </div>
            )}
        </CommerceAdminPage>
    );
}

function CouponEditor({ coupon, products, canWrite, onChanged }) {
    const [message, setMessage] = useState('');
    const defaults = coupon
        ? {
              ...EMPTY_COUPON,
              ...coupon,
              minimumOrder: ((coupon.minimumOrderCents || 0) / 100).toFixed(2),
              productIds: [...(coupon.productIds || [])],
              startsAt: localDateTime(coupon.startsAt),
              expiresAt: localDateTime(coupon.expiresAt)
          }
        : EMPTY_COUPON;
    const form = useForm({
        defaultValues: defaults,
        onSubmit: async ({ value }) => {
            setMessage('');
            if (value.type === 'PERCENT' && Number(value.value) > 100) {
                setMessage('Ein prozentualer Rabatt darf höchstens 100 % betragen.');
                return;
            }
            try {
                await storeApi.admin.saveCoupon(coupon?.id, {
                    code: value.code.toUpperCase(),
                    type: value.type,
                    value: Number(value.value),
                    minimumOrderCents: Math.round(Number(value.minimumOrder) * 100),
                    productIds: value.productIds,
                    enabled: value.enabled,
                    startsAt: value.startsAt ? new Date(value.startsAt).toISOString() : null,
                    expiresAt: value.expiresAt ? new Date(value.expiresAt).toISOString() : null,
                    maxRedemptions: Number(value.maxRedemptions)
                });
                await onChanged();
            } catch (error) {
                setMessage(error.message);
            }
        }
    });
    const remove = async () => {
        if (!coupon || !window.confirm('Coupon „' + coupon.code + '“ wirklich deaktivieren?')) return;
        try {
            await storeApi.admin.deleteCoupon(coupon.id);
            await onChanged();
        } catch (error) {
            setMessage(error.message);
        }
    };
    return (
        <Editor title={coupon ? 'Coupon bearbeiten' : 'Coupon anlegen'} onDelete={canWrite && coupon ? remove : null}>
            <form onSubmit={submitForm(form)}>
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField form={form} label="Code" name="code" required />
                    <SelectField form={form} label="Rabattart" name="type" options={[['PERCENT', 'Prozent'], ['FIXED', 'Fester Betrag in Cent']]} />
                    <NumberField form={form} label="Rabattwert" min="1" name="value" required />
                    <NumberField form={form} label="Mindestbestellwert in EUR" min="0" name="minimumOrder" step="0.01" />
                    <TextField form={form} label="Gültig ab" name="startsAt" type="datetime-local" />
                    <TextField form={form} label="Gültig bis" name="expiresAt" type="datetime-local" />
                    <NumberField form={form} label="Max. Einlösungen (0 = unbegrenzt)" min="0" name="maxRedemptions" />
                </div>
                <CheckGroup
                    form={form}
                    items={products.filter((item) => !item.deleted).map((item) => [item.id, item.name])}
                    label="Auf Produkte begrenzen"
                    name="productIds"
                />
                <div className="mt-5"><ToggleField form={form} label="Coupon aktiv" name="enabled" /></div>
                <SaveBar canWrite={canWrite} form={form} message={message} />
            </form>
        </Editor>
    );
}

function Editor({ title, onDelete, children }) {
    return (
        <CommercePanel
            actions={
                onDelete && (
                    <button
                        aria-label="Eintrag deaktivieren"
                        className="grid h-10 w-10 place-items-center rounded-xl border border-red-400/15 bg-red-400/[.05] text-red-300 transition hover:bg-red-400/[.1]"
                        onClick={onDelete}
                        type="button"
                    >
                        <FaTrash />
                    </button>
                )
            }
            className="h-fit"
            eyebrow="EDITOR"
            title={title}
        >
            <div className="p-5 sm:p-6">{children}</div>
        </CommercePanel>
    );
}

function TextField({ form, name, label, type = 'text', required = false }) {
    return (
        <form.Field name={name}>
            {(field) => (
                <label className="admin-forum-field">
                    <span>{label}</span>
                    <input
                        className="admin-forum-input"
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        required={required}
                        type={type}
                        value={field.state.value ?? ''}
                    />
                </label>
            )}
        </form.Field>
    );
}

function NumberField({ form, name, label, min, step, required = false }) {
    return (
        <form.Field name={name}>
            {(field) => (
                <label className="admin-forum-field">
                    <span>{label}</span>
                    <input
                        className="admin-forum-input"
                        min={min}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        required={required}
                        step={step}
                        type="number"
                        value={field.state.value}
                    />
                </label>
            )}
        </form.Field>
    );
}

function AreaField({ form, name, label }) {
    return (
        <form.Field name={name}>
            {(field) => (
                <label className="admin-forum-field">
                    <span>{label}</span>
                    <textarea
                        className="admin-forum-input min-h-24 resize-y py-3"
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        value={field.state.value || ''}
                    />
                </label>
            )}
        </form.Field>
    );
}

function SelectField({ form, name, label, options, placeholder, required = false }) {
    return (
        <form.Field name={name}>
            {(field) => (
                <label className="admin-forum-field">
                    <span>{label}</span>
                    <select
                        className="admin-forum-input"
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        required={required}
                        value={field.state.value ?? ''}
                    >
                        {placeholder !== undefined && <option value="">{placeholder}</option>}
                        {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
                    </select>
                </label>
            )}
        </form.Field>
    );
}

function ToggleField({ form, name, label }) {
    return (
        <form.Field name={name}>
            {(field) => (
                <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-white/[.06] bg-black/15 px-4 py-3 text-xs font-bold text-zinc-400">
                    <input
                        checked={Boolean(field.state.value)}
                        className="h-4 w-4 accent-orange-500"
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.checked)}
                        type="checkbox"
                    />
                    {label}
                </label>
            )}
        </form.Field>
    );
}

function CheckGroup({ form, name, label, items }) {
    return (
        <fieldset className="mt-5 rounded-2xl border border-white/[.06] bg-black/15 p-4">
            <legend className="px-2 text-[9px] font-extrabold uppercase tracking-wider text-zinc-600">{label}</legend>
            <form.Field name={name}>
                {(field) =>
                    items.length ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                            {items.map(([id, text]) => {
                                const selected = (field.state.value || []).includes(id);
                                return (
                                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[.05] px-3 py-2.5 text-xs text-zinc-400" key={id}>
                                        <input
                                            checked={selected}
                                            className="accent-orange-500"
                                            onChange={() => field.handleChange(selected ? field.state.value.filter((value) => value !== id) : [...field.state.value, id])}
                                            type="checkbox"
                                        />
                                        {text}
                                    </label>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-xs text-zinc-600">Keine Auswahl verfügbar.</p>
                    )
                }
            </form.Field>
        </fieldset>
    );
}

function LimitFields({ form, prefix, title }) {
    return (
        <fieldset className="mt-5 rounded-2xl border border-white/[.06] bg-black/15 p-4">
            <legend className="px-2 text-[9px] font-extrabold uppercase tracking-wider text-zinc-600">{title}</legend>
            <div className="grid gap-3 sm:grid-cols-3">
                <NumberField form={form} label="Limit (0 = offen)" min="0" name={prefix + 'Limit'} />
                <NumberField form={form} label="Intervall" min="1" name={prefix + 'Interval'} />
                <SelectField
                    form={form}
                    label="Zeitraum"
                    name={prefix + 'Period'}
                    options={[['no_period', 'Lebenszeit'], ['day', 'Tag'], ['week', 'Woche'], ['month', 'Monat'], ['year', 'Jahr']]}
                />
            </div>
        </fieldset>
    );
}

function SaveBar({ form, message, canWrite }) {
    return (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/[.05] pt-5">
            <span className="text-[10px] text-zinc-600">{message || (canWrite ? 'Änderungen werden im Store-Audit protokolliert.' : 'Nur Leseberechtigung')}</span>
            {canWrite && (
                <form.Subscribe selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}>
                    {({ canSubmit, isSubmitting }) => (
                        <button className="admin-forum-primary" disabled={!canSubmit || isSubmitting} type="submit">
                            <FaFloppyDisk /> {isSubmitting ? 'Wird gespeichert …' : 'Speichern'}
                        </button>
                    )}
                </form.Subscribe>
            )}
        </div>
    );
}

function OpenButton({ onClick }) {
    return <button className="admin-forum-secondary !px-3 !py-2" onClick={onClick} type="button">Öffnen</button>;
}
function submitForm(form) {
    return (event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
    };
}
function categoryName(categories, id) {
    if (!id) return 'Keine';
    return categories.find((item) => item.id === id)?.name || id;
}
function catalogStatus(item) {
    if (item.deleted) return 'Gelöscht';
    if (item.disabled) return 'Deaktiviert';
    if (item.hidden) return 'Versteckt';
    return 'Aktiv';
}
function fieldType(value) {
    return ({ 1: 'Text', 2: 'Mehrzeilig', 3: 'Auswahl', 4: 'Zahl' })[Number(value)] || 'Unbekannt';
}
function couponValue(coupon) {
    return coupon.type === 'PERCENT' ? coupon.value + ' %' : formatStorePrice(coupon.value);
}
function redemptionText(coupon) {
    return (coupon.redemptions || 0) + ' / ' + (coupon.maxRedemptions || '∞');
}
function couponStatus(coupon) {
    const now = Date.now();
    if (!coupon.enabled) return 'Deaktiviert';
    if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) return 'Geplant';
    if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() <= now) return 'Abgelaufen';
    if (coupon.maxRedemptions > 0 && coupon.redemptions >= coupon.maxRedemptions) return 'Ausgeschöpft';
    return 'Aktiv';
}
function limit(value, interval, period) {
    return { limit: Number(value), interval: Math.max(1, Number(interval)), period };
}
function lines(value) {
    return String(value || '').split('\n').map((entry) => entry.trim()).filter(Boolean);
}
function localDateTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

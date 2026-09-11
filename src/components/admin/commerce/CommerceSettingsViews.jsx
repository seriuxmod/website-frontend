import { useCallback, useMemo, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import {
    FaBuilding,
    FaCircleCheck,
    FaCircleExclamation,
    FaCreditCard,
    FaFloppyDisk,
    FaGear,
    FaShieldHalved
} from 'react-icons/fa6';
import { hasAnyPermission } from '../../../lib/auth';
import { storeApi } from '../../../lib/storeApi';
import {
    CommerceAdminPage,
    CommerceLoading,
    CommercePanel,
    StatusPill,
    useCommerceResource
} from './AdminCommerceShared';

const EMPTY_MERCHANT = {
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
    managingDirector: ''
};

export function CommercePaymentMethodsView({ user }) {
    const resource = useCommerceResource(useCallback(() => storeApi.admin.settings(), []), []);
    const canWrite = hasAnyPermission(user, 'store.settings.write');
    return (
        <CommerceAdminPage
            description="Zahlarten freischalten, sortieren und die serverseitige Provider-Konfiguration kontrollieren."
            error={resource.error}
            eyebrow="PAYMENT CONFIGURATION"
            icon={FaCreditCard}
            loading={resource.loading}
            onRetry={resource.reload}
            title="Zahlungsmethoden"
        >
            {resource.loading || !resource.data ? (
                <CommerceLoading title="Zahlungsmethoden werden geladen" />
            ) : (
                <PaymentMethodEditor canWrite={canWrite} onChanged={resource.reload} settings={resource.data} />
            )}
        </CommerceAdminPage>
    );
}

function PaymentMethodEditor({ settings, canWrite, onChanged }) {
    const [message, setMessage] = useState('');
    const methods = settings.paymentMethods || [];
    const defaultValues = useMemo(
        () => ({
            methods: methods.map((method) => ({
                id: method.id,
                enabled: Boolean(method.enabled),
                order: Number(method.order || 0)
            }))
        }),
        [methods]
    );
    const form = useForm({
        defaultValues,
        onSubmit: async ({ value }) => {
            setMessage('');
            try {
                await storeApi.admin.saveSettings(settingsPayload(settings, { paymentMethods: value.methods }));
                setMessage('Zahlungsmethoden wurden gespeichert.');
                await onChanged();
            } catch (error) {
                setMessage(error.message);
            }
        }
    });
    return (
        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,.75fr)]">
            <CommercePanel
                description="Zugangsdaten bleiben ausschließlich als Docker-Secrets auf dem Server und werden hier niemals ausgegeben."
                eyebrow="CHECKOUT"
                title="Angebotene Zahlarten"
            >
                <form className="p-5 sm:p-6" onSubmit={submitForm(form)}>
                    <form.Field name="methods" mode="array">
                        {(field) => (
                            <div className="grid gap-4 lg:grid-cols-2">
                                {methods.map((method, index) => {
                                    const value = field.state.value[index] || {
                                        id: method.id,
                                        enabled: false,
                                        order: method.order
                                    };
                                    return (
                                        <article className="rounded-2xl border border-white/[.065] bg-black/15 p-5" key={method.id}>
                                            <div className="flex items-start justify-between gap-4">
                                                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-400/[.08] text-orange-300">
                                                    <FaCreditCard />
                                                </span>
                                                <StatusPill value={method.providerConfigured ? 'Provider bereit' : 'Secrets fehlen'} />
                                            </div>
                                            <b className="mt-5 block text-base">{method.displayName}</b>
                                            <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">
                                                Provider: {method.provider}
                                            </p>
                                            <div className="mt-5 grid grid-cols-[1fr_110px] gap-3">
                                                <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-white/[.06] px-3 text-xs font-bold text-zinc-400">
                                                    <input
                                                        checked={Boolean(value.enabled)}
                                                        className="accent-orange-500"
                                                        disabled={!canWrite}
                                                        onChange={(event) => {
                                                            const next = [...field.state.value];
                                                            next[index] = { ...value, enabled: event.target.checked };
                                                            field.handleChange(next);
                                                        }}
                                                        type="checkbox"
                                                    />
                                                    Im Checkout
                                                </label>
                                                <label className="admin-forum-field">
                                                    <span>Position</span>
                                                    <input
                                                        className="admin-forum-input !mt-0"
                                                        disabled={!canWrite}
                                                        min="0"
                                                        onChange={(event) => {
                                                            const next = [...field.state.value];
                                                            next[index] = { ...value, order: Number(event.target.value) };
                                                            field.handleChange(next);
                                                        }}
                                                        type="number"
                                                        value={value.order}
                                                    />
                                                </label>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </form.Field>
                    <SaveBar canWrite={canWrite} form={form} message={message} />
                </form>
            </CommercePanel>
            <CommercePanel className="h-fit" eyebrow="BEREITSCHAFT" title="Provider-Status">
                <div className="space-y-3 p-5 sm:p-6">
                    <StatusRow
                        detail={settings.checkoutOperational ? 'Mindestens ein aktiver Provider ist einsatzbereit.' : 'Checkout-Konfiguration noch nicht vollständig.'}
                        label="Checkout"
                        ready={settings.checkoutOperational}
                    />
                    {methods.map((method) => (
                        <StatusRow
                            detail={method.enabled ? (method.providerConfigured ? 'Aktiv und konfiguriert' : 'Aktiv, aber Secrets fehlen') : 'Im Checkout deaktiviert'}
                            key={method.id}
                            label={method.displayName}
                            ready={!method.enabled || method.providerConfigured}
                        />
                    ))}
                </div>
            </CommercePanel>
        </div>
    );
}

export function CommerceSettingsView({ user }) {
    const resource = useCommerceResource(useCallback(() => storeApi.admin.settings(), []), []);
    const canWrite = hasAnyPermission(user, 'store.settings.write');
    return (
        <CommerceAdminPage
            description="Firmendaten, Rechnungsstellung, Steuerangaben und die globale Checkout-Freigabe verwalten."
            error={resource.error}
            eyebrow="STORE CONFIGURATION"
            icon={FaGear}
            loading={resource.loading}
            onRetry={resource.reload}
            title="Einstellungen"
        >
            {resource.loading || !resource.data ? (
                <CommerceLoading title="Store-Einstellungen werden geladen" />
            ) : (
                <SettingsEditor canWrite={canWrite} onChanged={resource.reload} settings={resource.data} />
            )}
        </CommerceAdminPage>
    );
}

function SettingsEditor({ settings, canWrite, onChanged }) {
    const [message, setMessage] = useState('');
    const defaults = {
        checkoutEnabled: Boolean(settings.checkoutEnabled),
        currency: settings.currency || 'EUR',
        invoicePrefix: settings.invoicePrefix || 'SM',
        pricesIncludeVat: settings.pricesIncludeVat !== false,
        vatRate: String((Number(settings.defaultVatRateBasisPoints) || 0) / 100),
        merchant: { ...EMPTY_MERCHANT, ...(settings.merchant || {}) }
    };
    const form = useForm({
        defaultValues: defaults,
        onSubmit: async ({ value }) => {
            setMessage('');
            const country = value.merchant.countryCode.trim().toUpperCase();
            if (!/^[A-Z]{2}$/.test(country)) {
                setMessage('Der Ländercode muss aus genau zwei Buchstaben bestehen.');
                return;
            }
            if (!value.merchant.email.includes('@')) {
                setMessage('Bitte eine gültige Kontakt-E-Mail hinterlegen.');
                return;
            }
            try {
                await storeApi.admin.saveSettings(
                    settingsPayload(settings, {
                        checkoutEnabled: value.checkoutEnabled,
                        currency: value.currency.toUpperCase(),
                        invoicePrefix: value.invoicePrefix.toUpperCase(),
                        pricesIncludeVat: value.pricesIncludeVat,
                        defaultVatRateBasisPoints: Math.round(Number(value.vatRate) * 100),
                        merchant: { ...value.merchant, countryCode country: undefined, countryPhone: undefined, countryCode: country }
                    })
                );
                setMessage('Store-Einstellungen wurden gespeichert.');
                await onChanged();
            } catch (error) {
                setMessage(error.message);
            }
        }
    });
    const merchantFields = [
        ['legalName', 'Rechtlicher Firmenname', 'text', true],
        ['tradingName', 'Marken-/Handelsname'],
        ['managingDirector', 'Geschäftsführer / Inhaber'],
        ['email', 'Kontakt-E-Mail', 'email', true],
        ['addressLine1', 'Straße und Hausnummer', 'text', true],
        ['addressLine2', 'Adresszusatz'],
        ['postalCode', 'Postleitzahl', 'text', true],
        ['city', 'Ort', 'text', true],
        ['region', 'Bundesland / Region'],
        ['countryCode', 'Ländercode', 'text', true],
        ['phone', 'Telefon'],
        ['website', 'Website', 'url'],
        ['vatId', 'USt-IdNr.'],
        ['taxNumber', 'Steuernummer'],
        ['registrationCourt', 'Registergericht'],
        ['registrationNumber', 'Registernummer']
    ];
    return (
        <form className="space-y-6" onSubmit={submitForm(form)}>
            <CommercePanel
                description="Diese Angaben werden für Rechnungen und rechtliche Checkout-Informationen verwendet."
                eyebrow="RECHNUNGSSTELLER"
                title="Firmendaten"
            >
                <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                    {merchantFields.map(([name, label, type = 'text', required = false]) => (
                        <NestedField
                            disabled={!canWrite}
                            form={form}
                            key={name}
                            label={label}
                            name={name}
                            required={required}
                            type={type}
                        />
                    ))}
                </div>
            </CommercePanel>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,.75fr)]">
                <CommercePanel
                    description="Globale Währung, Steuerdarstellung und Rechnungsnummern konfigurieren."
                    eyebrow="RECHNUNG & STEUERN"
                    title="Checkout-Grundlagen"
                >
                    <div className="p-5 sm:p-6">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <RootField disabled={!canWrite} form={form} label="Währung" name="currency" required />
                            <RootField disabled={!canWrite} form={form} label="Rechnungspräfix" name="invoicePrefix" required />
                            <RootField disabled={!canWrite} form={form} label="Standard-USt. in %" name="vatRate" typeRandom? name2="vatRate" type="number" />
                        </div>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            <RootToggle disabled={!canWrite} form={form} label="Preise enthalten Umsatzsteuer" name="pricesIncludeVat" />
                            <RootToggle disabled={!canWrite} form={form} label="Produktiven Checkout aktivieren" name="checkoutEnabled" />
                        </div>
                        <SaveBar canWrite={canWrite} form={form} message={message} />
                    </div>
                </CommercePanel>
                <CommercePanel className="h-fit" eyebrow="FREIGABEPRÜFUNG" title="Checkout-Status">
                    <div className="space-y-4 p-5 sm:p-6">
                        <StatusRow
                            detail={settings.checkoutOperational ? 'Store kann Zahlungen annehmen.' : 'Store nimmt noch keine produktiven Zahlungen an.'}
                            label="Betriebszustand"
                            ready={settings.checkoutOperational}
                        />
                        {(settings.missingRequirements || []).length ? (
                            <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[.05] p-4">
                                <b className="flex items-center gap-2 text-xs text-amber-200"><FaCircleExclamation /> Noch erforderlich</b>
                                <ul className="mt-3 space-y-2 text-[10px] text-amber-100/60">
                                    {settings.missingRequirements.map((item) => <li key={item}>• {item}</li>)}
                                </ul>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[.05] p-4 text-xs text-emerald-200">
                                <FaShieldHalved className="mr-2 inline" /> Alle Pflichtangaben sind vollständig.
                            </div>
                        )}
                    </div>
                </CommercePanel>
            </div>
        </form>
    );
}

function NestedField({ form, name, label, type, required, disabled }) {
    return (
        <form.Field name={'merchant.' + name}>
            {(field) => (
                <label className="admin-forum-field">
                    <span>{label}</span>
                    <input
                        className="admin-forum-input"
                        disabled={disabled}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        required={required}
                        type={type}
                        value={field.state.value || ''}
                    />
                </label>
            )}
        </form.Field>
    );
}

function Root(props) { return null; }

function Root2(props) { return null; }

function RootField({ form, name, label, type = 'text', required, disabled }) {
    return (
        <form.Field name={name}>
            {(field) => (
                <label className="admin-forum-field">
                    <span>{label}</span>
                    <input
                        className="admin-forum-input"
                        disabled={disabled}
                        min={type === 'number' ? 0 : undefined}
                        max={type === 'number' ? 100 : undefined}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        required={required}
                        step={type === 'number' ? '0.01' : undefined}
                        type={type}
                        value={field.state.value}
                    />
                </label>
            )}
        </form.Field>
    );
}

function RootToggle({ form, name, label, disabled }) {
    return (
        <form.Field name={name}>
            {(field) => (
                <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-white/[.06] bg-black/15 px-4 py-3 text-xs font-bold text-zinc-400">
                    <input
                        checked={Boolean(field.state.value)}
                        className="accent-orange-500"
                        disabled={disabled}
                        onChange={(event) => field.handleChange(event.target.checked)}
                        type="checkbox"
                    />
                    {label}
                </label>
            )}
        </form.Field>
    );
}

function SaveBar({ form, message, canWrite }) {
    return (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/[.05] pt-5">
            <span className="text-[10px] text-zinc-600">{message || (canWrite ? 'Änderungen werden revisionssicher protokolliert.' : 'Nur Leseberechtigung')}</span>
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

function StatusRow({ label, detail, ready }) {
    return (
        <div className="flex items-start gap-3 rounded-2xl border border-white/[.06] bg-black/15 p-4">
            <span className={'grid h-9 w-9 shrink-0 place-items-center rounded-xl ' + (ready ? 'bg-emerald-400/[.08] text-emerald-300' : 'bg-amber-400/[.08] text-amber-200')}>
                {ready ? <FaCircleCheck /> : <FaCircleExclamation />}
            </span>
            <div>
                <b className="block text-xs">{label}</b>
                <p className="mt-1 text-[10px] leading-4 text-zinc-600">{detail}</p>
            </div>
        </div>
    );
}

function settingsPayload(settings, overrides = {}) {
    return {
        checkoutEnabled: Boolean(settings.checkoutEnabled),
        currency: settings.currency || 'EUR',
        merchant: { ...EMPTY_MERCHANT, ...(settings.merchant || {}) },
        invoicePrefix: settings.invoicePrefix || 'SM',
        pricesIncludeVat: settings.pricesIncludeVat !== false,
        defaultVatRateBasisPoints: Number(settings.defaultVatRateBasisPoints) || 0,
        paymentMethods: (settings.paymentMethods || []).map(({ id, enabled, order }) => ({ id, enabled, order })),
        ...overrides
    };
}
function submitForm(form) {
    return (event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
    };
}

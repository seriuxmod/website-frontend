import { useEffect, useMemo, useState } from 'react';
import { FaArrowLeft, FaCircleInfo, FaCreditCard, FaFloppyDisk, FaLock } from 'react-icons/fa6';
import { Link, useNavigate } from 'react-router-dom';
import useStoreCart from '../../hooks/useStoreCart';
import { beginLogin, getAuthenticatedUser } from '../../lib/auth';
import { formatStorePrice, storeApi } from '../../lib/storeApi';

const emptyProfile = {
    email: '',
    address: {
        fullName: '',
        company: '',
        addressLine1: '',
        addressLine2: '',
        postalCode: '',
        city: '',
        region: '',
        countryCode: 'DE',
        vatId: ''
    }
};

export default function StoreCheckout() {
    const user = getAuthenticatedUser();
    const navigate = useNavigate();
    const cart = useStoreCart();
    const [state, setState] = useState({ loading: true, config: null, products: [], error: '' });
    const [profile, setProfile] = useState(emptyProfile);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [digitalContentConsent, setDigitalContentConsent] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        let active = true;
        const requests = [storeApi.config(), storeApi.products()];
        if (user) requests.push(storeApi.billingProfile());
        Promise.all(requests)
            .then(([config, products, billing]) => {
                if (!active) return;
                if (billing?.address)
                    setProfile({
                        email: billing.email || '',
                        address: { ...emptyProfile.address, ...billing.address }
                    });
                setState({ loading: false, config, products: products.products ?? [], error: '' });
            })
            .catch((error) => active && setState((current) => ({ ...current, loading: false, error: error.message })));
        return () => {
            active = false;
        };
    }, [user?.playerId]);

    const lines = useMemo(
        () =>
            cart.items
                .map((item) => ({ ...item, product: state.products.find((product) => product.id === item.productId) }))
                .filter((item) => item.product),
        [cart.items, state.products]
    );
    const total = lines.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0);

    const updateAddress = (field, value) =>
        setProfile((current) => ({ ...current, address: { ...current.address, [field]: value } }));
    const saveProfile = async () => {
        setSaving(true);
        setMessage('');
        try {
            await storeApi.updateBillingProfile(profile);
            setMessage('Rechnungsprofil gespeichert.');
            return true;
        } catch (error) {
            setMessage(error.message);
            return false;
        } finally {
            setSaving(false);
        }
    };
    const submit = async (event) => {
        event.preventDefault();
        if (!user) return beginLogin('/store/checkout');
        if (!state.config?.checkoutEnabled) return;
        setSaving(true);
        setMessage('');
        try {
            await storeApi.updateBillingProfile(profile);
            const order = await storeApi.createOrder({
                recipientUserId: null,
                products: cart.items,
                termsAccepted,
                digitalContentConsent
            });
            await storeApi.createPayment(order.id, state.config.paymentGateways[0]);
            cart.clear();
            navigate('/store/account', { state: { orderCreated: order.id } });
        } catch (error) {
            setMessage(error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#090a0d] px-4 pb-24 pt-32 text-white sm:px-6 sm:pt-36">
            <div className="mx-auto max-w-6xl">
                <Link
                    className="inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-orange-300"
                    to="/store"
                >
                    <FaArrowLeft /> Zurück zum Shop
                </Link>
                <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
                    <form className="forum-panel rounded-[30px] p-6 sm:p-9" onSubmit={submit}>
                        <p className="eyebrow">CHECKOUT</p>
                        <h1 className="mt-3 font-display text-4xl font-bold tracking-[-.045em]">Rechnungsdaten</h1>
                        <p className="mt-4 text-sm leading-7 text-zinc-500">
                            Diese Daten werden ausschließlich für Bestellabwicklung, Rechnung und steuerliche Nachweise
                            im Store-Service gespeichert.
                        </p>

                        {!user && (
                            <div className="mt-6 rounded-2xl border border-orange-500/15 bg-orange-500/[.06] p-5 text-sm text-zinc-300">
                                Melde dich zuerst mit deinem Minecraft-Account an.
                                <button
                                    type="button"
                                    className="forum-button-primary mt-4"
                                    onClick={() => beginLogin('/store/checkout')}
                                >
                                    Mit Minecraft anmelden
                                </button>
                            </div>
                        )}
                        {state.error && (
                            <p className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/[.06] p-4 text-sm text-red-200">
                                {state.error}
                            </p>
                        )}

                        <div className="mt-7 grid gap-5 sm:grid-cols-2">
                            <Field
                                label="Vollständiger Name"
                                value={profile.address.fullName}
                                onChange={(value) => updateAddress('fullName', value)}
                                required
                            />
                            <Field
                                label="Rechnungs-E-Mail"
                                type="email"
                                value={profile.email}
                                onChange={(value) => setProfile((current) => ({ ...current, email: value }))}
                                required
                            />
                            <Field
                                label="Firma (optional)"
                                value={profile.address.company}
                                onChange={(value) => updateAddress('company', value)}
                            />
                            <Field
                                label="USt-IdNr. (optional)"
                                value={profile.address.vatId}
                                onChange={(value) => updateAddress('vatId', value)}
                            />
                            <div className="sm:col-span-2">
                                <Field
                                    label="Straße und Hausnummer"
                                    value={profile.address.addressLine1}
                                    onChange={(value) => updateAddress('addressLine1', value)}
                                    required
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <Field
                                    label="Adresszusatz (optional)"
                                    value={profile.address.addressLine2}
                                    onChange={(value) => updateAddress('addressLine2', value)}
                                />
                            </div>
                            <Field
                                label="Postleitzahl"
                                value={profile.address.postalCode}
                                onChange={(value) => updateAddress('postalCode', value)}
                                required
                            />
                            <Field
                                label="Ort"
                                value={profile.address.city}
                                onChange={(value) => updateAddress('city', value)}
                                required
                            />
                            <Field
                                label="Bundesland/Region (optional)"
                                value={profile.address.region}
                                onChange={(value) => updateAddress('region', value)}
                            />
                            <label className="forum-label">
                                Land
                                <select
                                    className="forum-input"
                                    value={profile.address.countryCode}
                                    onChange={(event) => updateAddress('countryCode', event.target.value)}
                                >
                                    <option value="DE">Deutschland</option>
                                    <option value="AT">Österreich</option>
                                    <option value="CH">Schweiz</option>
                                    <option value="NL">Niederlande</option>
                                    <option value="BE">Belgien</option>
                                    <option value="FR">Frankreich</option>
                                    <option value="PL">Polen</option>
                                    <option value="GB">Vereinigtes Königreich</option>
                                    <option value="US">USA</option>
                                </select>
                            </label>
                        </div>

                        <button
                            type="button"
                            className="forum-button-secondary mt-6"
                            disabled={!user || saving}
                            onClick={saveProfile}
                        >
                            <FaFloppyDisk /> Rechnungsprofil speichern
                        </button>
                        {message && <p className="mt-4 text-sm text-zinc-400">{message}</p>}

                        <div className="mt-8 space-y-3 border-t border-white/[.06] pt-7">
                            <Consent checked={termsAccepted} onChange={setTermsAccepted}>
                                Ich akzeptiere die{' '}
                                <Link className="text-orange-300" to="/terms">
                                    AGB
                                </Link>{' '}
                                und habe die Widerrufsbelehrung gelesen.
                            </Consent>
                            <Consent checked={digitalContentConsent} onChange={setDigitalContentConsent}>
                                Ich stimme ausdrücklich zu, dass vor Ablauf der Widerrufsfrist mit der Bereitstellung
                                der digitalen Inhalte begonnen wird, und bestätige, dass ich dadurch mit Beginn der
                                Ausführung mein Widerrufsrecht verliere.
                            </Consent>
                        </div>
                    </form>

                    <aside className="forum-panel rounded-[28px] p-6 lg:sticky lg:top-28">
                        <p className="eyebrow">BESTELLÜBERSICHT</p>
                        <div className="mt-5 space-y-4">
                            {lines.map((line) => (
                                <div className="flex justify-between gap-4 text-sm" key={line.productId}>
                                    <span className="text-zinc-400">
                                        {line.quantity}× {line.product.name}
                                    </span>
                                    <b>
                                        {formatStorePrice(
                                            line.product.priceCents * line.quantity,
                                            line.product.currency
                                        )}
                                    </b>
                                </div>
                            ))}
                        </div>
                        {lines.length === 0 && !state.loading && (
                            <p className="mt-5 text-sm text-zinc-500">Dein Warenkorb ist leer.</p>
                        )}
                        <div className="mt-6 flex items-center justify-between border-t border-white/[.07] pt-5">
                            <b>Gesamtsumme</b>
                            <b className="font-display text-3xl">{formatStorePrice(total, state.config?.currency)}</b>
                        </div>
                        <p className="mt-3 text-[11px] leading-5 text-zinc-600">
                            Endpreis. Die konkrete steuerliche Aufschlüsselung wird vor Aktivierung des Bezahlvorgangs
                            konfiguriert.
                        </p>
                        {!state.config?.checkoutEnabled && (
                            <div className="mt-5 flex gap-3 rounded-2xl border border-amber-400/15 bg-amber-400/[.055] p-4 text-xs leading-5 text-amber-100/70">
                                <FaCircleInfo className="mt-0.5 shrink-0" /> Zahlung ist derzeit bewusst deaktiviert.
                                Dein Rechnungsprofil kannst du bereits speichern.
                            </div>
                        )}
                        <button
                            className="forum-button-primary mt-5 w-full"
                            disabled={
                                !user ||
                                saving ||
                                lines.length === 0 ||
                                !termsAccepted ||
                                !digitalContentConsent ||
                                !state.config?.checkoutEnabled
                            }
                        >
                            <FaCreditCard /> {saving ? 'Wird vorbereitet …' : 'Zahlungspflichtig bestellen'}
                        </button>
                        <p className="mt-4 flex items-center justify-center gap-2 text-[10px] text-zinc-600">
                            <FaLock /> Preise werden serverseitig erneut berechnet
                        </p>
                    </aside>
                </div>
            </div>
        </main>
    );
}

function Field({ label, value, onChange, type = 'text', required = false }) {
    return (
        <label className="forum-label">
            {label}
            <input
                className="forum-input"
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                required={required}
            />
        </label>
    );
}

function Consent({ checked, onChange, children }) {
    return (
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[.06] bg-black/10 p-4 text-xs leading-6 text-zinc-400">
            <input
                className="mt-1 accent-orange-500"
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
            />{' '}
            <span>{children}</span>
        </label>
    );
}

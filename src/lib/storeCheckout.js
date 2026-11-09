import { assertSessionGeneration, getSessionGeneration } from './auth.js';
import { storeApi } from './storeApi.js';

// A multi-RPC command must stay with the account that submitted the form at every step.
export async function submitStoreCheckout({ profile, order, paymentMethod }, api = storeApi) {
    const session = getSessionGeneration();
    if (!paymentMethod?.enabled || !paymentMethod.providerConfigured) throw new Error('Keine verfügbare Zahlungsmethode ausgewählt.');
    await api.updateBillingProfile(profile);
    assertSessionGeneration(session);
    const created = await api.createOrder(order);
    assertSessionGeneration(session);
    await api.createPayment(created.id, paymentMethod.provider, paymentMethod.id);
    assertSessionGeneration(session);
    return created;
}

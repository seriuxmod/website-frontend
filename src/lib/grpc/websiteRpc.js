import { createClient, Code, ConnectError } from '@connectrpc/connect';
import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { fromJson, toJson, ScalarType } from '@bufbuild/protobuf';
import { authenticatedFetch, getSessionGeneration } from '../auth.js';

const LONGS = new Set([ScalarType.INT64, ScalarType.UINT64, ScalarType.SINT64, ScalarType.FIXED64, ScalarType.SFIXED64]);
const scalar = (field, value, input, exactLongs) => {
    if (!LONGS.has(field.scalar)) return value;
    if (input) {
        if (typeof value === 'number' && !Number.isSafeInteger(value)) throw new Error('Ganzzahl liegt außerhalb des sicheren Zahlenbereichs.');
        return String(value);
    }
    if (exactLongs) return String(value);
    const number = Number(value);
    if (!Number.isSafeInteger(number)) throw new Error('Backend-Zahl liegt außerhalb des sicher darstellbaren Bereichs.');
    return number;
};
function enumValue(field, value, input) {
    const entry = field.enum.values.find(item => input
        ? item.name === value || item.jsonName === value || item.localName === value || item.number === value
        : item.name === value || item.jsonName === value || item.number === value);
    if (!entry) throw new Error(`Unbekannter Wert für ${field.enum.name}.`);
    return input ? entry.name : entry.localName;
}
// Only descriptor-declared types are transformed: never rewrite chat text, arbitrary maps or IDs.
export function websiteJson(schema, value, { input = false, exactLongs = false } = {}) {
    if (value == null) return value;
    if (schema.typeName === 'google.protobuf.Timestamp') {
        if (!input) return value;
        const date = value instanceof Date ? value : new Date(value);
        if (!Number.isFinite(date.getTime())) throw new Error('Ungültiger Zeitpunkt.');
        return date.toISOString();
    }
    if (schema.typeName === 'google.protobuf.Struct' || schema.typeName === 'google.protobuf.Value') return value;
    const result = {};
    for (const [name, item] of Object.entries(value)) {
        if (item === undefined) continue;
        const field = schema.fields.find(field => field.jsonName === name || field.name === name);
        if (!field) {
            if (input) throw new Error(`Nicht unterstütztes Feld ${schema.name}.${name}.`);
            continue;
        }
        if (item === null) { result[field.jsonName] = null; continue; }
        const transform = entry => field.message ? websiteJson(field.message, entry, { input, exactLongs })
            : field.enum ? enumValue(field, entry, input) : scalar(field, entry, input, exactLongs);
        result[field.jsonName] = field.fieldKind === 'list' ? item.map(transform)
            : field.fieldKind === 'map' ? Object.fromEntries(Object.entries(item).map(([key, entry]) => [key, transform(entry)]))
                : transform(item);
    }
    return result;
}

export function websiteError(reason) {
    const grpc = ConnectError.from(reason);
    if (grpc.code === Code.Canceled) { const error = new Error('Anfrage abgebrochen.'); error.name = 'AbortError'; error.code = grpc.code; return error; }
    const messages = {
        [Code.Unavailable]: 'Der Backend-Dienst ist derzeit nicht erreichbar. Bitte erneut versuchen.',
        [Code.DeadlineExceeded]: 'Ergebnis unklar: Zustand aktualisieren; Schreibaktion nicht blind wiederholen.',
        [Code.Unauthenticated]: 'Die Website-Sitzung ist nicht mehr gültig. Bitte erneut anmelden.',
        [Code.PermissionDenied]: 'Für diese Aktion fehlt die erforderliche Berechtigung.',
        [Code.Unimplemented]: 'Diese Funktion ist am angebundenen Backend noch nicht verfügbar.',
        [Code.ResourceExhausted]: 'Anfragegrenze erreicht. Bitte Eingabe begrenzen oder später erneut versuchen.'
    };
    const networkFailure = reason instanceof TypeError || grpc.cause instanceof TypeError;
    const error = new Error(networkFailure ? 'Der Backend-Dienst ist derzeit nicht erreichbar. Bei Schreibaktionen zuerst den Ergebniszustand prüfen.'
        : messages[grpc.code] || grpc.rawMessage || 'Die Backend-Anfrage ist fehlgeschlagen.');
    error.code = networkFailure ? Code.Unavailable : grpc.code;
    error.status = ({ [Code.NotFound]: 404, [Code.Unauthenticated]: 401, [Code.PermissionDenied]: 403,
        [Code.InvalidArgument]: 400, [Code.Aborted]: 409, [Code.FailedPrecondition]: 409, [Code.Unimplemented]: 501 })[grpc.code];
    return error;
}

export function createWebsiteRpc({ publicFetch = (...args) => fetch(...args), privateFetch = authenticatedFetch,
    baseUrl = 'https://rpc.seriuxmod.net' } = {}) {
    const transport = (fn, session) => createGrpcWebTransport({ baseUrl, defaultTimeoutMs: 15000,
        fetch: (url, init) => {
            if (session !== undefined && session !== getSessionGeneration()) throw new ConnectError('Website-Sitzung wurde gewechselt.', Code.Canceled);
            return fn(url, { ...init, credentials: 'omit', ...(fn === authenticatedFetch ? { retryUnauthorized: false, expectedSessionGeneration: session } : {}) });
        } });
    const publicTransport = transport(publicFetch);
    const publicClients = new Map();
    return async function rpc(service, method, request = {}, { signal, public: anonymous = false, exactLongs = false } = {}) {
        const descriptor = service.method[method];
        if (!descriptor || descriptor.methodKind !== 'unary') throw new Error('Nicht unterstützte Website-Methode.');
        const message = fromJson(descriptor.input, websiteJson(descriptor.input, request, { input: true }));
        const session = getSessionGeneration();
        if (anonymous && !publicClients.has(service)) publicClients.set(service, createClient(service, publicTransport));
        // Bind private fetch to THIS command's session, not a mutable last-caller global.
        const client = anonymous ? publicClients.get(service) : createClient(service, transport(privateFetch, session));
        try {
            const result = await client[method](message, { signal });
            if (!anonymous && session !== getSessionGeneration()) throw new ConnectError('Website-Sitzung wurde gewechselt.', Code.Canceled);
            return websiteJson(descriptor.output, toJson(descriptor.output, result, { alwaysEmitImplicit: true }), { exactLongs });
        } catch (reason) { throw websiteError(reason); }
    };
}
export const websiteRpc = createWebsiteRpc();

export function notImplemented(area) {
    const error = new Error(`${area}: Noch nicht implementiert – im aktuellen Backend existiert keine passende Fachschnittstelle.`);
    error.code = Code.Unimplemented; error.status = 501; return Promise.reject(error);
}
export const optional = value => value === '' || value == null ? undefined : value;
export const optionalBoolean = value => value === '' || value == null ? undefined : value === true || value === 'true' ? true
    : value === false || value === 'false' ? false : (() => { throw new Error('Ungültiger Wahrheitswert.'); })();
export function fields(value, allowed) {
    return Object.fromEntries(allowed.filter(key => Object.hasOwn(value, key)).map(key => [key, value[key]]));
}

import { createClient, Code, ConnectError } from '@connectrpc/connect';
import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { authenticatedFetch } from '../auth.js';
import { PublicUserService } from '../../gen/seriuxmod/user/v1/public_user_service_pb.js';
import { PermissionService } from '../../gen/seriuxmod/user/v1/permission_service_pb.js';
import { AccountSecurityService } from '../../gen/seriuxmod/user/v1/account_security_service_pb.js';
import { DeviceSessionService } from '../../gen/seriuxmod/auth/v1/device_session_service_pb.js';

const baseUrl = 'https://rpc.seriuxmod.net';
const privateTransport = createGrpcWebTransport({ baseUrl, defaultTimeoutMs: 15000,
    fetch: (input, init) => authenticatedFetch(input, { ...init, credentials: 'omit' }) });
const publicTransport = createGrpcWebTransport({ baseUrl, defaultTimeoutMs: 15000,
    fetch: (input, init) => fetch(input, { ...init, credentials: 'omit' }) });

export const publicUsers = createClient(PublicUserService, publicTransport);
export const permissions = createClient(PermissionService, privateTransport);
export const accountSecurity = createClient(AccountSecurityService, privateTransport);
export const deviceSessions = createClient(DeviceSessionService, privateTransport);

export function dateValue(timestamp) {
    if (!timestamp) return null;
    return new Date(Number(timestamp.seconds) * 1000 + timestamp.nanos / 1_000_000).toISOString();
}

export async function identityCall(action) {
    try { return await action(); }
    catch (reason) {
        const grpc = ConnectError.from(reason);
        if (grpc.code === Code.Canceled) {
            const error = new Error('Anfrage abgebrochen.'); error.name = 'AbortError'; throw error;
        }
        const messages = {
            [Code.Unavailable]: 'Der Identitätsdienst ist derzeit nicht erreichbar. Bitte erneut versuchen.',
            [Code.DeadlineExceeded]: 'Der Identitätsdienst antwortet nicht rechtzeitig. Bitte erneut versuchen.',
            [Code.Unauthenticated]: 'Die Website-Sitzung ist nicht mehr gültig. Bitte erneut anmelden.',
            [Code.PermissionDenied]: 'Für diese Aktion ist eine aktuelle Website-Anmeldung oder eine zusätzliche Bestätigung erforderlich.',
            [Code.ResourceExhausted]: 'Zu viele Anfragen. Bitte später erneut versuchen.'
        };
        const networkFailure = reason instanceof TypeError || grpc.cause instanceof TypeError;
        const error = new Error(networkFailure ? 'Der Identitätsdienst ist derzeit nicht erreichbar. Bitte erneut versuchen.'
            : messages[grpc.code] || grpc.rawMessage || 'Die Identitätsanfrage ist fehlgeschlagen.');
        error.code = grpc.code;
        error.status = ({ [Code.NotFound]: 404, [Code.Unauthenticated]: 401, [Code.PermissionDenied]: 403 })[grpc.code];
        throw error;
    }
}

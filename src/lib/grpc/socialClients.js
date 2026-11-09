import { createClient, Code, ConnectError } from '@connectrpc/connect';
import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { toJson } from '@bufbuild/protobuf';
import { authenticatedFetch } from '../auth.js';
import { SocialFriendService } from '../../gen/seriuxmod/social/v1/friend_service_pb.js';
import { ClanService, ClanPublicService } from '../../gen/seriuxmod/social/v1/clan_service_pb.js';
import { PartyService } from '../../gen/seriuxmod/social/v1/party_service_pb.js';
import { PresenceService } from '../../gen/seriuxmod/social/v1/presence_service_pb.js';
import { SocialNotificationService } from '../../gen/seriuxmod/social/v1/notification_service_pb.js';
import { SocialChatService } from '../../gen/seriuxmod/social/v1/chat_service_pb.js';
import { RealtimeService } from '../../gen/seriuxmod/realtime/v1/realtime_service_pb.js';
import { UserPresenceStatus } from '../../gen/seriuxmod/social/v1/presence_model_pb.js';

const baseUrl = 'https://rpc.seriuxmod.net';
const privateTransport = createGrpcWebTransport({ baseUrl, defaultTimeoutMs: 15000,
    fetch: (input, init) => authenticatedFetch(input, { ...init, credentials: 'omit' }) });
const publicTransport = createGrpcWebTransport({ baseUrl, defaultTimeoutMs: 15000,
    fetch: (input, init) => fetch(input, { ...init, credentials: 'omit' }) });
const privateClients = new Map(), publicClients = new Map();

// Only known enum fields are normalized. Chat text, names and arbitrary user
// content are never rewritten, parsed as markup or treated as executable data.
const enumFields = new Set(['status', 'type', 'source', 'action', 'preferredStatus', 'effectiveStatus', 'surfaces', 'connectedSurfaces']);
const enumPrefix = /^(USER_PRESENCE_STATUS_|PRESENCE_SURFACE_|ACTIVITY_SOURCE_|FRIEND_REQUEST_STATUS_|CLAN_INVITE_TYPE_|CLAN_INVITE_STATUS_|CLAN_MEMBER_STATUS_|CLAN_STATUS_|PARTY_STATUS_|PARTY_MEMBER_STATUS_|PARTY_INVITE_STATUS_|PARTY_ACTION_)/;
const numberFields = new Set(['totalElements', 'unreadCount', 'readThroughSequence', 'sequence', 'nextBeforeSequence', 'events']);
function normalize(value, key = '') {
    if (Array.isArray(value)) return value.map(item => normalize(item, key));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, normalize(item, name)]));
    if (typeof value === 'string' && enumFields.has(key)) return value.replace(enumPrefix, '');
    if (typeof value === 'string' && numberFields.has(key)) {
        const number = Number(value);
        if (!Number.isSafeInteger(number)) throw new Error('Social-Zähler liegt außerhalb des darstellbaren Bereichs.');
        return number;
    }
    return value;
}

function client(service, isPublic) {
    const clients = isPublic ? publicClients : privateClients;
    if (!clients.has(service)) clients.set(service, createClient(service, isPublic ? publicTransport : privateTransport));
    return clients.get(service);
}

export async function socialCall(action) {
    try { return await action(); }
    catch (reason) {
        const grpc = ConnectError.from(reason);
        const messages = {
            [Code.Unavailable]: 'Der Social-Dienst ist derzeit nicht erreichbar.',
            [Code.DeadlineExceeded]: 'Ergebnis unklar: Social-Zustand aktualisieren, Schreibaktion nicht blind wiederholen.',
            [Code.Unauthenticated]: 'Die Website-Sitzung ist nicht mehr gültig. Bitte erneut anmelden.',
            [Code.PermissionDenied]: 'Diese Social-Aktion ist nicht erlaubt.',
            [Code.ResourceExhausted]: 'Zu viele Social-Anfragen. Bitte später erneut versuchen.'
        };
        const error = new Error(messages[grpc.code] || grpc.rawMessage || 'Social-Anfrage fehlgeschlagen.');
        error.code = grpc.code;
        error.status = ({ [Code.NotFound]: 404, [Code.Unauthenticated]: 401, [Code.PermissionDenied]: 403 })[grpc.code];
        if (grpc.code === Code.Canceled) error.name = 'AbortError';
        throw error;
    }
}

const rpc = (service, method, request = {}, options = {}, isPublic = false) => socialCall(async () => {
    const result = await client(service, isPublic)[method](request, options);
    return normalize(toJson(service.method[method].output, result, { alwaysEmitImplicit: true }));
});
const items = promise => promise.then(value => value.items);
const clanId = clanId => ({ clanId });
function notification(value) {
    const bytes = Uint8Array.from(atob(value.body || ''), character => character.charCodeAt(0));
    let body = {};
    try { body = JSON.parse(new TextDecoder().decode(bytes)); } catch { /* Unknown version: topic remains readable. */ }
    return { ...value, body };
}

export const grpcSocial = {
    presence: {
        heartbeat: (signal) => rpc(PresenceService, 'heartbeat', {}, { signal }),
        mine: (signal) => rpc(PresenceService, 'getMyPresence', {}, { signal }),
        setStatus: status => {
            if (!['ONLINE', 'IDLE', 'DO_NOT_DISTURB', 'OFFLINE', 'INVISIBLE'].includes(status)) throw new Error('Ungültiger Benutzerstatus.');
            return rpc(PresenceService, 'setStatus', { status: UserPresenceStatus[status] });
        },
        public: (userId, days = 112, signal) => rpc(PresenceService, 'getPublicPresence', { userId, days }, { signal }, true),
        activity: (userId, signal) => rpc(PresenceService, 'getClientActivity', { userId }, { signal }).then(value => value.activity || null)
        // Browser cannot write gameplay context. Only the later game client can.
    },
    profiles: {
        friends: (userId, limit = 100, signal) => rpc(SocialFriendService, 'listPublicFriends', { userId, limit }, { signal }, true).then(value => value.friends)
    },
    friends: {
        list: signal => rpc(SocialFriendService, 'listFriends', {}, { signal }).then(value => value.friends),
        requests: signal => rpc(SocialFriendService, 'listIncomingRequests', {}, { signal }).then(value => value.requests),
        send: receiverUserId => rpc(SocialFriendService, 'sendFriendRequest', { receiverUserId }),
        accept: requestId => rpc(SocialFriendService, 'acceptFriendRequest', { requestId }),
        decline: requestId => rpc(SocialFriendService, 'declineFriendRequest', { requestId }),
        remove: friendUserId => rpc(SocialFriendService, 'removeFriend', { friendUserId })
    },
    parties: {
        overview: signal => rpc(PartyService, 'getMyPartyOverview', {}, { signal })
        // Intentionally no browser party mutations. Full controls belong in Client.
    },
    clans: {
        public: (query = '', page = 0, size = 20, signal) => rpc(ClanPublicService, 'listClans', { query, page, size }, { signal }, true),
        publicById: clan => rpc(ClanPublicService, 'getClan', clanId(clan), {}, true),
        publicMembers: clan => items(rpc(ClanPublicService, 'getMembers', clanId(clan), {}, true)),
        mine: signal => rpc(ClanService, 'getMyClan', {}, { signal }),
        create: body => rpc(ClanService, 'createClan', body),
        update: (clanId, clan) => rpc(ClanService, 'updateClan', { clanId, clan }),
        remove: clan => rpc(ClanService, 'deleteClan', clanId(clan)),
        leave: clan => rpc(ClanService, 'leaveClan', clanId(clan)),
        members: (clan, signal) => items(rpc(ClanService, 'getMembers', clanId(clan), { signal })),
        ranks: (clan, signal) => items(rpc(ClanService, 'getRanks', clanId(clan), { signal })),
        kick: (clanId, userId) => rpc(ClanService, 'kickMember', { clanId, userId }),
        changeRank: (clanId, userId, rankKey) => rpc(ClanService, 'changeMemberRank', { clanId, userId, rankKey }),
        createRank: (clanId, rank) => rpc(ClanService, 'createRank', { clanId, rank }),
        updateRank: (clanId, rankKey, rank) => rpc(ClanService, 'updateRank', { clanId, rankKey, rank }),
        invite: (clanId, userId) => rpc(ClanService, 'inviteUser', { clanId, userId }),
        requestJoin: clan => rpc(ClanService, 'requestJoin', clanId(clan)),
        invites: signal => items(rpc(ClanService, 'getMyInvites', {}, { signal })),
        requests: (clan, signal) => items(rpc(ClanService, 'getJoinRequests', clanId(clan), { signal })),
        acceptInvite: inviteId => rpc(ClanService, 'acceptInvite', { inviteId }),
        declineInvite: inviteId => rpc(ClanService, 'declineInvite', { inviteId })
    },
    notifications: {
        list: (page = 0, size = 25, unreadOnly = false, signal) => rpc(SocialNotificationService, 'listNotifications', { page, size, unreadOnly }, { signal })
            .then(value => ({ ...value, items: value.items.map(notification) })),
        read: notificationId => rpc(SocialNotificationService, 'markRead', { notificationId }).then(notification),
        readAll: () => rpc(SocialNotificationService, 'markAllRead')
    },
    chat: {
        conversations: (page = 0, size = 25, signal) => rpc(SocialChatService, 'listConversations', { page, size }, { signal }),
        messages: (peerUserId, beforeSequence, size = 50, signal) => rpc(SocialChatService, 'getMessages', { peerUserId, beforeSequence: beforeSequence == null ? undefined : BigInt(beforeSequence), size }, { signal }),
        send: (recipientUserId, text, clientMessageId) => rpc(SocialChatService, 'sendMessage', { recipientUserId, text, clientMessageId }),
        read: (peerUserId, throughSequence) => rpc(SocialChatService, 'markRead', { peerUserId, throughSequence: BigInt(throughSequence) })
    }
};

export const watchSocial = (signal) => client(RealtimeService, false).watch({ socialEvents: true, userEvents: true, permissionEvents: true },
    { signal, timeoutMs: 0 });

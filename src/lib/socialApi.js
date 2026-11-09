import { grpcSocial } from './grpc/socialClients.js';
import { SocialFriendAdminService } from '../gen/seriuxmod/social/v1/friend_service_pb.js';
import { ClanAdminService } from '../gen/seriuxmod/social/v1/clan_service_pb.js';
import { PartyAdminService } from '../gen/seriuxmod/social/v1/party_service_pb.js';
import { SocialAuditAdminService } from '../gen/seriuxmod/social/v1/social_audit_service_pb.js';
import { PublicServerService, PublicServerAdminService } from '../gen/seriuxmod/social/v1/public_server_service_pb.js';
import { websiteRpc as rpc, optional, fields } from './grpc/websiteRpc.js';

const friends = (method, request) => rpc(SocialFriendAdminService, method, request);
const clans = (method, request) => rpc(ClanAdminService, method, request);
const parties = (method, request) => rpc(PartyAdminService, method, request);
const servers = (method, request) => rpc(PublicServerAdminService, method, request);
const page = ({ q = '', status = '', page = 0, size = 25 } = {}) => ({ query: optional(q), status: optional(status), page, size });
const serverWrite = body => fields(body, ['name', 'address', 'websiteUrl', 'iconUrl', 'bannerUrl', 'description', 'category', 'tags',
    'supportedVersions', 'onlinePlayers', 'maxPlayers', 'featured', 'sortOrder']);

export const socialApi = {
    ...grpcSocial,
    servers: {
        list: ({ q = '', category = '', page = 0, size = 24 } = {}, signal) => rpc(PublicServerService, 'listServers', {
            query: optional(q), category: optional(category), page, size
        }, { public: true, signal }),
        get: (serverId, signal) => rpc(PublicServerService, 'getServer', { serverId }, { public: true, signal })
    },
    admin: {
        friendsOverview: () => friends('getOverview'),
        friendships: ({ q = '', page = 0, size = 25 } = {}) => friends('listFriendships', { query: optional(q), page, size }),
        friendship: friendshipId => friends('getFriendship', { friendshipId }),
        removeFriendship: (friendshipId, reason) => friends('removeFriendship', { friendshipId, reason }),
        friendRequests: options => friends('listFriendRequests', page(options)),
        updateFriendRequest: (requestId, status, reason) => friends('updateFriendRequestStatus', { requestId, status, reason }),
        clansOverview: () => clans('getOverview'),
        clans: options => clans('listClans', page(options)),
        clan: clanId => clans('getClan', { clanId }),
        updateClanStatus: (clanId, status, reason = '') => clans('updateClanStatus', { clanId, status, reason: optional(reason) }),
        partiesOverview: () => parties('getOverview'),
        parties: options => parties('listParties', page(options)),
        party: partyId => parties('getParty', { partyId }),
        disbandParty: (partyId, reason) => parties('disbandParty', { partyId, reason }),
        auditLogs: ({ q = '', action = '', entityType = '', page = 0, size = 25 } = {}) => rpc(SocialAuditAdminService, 'listAudits', {
            query: optional(q), action: optional(action), entityType: optional(entityType), page, size
        }),
        serversOverview: () => servers('getOverview'),
        servers: ({ q = '', category = '', status = '', page = 0, size = 25 } = {}) => servers('listServers', {
            query: optional(q), category: optional(category), status: optional(status), page, size
        }),
        server: serverId => servers('getServer', { serverId }),
        saveServer: (serverId, body) => serverId ? servers('updateServer', { serverId, server: serverWrite(body) }) : servers('createServer', serverWrite(body)),
        updateServerStatus: (serverId, status, reviewNote = '') => servers('updateServerStatus', { serverId, status, reviewNote: optional(reviewNote) }),
        deleteServer: (serverId, reason) => servers('deleteServer', { serverId, reason })
    }
};

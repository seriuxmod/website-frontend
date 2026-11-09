import test from 'node:test';
import assert from 'node:assert/strict';
import { installPeer } from './grpc-peer.mjs';
import { socialApi as api } from '../src/lib/socialApi.js';
import { SocialFriendAdminService as Friend } from '../src/gen/seriuxmod/social/v1/friend_service_pb.js';
import { ClanAdminService as Clan } from '../src/gen/seriuxmod/social/v1/clan_service_pb.js';
import { PartyAdminService as Party } from '../src/gen/seriuxmod/social/v1/party_service_pb.js';
import { PublicServerService as PublicServer, PublicServerAdminService as Server } from '../src/gen/seriuxmod/social/v1/public_server_service_pb.js';
import { SocialAuditAdminService as Audit } from '../src/gen/seriuxmod/social/v1/social_audit_service_pb.js';

test('Social administration maps all friend/clan/party/audit commands without exposing end-user gameplay writes', async () => {
    const p = installPeer(), a = api.admin;
    try {
        await p.call(Friend, 'getOverview', {}, a.friendsOverview);
        const friends = await p.call(Friend, 'listFriendships', { page: 1, size: 25, query: 'Test' }, () => a.friendships({ page: 1, q: 'Test' }), { totalElements: 29n, totalPages: 2, items: [{ firstUser: { username: 'Synthetic' } }] });
        assert.equal(friends.totalElements, 29); assert.equal(friends.items[0].firstUser.username, 'Synthetic');
        await p.call(Friend, 'getFriendship', { friendshipId: 'f' }, () => a.friendship('f'));
        await p.call(Friend, 'removeFriendship', { friendshipId: 'f', reason: 'Synthetic' }, () => a.removeFriendship('f', 'Synthetic'));
        await p.call(Friend, 'listFriendRequests', { page: 0, size: 25, status: 1 }, () => a.friendRequests({ status: 'PENDING' }));
        assert.equal((await p.call(Friend, 'updateFriendRequestStatus', { requestId: 'r', status: 3, reason: 'Synthetic' }, () => a.updateFriendRequest('r', 'DECLINED', 'Synthetic'), { status: 3 })).status, 'DECLINED');
        await p.call(Clan, 'getOverview', {}, a.clansOverview);
        await p.call(Clan, 'listClans', { page: 0, size: 25, query: 'Test', status: 1 }, () => a.clans({ q: 'Test', status: 'ACTIVE' }));
        await p.call(Clan, 'getClan', { clanId: 'c' }, () => a.clan('c'));
        await p.call(Clan, 'updateClanStatus', { clanId: 'c', status: 2, reason: 'Synthetic' }, () => a.updateClanStatus('c', 'DISABLED', 'Synthetic'));
        await p.call(Party, 'getOverview', {}, a.partiesOverview);
        await p.call(Party, 'listParties', { page: 0, size: 25, status: 1 }, () => a.parties({ status: 'ACTIVE' }));
        await p.call(Party, 'getParty', { partyId: 'p' }, () => a.party('p'));
        await p.call(Party, 'disbandParty', { partyId: 'p', reason: 'Synthetic' }, () => a.disbandParty('p', 'Synthetic'));
        const audits = await p.call(Audit, 'listAudits', { page: 0, size: 25, query: 'Test', action: 1, entityType: 'FRIENDSHIP' }, () => a.auditLogs({ q: 'Test', action: 'FRIENDSHIP_REMOVED', entityType: 'FRIENDSHIP' }),
            { items: [{ action: 1, details: { reason: 'SOCIAL_AUDIT_ACTION_SERVER_CREATED' } }] });
        assert.equal(audits.items[0].details.reason, 'SOCIAL_AUDIT_ACTION_SERVER_CREATED');
        assert.deepEqual(Object.keys(api.parties), ['overview'], 'end-user Party remains read-only');
    } finally { p.restore(); }
});

test('server discovery is anonymous and distinguishes omitted population from a real zero; admin metadata remains private', async () => {
    const p = installPeer(), a = api.admin;
    try {
        const page = await p.call(PublicServer, 'listServers', { page: 0, size: 24, query: 'Test', category: 'Survival' }, () => api.servers.list({ q: 'Test', category: 'Survival' }),
            { items: [{ id: 'unknown', name: 'SyntheticUnknown' }, { id: 'zero', name: 'SyntheticZero', onlinePlayers: 0, maxPlayers: 20 }], totalElements: 2n }, { public: true });
        assert.equal(page.items[0].onlinePlayers, undefined); assert.equal(page.items[1].onlinePlayers, 0);
        assert.ok(!Object.hasOwn(page.items[0], 'submittedBy')); assert.ok(!Object.hasOwn(page.items[0], 'reviewNote'));
        await p.call(PublicServer, 'getServer', { serverId: 's' }, () => api.servers.get('s'), {}, { public: true });
        await p.call(Server, 'getOverview', {}, a.serversOverview);
        await p.call(Server, 'listServers', { page: 0, size: 25, status: 2 }, () => a.servers({ status: 'PENDING_REVIEW' }));
        await p.call(Server, 'getServer', { serverId: 's' }, () => a.server('s'));
        const body = { name: 'Synthetic', address: 'play.example.invalid', category: 'Survival', tags: [], supportedVersions: [], featured: false, onlinePlayers: null, maxPlayers: 20 };
        await p.call(Server, 'createServer', body, () => a.saveServer(null, body));
        await p.call(Server, 'updateServer', { serverId: 's', server: body }, () => a.saveServer('s', body));
        await p.call(Server, 'updateServerStatus', { serverId: 's', status: 3, reviewNote: 'Synthetic' }, () => a.updateServerStatus('s', 'APPROVED', 'Synthetic'));
        await p.call(Server, 'deleteServer', { serverId: 's', reason: 'Synthetic' }, () => a.deleteServer('s', 'Synthetic'));
    } finally { p.restore(); }
});

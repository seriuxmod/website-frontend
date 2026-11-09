import { AdminPlayerService } from '../gen/seriuxmod/user/v1/admin_player_service_pb.js';
import { AdminPermissionService } from '../gen/seriuxmod/user/v1/admin_permission_service_pb.js';
import { UserAccountService } from '../gen/seriuxmod/user/v1/user_service_pb.js';
import { websiteRpc as rpc, optional, optionalBoolean, fields, notImplemented } from './grpc/websiteRpc.js';

const groupWrite = body => fields(body, ['key', 'displayName', 'description', 'badgeUrl', 'permissions', 'color', 'defaultGroup', 'priority', 'version']);
const unavailable = () => notImplemented('Ban-/Mute-Fallverwaltung');
export const userAdminApi = {
    overview: () => rpc(UserAccountService, 'getAdminOverview'),
    dashboardOverview: () => rpc(UserAccountService, 'getAdminOverview'),
    playersOverview: (days = 30) => rpc(AdminPlayerService, 'getOverview', { days }),
    players: ({ q = '', locked, websiteAccessEnabled, twoFactorEnabled, groupKey = '', page = 0, size = 30,
        sort = 'createdDate', direction = 'desc' } = {}) => rpc(AdminPlayerService, 'listPlayers', {
        query: optional(q), locked: optionalBoolean(locked), websiteAccessEnabled: optionalBoolean(websiteAccessEnabled),
        twoFactorEnabled: optionalBoolean(twoFactorEnabled), groupKey: optional(groupKey), page, size, sort, direction
    }),
    player: userId => rpc(AdminPlayerService, 'getPlayer', { userId }),
    playerAudits: (userId, page = 0, size = 30) => rpc(AdminPlayerService, 'listAudits', { userId, page, size }),
    // Account access restriction only. Never substitute for a Minecraft ban or chat mute.
    setPlayerLocked: (userId, locked, reason = '') => locked
        ? rpc(UserAccountService, 'lockAccount', { userId, userMessage: reason })
        : rpc(UserAccountService, 'unlockAccount', { userId, reason: optional(reason) }),
    setDirectPermissions: (userId, permissions) => rpc(AdminPlayerService, 'setDirectPermissions', { userId, permissions }),
    assignGroup: (userId, assignment) => rpc(AdminPlayerService, 'assignGroup', {
        ...fields(assignment, ['groupKey', 'startsAt', 'expiresAt', 'source', 'sourceReference']), userId
    }),
    removeGroup: (userId, groupKey) => rpc(AdminPlayerService, 'removeGroup', { userId, groupKey }),
    permissionsOverview: () => rpc(AdminPermissionService, 'getOverview'),
    permissionGroups: () => rpc(AdminPermissionService, 'listGroups').then(value => value.groups),
    permissionGroup: key => rpc(AdminPermissionService, 'getGroup', { key }),
    permissionCatalog: () => rpc(AdminPermissionService, 'listCatalog').then(value => value.entries),
    createPermissionGroup: group => rpc(AdminPermissionService, 'createGroup', { group: groupWrite(group) }),
    updatePermissionGroup: (key, group) => rpc(AdminPermissionService, 'updateGroup', { key, group: groupWrite(group) }),
    deletePermissionGroup: (key, version) => rpc(AdminPermissionService, 'deleteGroup', { key, version }),
    moderationOverview: unavailable,
    bans: unavailable, banCase: unavailable, banCaseHistory: unavailable, createBan: unavailable, revokeBan: unavailable,
    mutes: unavailable, muteCase: unavailable, muteCaseHistory: unavailable, createMute: unavailable, revokeMute: unavailable,
    moderationAudit: unavailable, moderationSettings: unavailable,
    saveBanReason: unavailable, saveMuteReason: unavailable, deleteBanReason: unavailable, deleteMuteReason: unavailable
};

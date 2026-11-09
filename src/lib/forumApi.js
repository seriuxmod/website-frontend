import { ForumService } from '../gen/seriuxmod/forum/v1/forum_service_pb.js';
import { ForumAdminService } from '../gen/seriuxmod/forum/v1/forum_admin_service_pb.js';
import { TranslationAdminService } from '../gen/seriuxmod/forum/v1/translation_service_pb.js';
import { PermissionService } from '../gen/seriuxmod/user/v1/permission_service_pb.js';
import { userApi } from './userApi.js';
import { websiteRpc as rpc, optional, fields } from './grpc/websiteRpc.js';

// Optional authenticated reads retain existing forum group visibility; no token means guest.
const forum = (method, request) => rpc(ForumService, method, request);
const admin = (method, request) => rpc(ForumAdminService, method, request);
const translations = (method, request) => rpc(TranslationAdminService, method, request);
const nodeWrite = body => fields(body, ['type', 'parentId', 'order', 'title', 'description', 'icon', 'displayAsNews', 'redirect', 'redirectUrl', 'hookIds', 'deleted']);
const permissionWrite = body => fields(body, ['groupId', 'view', 'viewOtherTopics', 'createTopic', 'createPost', 'editTopic', 'editPost',
    'deleteTopic', 'deletePost', 'lock', 'stick', 'move', 'merge', 'react', 'report']);
const localeWrite = body => fields(body, ['code', 'displayName', 'nativeName', 'fallbackLocale', 'enabled', 'defaultLocale', 'sortOrder']);
const entryWrite = body => fields(body, ['key', 'namespace', 'description', 'values']);

export const forumApi = {
    tree: () => forum('getTree'),
    latest: (page = 0, size = 10) => forum('listLatestTopics', { page, size }),
    forum: forumId => forum('getForum', { forumId }),
    topics: (forumId, page = 0, size = 20, labelId = '') => forum('listTopics', { forumId, page, size, labelId: optional(labelId) }),
    topic: (topicId, incrementViews = true) => forum('getTopic', { topicId, incrementViews }),
    posts: (topicId, page = 0, size = 20) => forum('listPosts', { topicId, page, size }),
    labels: forumId => forum('listLabels', { forumId: optional(forumId) }).then(value => value.items),
    search: query => forum('search', { query, topicsLimit: 30, postsLimit: 30 }),
    createTopic: (forumId, body) => forum('createTopic', { ...fields(body, ['title', 'content', 'labelId']), forumId }),
    reply: (topicId, content) => forum('createReply', { topicId, content }),
    updateTopic: (topicId, body) => forum('patchTopic', { topicId, ...fields(body, ['title']), ...(Object.hasOwn(body, 'labelId') ? { labelId: body.labelId ?? '' } : {}) }),
    updatePost: (postId, content) => forum('patchPost', { postId, content }),
    deleteTopic: topicId => forum('deleteTopic', { topicId }),
    deletePost: postId => forum('deletePost', { postId }),
    lockTopic: (topicId, locked) => forum(locked ? 'lockTopic' : 'unlockTopic', { topicId }),
    stickTopic: (topicId, sticky) => forum(sticky ? 'stickTopic' : 'unstickTopic', { topicId }),
    moveTopic: (topicId, targetForumId) => forum('moveTopic', { topicId, targetForumId }),
    mergeTopic: (topicId, targetTopicId) => forum('mergeTopic', { topicId, targetTopicId }),
    react: (postId, reactionId) => forum('reactToPost', { postId, reactionId }),
    unreact: (postId, reactionId) => forum('removePostReaction', { postId, reactionId }),
    toggleFollow: topicId => forum('toggleFollow', { topicId }),
    following: (page = 0, size = 20) => forum('listFollowing', { page, size }),
    unfollowAll: () => forum('removeAllFollows'),
    markTopicRead: topicId => forum('markTopicRead', { topicId }),
    preferences: () => forum('getPreferences'),
    updatePreferences: body => forum('patchPreferences', fields(body, ['autoFollowCreatedTopics', 'autoFollowRepliedTopics', 'notifyOnFollowedTopicReply', 'notifyOnReaction', 'topicsPerPage', 'postsPerPage'])),
    notifications: (page = 0, size = 20, unreadOnly = false) => forum('listNotifications', { page, size, unreadOnly }),
    unreadCount: () => forum('getUnreadCount'),
    markNotificationRead: notificationId => forum('markNotificationRead', { notificationId }),
    markAllNotificationsRead: () => forum('markAllNotificationsRead'),
    userProfile: (userId, recentLimit = 8) => forum('getUserProfile', { userId, recentLimit }),
    report: body => forum('createReport', fields(body, ['targetType', 'targetId', 'reason'])),
    admin: {
        analytics: (days = 30) => admin('getAnalytics', { days }),
        auditLogs: (page = 0, size = 25) => admin('listAuditLogs', { page, size }),
        nodes: () => admin('listNodes'),
        createNode: body => admin('createNode', nodeWrite(body)),
        updateNode: (nodeId, body) => admin('updateNode', { nodeId, node: nodeWrite(body) }),
        deleteNode: nodeId => admin('deleteNode', { nodeId }),
        permissions: forumId => admin('listGroupPermissions', { forumId }).then(value => value.permissions),
        permissionMatrix: () => admin('getPermissionMatrix'),
        savePermission: (forumId, body) => admin('upsertGroupPermission', { forumId, permission: permissionWrite(body) }),
        deletePermission: (forumId, groupId) => admin('deleteGroupPermission', { forumId, groupId }),
        settings: () => admin('getSettings'),
        saveSettings: body => admin('patchSettings', {
            ...fields(body, ['reactionsEnabled', 'maxTopicTitleLength', 'maxPostLength']),
            ...(Object.hasOwn(body, 'bannedTerms') ? { bannedTerms: { values: body.bannedTerms ?? [] } } : {})
        }),
        labels: (includeDeleted = false) => admin('listTopicLabels', { includeDeleted }).then(value => value.items),
        labelTypes: (includeDeleted = false) => admin('listLabelTypes', { includeDeleted }).then(value => value.items),
        saveLabelType: (typeId, body) => admin('upsertLabelType', { typeId, labelType: fields(body, ['name', 'htmlTemplate', 'deleted']) }),
        deleteLabelType: typeId => admin('deleteLabelType', { typeId }),
        saveLabel: (labelId, body) => admin('upsertTopicLabel', { labelId, label: fields(body, ['name', 'labelTypeId', 'forumIds', 'groupIds', 'deleted']) }),
        deleteLabel: labelId => admin('deleteTopicLabel', { labelId }),
        reports: (page = 0, size = 20, status = '') => admin('listReports', { page, size, status: optional(status) }),
        report: reportId => admin('getReport', { reportId }),
        updateReport: (reportId, body) => admin('updateReport', { reportId, update: typeof body === 'string' ? { status: body }
            : Object.fromEntries(Object.entries(fields(body, ['status', 'assignedToUserId', 'moderatorNote'])).map(([key, value]) => [key, value ?? ''])) }),
        translationsOverview: () => translations('getOverview'),
        translationLocales: () => translations('listLocales').then(value => value.items),
        saveTranslationLocale: (code, body) => code ? translations('updateLocale', { code, locale: localeWrite(body) }) : translations('createLocale', localeWrite(body)),
        disableTranslationLocale: code => translations('disableLocale', { code }),
        translationEntries: ({ q = '', namespace = '', status = '', page = 0, size = 50 } = {}) => translations('listEntries', {
            query: optional(q), namespace: optional(namespace), status: optional(status), page, size
        }),
        translationEntry: id => translations('getEntry', { id }),
        saveTranslationEntry: (id, body) => id ? translations('updateEntry', { id, entry: entryWrite(body) }) : translations('createEntry', entryWrite(body)),
        setTranslationStatus: (id, status) => translations('updateEntryStatus', { id, status }),
        archiveTranslationEntry: id => translations('archiveEntry', { id })
    }
};

const profileCache = new Map();
const unavailableProfile = playerId => ({ playerId, username: 'Profil nicht verfügbar', rank: null, unavailable: true,
    avatarUrl: `https://mc-heads.net/avatar/${encodeURIComponent(playerId || 'Steve')}/128` });
export async function getPublicUser(playerId) {
    if (!playerId) return unavailableProfile('');
    if (profileCache.has(playerId)) return profileCache.get(playerId);
    const pending = userApi.byId(playerId).then(profile => {
        if (!profile) throw new Error('Profil nicht verfügbar');
        return { ...profile, avatarUrl: `https://mc-heads.net/avatar/${encodeURIComponent(profile.playerId || playerId)}/128` };
    }).catch(() => { profileCache.delete(playerId); return unavailableProfile(playerId); });
    if (profileCache.size >= 128) profileCache.delete(profileCache.keys().next().value);
    profileCache.set(playerId, pending); return pending;
}
export const getPermissionGroups = () => rpc(PermissionService, 'listGroups').then(value => value.groups);

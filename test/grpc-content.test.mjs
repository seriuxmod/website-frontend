import test from 'node:test';
import assert from 'node:assert/strict';
import { installPeer } from './grpc-peer.mjs';
import { forumApi as api, getPermissionGroups } from '../src/lib/forumApi.js';
import { blogApi, suggestionsApi } from '../src/lib/communityApi.js';
import { ForumService as Forum } from '../src/gen/seriuxmod/forum/v1/forum_service_pb.js';
import { ForumAdminService as Admin } from '../src/gen/seriuxmod/forum/v1/forum_admin_service_pb.js';
import { TranslationAdminService as Translation } from '../src/gen/seriuxmod/forum/v1/translation_service_pb.js';
import { BlogService as Blog, BlogAdminService as BlogAdmin } from '../src/gen/seriuxmod/forum/v1/blog_service_pb.js';
import { SuggestionService as Suggestion, SuggestionAdminService as SuggestionAdmin } from '../src/gen/seriuxmod/forum/v1/suggestion_service_pb.js';
import { PermissionService } from '../src/gen/seriuxmod/user/v1/permission_service_pb.js';

test('Forum reads preserve guest/group visibility, totals, labels, per-user projections and literal reaction maps', async () => {
    const p = installPeer();
    try {
        p.storage.clear();
        assert.deepEqual((await p.call(Forum, 'getTree', {}, api.tree, { nodes: [{ id: 'f', type: 2, title: 'Synthetic' }] })).nodes[0].type, 'FORUM');
        await p.call(Forum, 'getForum', { forumId: 'f' }, () => api.forum('f'));
        const page = await p.call(Forum, 'listTopics', { forumId: 'f', page: 1, size: 20, labelId: 'l' }, () => api.topics('f', 1, 20, 'l'), { total: 37n });
        assert.equal(page.total, 37);
        await p.call(Forum, 'listLatestTopics', { page: 0, size: 10 }, api.latest);
        await p.call(Forum, 'getTopic', { topicId: 't', incrementViews: false }, () => api.topic('t', false));
        const posts = await p.call(Forum, 'listPosts', { topicId: 't', page: 0, size: 20 }, () => api.posts('t'), { items: [{ id: 'p', content: 'FORUM_REPORT_STATUS_OPEN', reactionCounts: { literal: 9n }, reactedByMe: true }] });
        assert.deepEqual(posts.items[0].reactionCounts, { literal: 9 }); assert.equal(posts.items[0].content, 'FORUM_REPORT_STATUS_OPEN');
        assert.deepEqual(await p.call(Forum, 'listLabels', { forumId: 'f' }, () => api.labels('f'), { items: [{ id: 'l', name: 'Synthetic' }] }), [{ id: 'l', name: 'Synthetic', labelTypeId: '' }]);
        await p.call(Forum, 'search', { query: 'literal', topicsLimit: 30, postsLimit: 30 }, () => api.search('literal'));
        await p.call(Forum, 'getUserProfile', { userId: 'u', recentLimit: 8 }, () => api.userProfile('u'));
        assert.deepEqual(await p.call(PermissionService, 'listGroups', {}, getPermissionGroups, { groups: [] }), []);
    } finally { p.restore(); }
});

test('Forum commands use explicit canonical RPCs, preserving optional omission versus clearing labels and preferences', async () => {
    const p = installPeer();
    try {
        const cases = [
            ['createTopic', { forumId: 'f', title: 'Synthetic', content: '<script>literal</script>', labelId: 'l' }, () => api.createTopic('f', { title: 'Synthetic', content: '<script>literal</script>', labelId: 'l' })],
            ['createReply', { topicId: 't', content: 'literal' }, () => api.reply('t', 'literal')],
            ['patchTopic', { topicId: 't', title: 'new' }, () => api.updateTopic('t', { title: 'new' })],
            ['patchTopic', { topicId: 't', labelId: '' }, () => api.updateTopic('t', { labelId: null })],
            ['patchPost', { postId: 'p', content: 'new' }, () => api.updatePost('p', 'new')],
            ['deleteTopic', { topicId: 't' }, () => api.deleteTopic('t')],
            ['deletePost', { postId: 'p' }, () => api.deletePost('p')],
            ['lockTopic', { topicId: 't' }, () => api.lockTopic('t', true)],
            ['unlockTopic', { topicId: 't' }, () => api.lockTopic('t', false)],
            ['stickTopic', { topicId: 't' }, () => api.stickTopic('t', true)],
            ['unstickTopic', { topicId: 't' }, () => api.stickTopic('t', false)],
            ['moveTopic', { topicId: 't', targetForumId: 'f2' }, () => api.moveTopic('t', 'f2')],
            ['mergeTopic', { topicId: 't', targetTopicId: 't2' }, () => api.mergeTopic('t', 't2')],
            ['reactToPost', { postId: 'p', reactionId: 'like' }, () => api.react('p', 'like')],
            ['removePostReaction', { postId: 'p', reactionId: 'like' }, () => api.unreact('p', 'like')],
            ['toggleFollow', { topicId: 't' }, () => api.toggleFollow('t')],
            ['listFollowing', { page: 0, size: 20 }, api.following],
            ['removeAllFollows', {}, api.unfollowAll],
            ['markTopicRead', { topicId: 't' }, () => api.markTopicRead('t')],
            ['getPreferences', {}, api.preferences],
            ['patchPreferences', { autoFollowCreatedTopics: false, topicsPerPage: 10 }, () => api.updatePreferences({ autoFollowCreatedTopics: false, topicsPerPage: 10 })],
            ['listNotifications', { page: 0, size: 20, unreadOnly: false }, api.notifications],
            ['getUnreadCount', {}, api.unreadCount],
            ['markNotificationRead', { notificationId: 'n' }, () => api.markNotificationRead('n')],
            ['markAllNotificationsRead', {}, api.markAllNotificationsRead],
            ['createReport', { targetType: 2, targetId: 'p', reason: 'Synthetic' }, () => api.report({ targetType: 'POST', targetId: 'p', reason: 'Synthetic' })]
        ];
        for (const [method, raw, action] of cases) await p.call(Forum, method, raw, action);
        assert.equal(p.paths.length, cases.length);
    } finally { p.restore(); }
});

test('Forum administration and translation adapters retain native report totals, enum states and clear-list/map semantics', async () => {
    const p = installPeer(), a = api.admin;
    try {
        await p.call(Admin, 'getAnalytics', { days: 7 }, () => a.analytics(7));
        await p.call(Admin, 'listAuditLogs', { page: 0, size: 25 }, a.auditLogs);
        await p.call(Admin, 'listNodes', {}, a.nodes);
        const node = { type: 2, title: 'Synthetic', parentId: '', redirect: false, hookIds: [] };
        await p.call(Admin, 'createNode', node, () => a.createNode({ ...node, type: 'FORUM' }));
        await p.call(Admin, 'updateNode', { nodeId: 'f', node }, () => a.updateNode('f', { ...node, type: 'FORUM' }));
        await p.call(Admin, 'deleteNode', { nodeId: 'f' }, () => a.deleteNode('f'));
        assert.deepEqual(await p.call(Admin, 'listGroupPermissions', { forumId: 'f' }, () => a.permissions('f'), { permissions: [] }), []);
        await p.call(Admin, 'getPermissionMatrix', {}, a.permissionMatrix);
        await p.call(Admin, 'upsertGroupPermission', { forumId: 'f', permission: { groupId: 'g', view: false, createPost: true } }, () => a.savePermission('f', { groupId: 'g', view: false, createPost: true }));
        await p.call(Admin, 'deleteGroupPermission', { forumId: 'f', groupId: 'g' }, () => a.deletePermission('f', 'g'));
        await p.call(Admin, 'getSettings', {}, a.settings);
        await p.call(Admin, 'patchSettings', { reactionsEnabled: false, bannedTerms: { values: [] } }, () => a.saveSettings({ reactionsEnabled: false, bannedTerms: [] }));
        await p.call(Admin, 'patchSettings', { maxPostLength: 3000 }, () => a.saveSettings({ maxPostLength: 3000 }));
        assert.deepEqual(await p.call(Admin, 'listTopicLabels', { includeDeleted: true }, () => a.labels(true), { items: [] }), []);
        assert.deepEqual(await p.call(Admin, 'listLabelTypes', { includeDeleted: false }, a.labelTypes, { items: [] }), []);
        await p.call(Admin, 'upsertLabelType', { typeId: 'new', labelType: { name: 'Synthetic', htmlTemplate: '<b>literal</b>', deleted: false } }, () => a.saveLabelType('new', { name: 'Synthetic', htmlTemplate: '<b>literal</b>', deleted: false }));
        await p.call(Admin, 'deleteLabelType', { typeId: 'l' }, () => a.deleteLabelType('l'));
        await p.call(Admin, 'upsertTopicLabel', { labelId: 'new', label: { name: 'Synthetic', labelTypeId: 'l', forumIds: [], groupIds: [] } }, () => a.saveLabel('new', { name: 'Synthetic', labelTypeId: 'l', forumIds: [], groupIds: [] }));
        await p.call(Admin, 'deleteTopicLabel', { labelId: 'l' }, () => a.deleteLabel('l'));
        assert.equal((await p.call(Admin, 'listReports', { page: 0, size: 1, status: 1 }, () => a.reports(0, 1, 'OPEN'), { total: 9n })).total, 9);
        await p.call(Admin, 'getReport', { reportId: 'r' }, () => a.report('r'));
        await p.call(Admin, 'updateReport', { reportId: 'r', update: { assignedToUserId: '', moderatorNote: '' } }, () => a.updateReport('r', { assignedToUserId: null, moderatorNote: null }));
        await p.call(Admin, 'updateReport', { reportId: 'r', update: { status: 1 } }, () => a.updateReport('r', 'OPEN'));
        await p.call(Translation, 'getOverview', {}, a.translationsOverview);
        assert.deepEqual(await p.call(Translation, 'listLocales', {}, a.translationLocales, { items: [] }), []);
        const locale = { code: 'de', displayName: 'Deutsch', nativeName: 'Deutsch', enabled: false, fallbackLocale: '' };
        await p.call(Translation, 'createLocale', locale, () => a.saveTranslationLocale(null, locale));
        await p.call(Translation, 'updateLocale', { code: 'de', locale }, () => a.saveTranslationLocale('de', locale));
        await p.call(Translation, 'disableLocale', { code: 'de' }, () => a.disableTranslationLocale('de'));
        await p.call(Translation, 'listEntries', { query: 'literal', namespace: 'common', status: 3, page: 0, size: 50 }, () => a.translationEntries({ q: 'literal', namespace: 'common', status: 'PUBLISHED' }));
        await p.call(Translation, 'getEntry', { id: 'e' }, () => a.translationEntry('e'));
        const entry = { key: 'test', namespace: 'common', values: { de: 'TRANSLATION_STATUS_PUBLISHED', en: ' literal ' } };
        assert.deepEqual((await p.call(Translation, 'createEntry', entry, () => a.saveTranslationEntry(null, entry), entry)).values, entry.values);
        await p.call(Translation, 'updateEntry', { id: 'e', entry: { ...entry, values: {} } }, () => a.saveTranslationEntry('e', { ...entry, values: {} }));
        await p.call(Translation, 'updateEntryStatus', { id: 'e', status: 3 }, () => a.setTranslationStatus('e', 'PUBLISHED'));
        await p.call(Translation, 'archiveEntry', { id: 'e' }, () => a.archiveTranslationEntry('e'));
    } finally { p.restore(); }
});

test('Blog public/admin transport distinguishes listing scope and encodes omitted versus explicitly cleared patch fields', async () => {
    const p = installPeer();
    try {
        await p.call(Blog, 'listPosts', { page: 0, size: 20 }, blogApi.list, {}, { public: true });
        await p.call(Blog, 'getPost', { postId: 'p' }, () => blogApi.byId('p'), {}, { public: true });
        await p.call(Blog, 'getPostBySlug', { slug: 'test' }, () => blogApi.bySlug('test'), {}, { public: true });
        await p.call(BlogAdmin, 'listPosts', { page: 1, size: 25, status: 1, category: 'test', query: 'literal' }, () => blogApi.admin.list({ page: 1, size: 25, status: 'DRAFT', category: 'test', query: 'literal' }));
        await p.call(BlogAdmin, 'getPost', { postId: 'p' }, () => blogApi.admin.byId('p'));
        const write = { slug: 'test', title: 'BLOG_STATUS_PUBLISHED', content: '<script>literal</script>', categories: [], tags: [], status: 'DRAFT' };
        await p.call(BlogAdmin, 'createPost', { ...write, status: 1 }, () => blogApi.create(write));
        await p.call(BlogAdmin, 'updatePost', { ...write, status: 1, postId: 'p' }, () => blogApi.update('p', write));
        await p.call(BlogAdmin, 'patchPost', { postId: 'p', excerpt: '', thumbnailUrl: '', categories: { values: [] }, tags: { values: ['literal'] } }, () => blogApi.patch('p', { excerpt: null, thumbnailUrl: null, categories: [], tags: ['literal'] }));
        await p.call(BlogAdmin, 'patchPost', { postId: 'p', title: 'new' }, () => blogApi.patch('p', { title: 'new' }));
        await p.call(BlogAdmin, 'publishPost', { postId: 'p' }, () => blogApi.publish('p'));
        await p.call(BlogAdmin, 'unpublishPost', { postId: 'p' }, () => blogApi.unpublish('p'));
        await p.call(BlogAdmin, 'archivePost', { postId: 'p' }, () => blogApi.remove('p'));
    } finally { p.restore(); }
});

test('Feedback transport preserves public privacy, UI counters, unvote false and native admin filter/list wrappers', async () => {
    const p = installPeer(), a = suggestionsApi;
    try {
        await p.call(Suggestion, 'listSuggestions', { open: false, categoryId: 'c', statusId: 's', limit: 10 }, () => a.list({ open: false, category: 'c', status: 's', limit: 10 }), {}, { public: true });
        assert.equal((await p.call(Suggestion, 'getSuggestion', { suggestionId: 's' }, () => a.get('s'), { likeCount: 9, dislikeCount: 2 }, { public: true })).likesCount, 9);
        await p.call(Suggestion, 'createSuggestion', { categoryId: 'c', title: 'Synthetic', content: 'literal' }, () => a.create({ categoryId: 'c', title: 'Synthetic', content: 'literal' }));
        await p.call(Suggestion, 'likeSuggestion', { suggestionId: 's', like: false }, () => a.vote('s', 'like', false));
        await p.call(Suggestion, 'dislikeSuggestion', { suggestionId: 's', dislike: true }, () => a.vote('s', 'dislike', true));
        await p.call(Suggestion, 'listComments', { suggestionId: 's' }, () => a.comments('s'), {}, { public: true });
        await p.call(Suggestion, 'commentOnSuggestion', { suggestionId: 's', content: 'literal' }, () => a.comment('s', 'literal'));
        await p.call(Suggestion, 'listCategories', {}, a.categories, {}, { public: true });
        await p.call(Suggestion, 'listStatuses', {}, a.statuses, {}, { public: true });
        assert.equal((await p.call(SuggestionAdmin, 'listSuggestions', { limit: 100 }, a.admin.list, { items: [{ likeCount: 5 }] }))[0].likesCount, 5);
        await p.call(SuggestionAdmin, 'searchSuggestions', { page: 1, size: 25, statusId: 's', categoryId: 'c', deleted: false, query: 'literal' }, () => a.admin.search({ page: 1, statusId: 's', categoryId: 'c', deleted: 'false', query: 'literal' }));
        await p.call(SuggestionAdmin, 'patchSuggestion', { suggestionId: 's', deleted: false, categoryId: 'c' }, () => a.admin.patch('s', { deleted: false, categoryId: 'c' }));
        assert.deepEqual(await p.call(SuggestionAdmin, 'listCategories', {}, a.admin.categories, { categories: [] }), []);
        await p.call(SuggestionAdmin, 'upsertCategory', { categoryId: 'new', category: { name: 'Synthetic', displayOrder: 2, deleted: false } }, () => a.admin.saveCategory('new', { name: 'Synthetic', displayOrder: 2, deleted: false }));
        assert.deepEqual(await p.call(SuggestionAdmin, 'listStatuses', {}, a.admin.statuses, { statuses: [] }), []);
        await p.call(SuggestionAdmin, 'upsertStatus', { statusId: 'new', status: { name: 'Synthetic', html: '<b>literal</b>', open: false, deleted: false } }, () => a.admin.saveStatus('new', { name: 'Synthetic', html: '<b>literal</b>', open: false, deleted: false }));
    } finally { p.restore(); }
});

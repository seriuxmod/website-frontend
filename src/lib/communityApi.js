import { BlogService, BlogAdminService } from '../gen/seriuxmod/forum/v1/blog_service_pb.js';
import { SuggestionService, SuggestionAdminService } from '../gen/seriuxmod/forum/v1/suggestion_service_pb.js';
import { websiteRpc as rpc, optional, optionalBoolean, fields } from './grpc/websiteRpc.js';

const blogList = ({ page = 0, size = 20, status = '', category = '', query = '' } = {}) => ({ page, size,
    status: optional(status), category: optional(category), query: optional(query) });
const blogWrite = body => fields(body, ['slug', 'title', 'excerpt', 'content', 'thumbnailUrl', 'categories', 'tags', 'status']);
const suggestion = value => ({ ...value, likesCount: value.likeCount, dislikesCount: value.dislikeCount });
const publicBlog = (method, request) => rpc(BlogService, method, request, { public: true });
const adminBlog = (method, request) => rpc(BlogAdminService, method, request);
const publicSuggestion = (method, request) => rpc(SuggestionService, method, request, { public: true });
const adminSuggestion = (method, request) => rpc(SuggestionAdminService, method, request);

export const blogApi = {
    list: options => publicBlog('listPosts', blogList(options)),
    byId: postId => publicBlog('getPost', { postId }),
    bySlug: slug => publicBlog('getPostBySlug', { slug }),
    create: body => adminBlog('createPost', blogWrite(body)),
    update: (postId, body) => adminBlog('updatePost', { ...blogWrite(body), postId }),
    patch: (postId, body) => {
        const request = { postId, ...fields(body, ['title', 'content', 'status']) };
        for (const key of ['excerpt', 'thumbnailUrl']) if (Object.hasOwn(body, key)) request[key] = body[key] ?? '';
        for (const key of ['categories', 'tags']) if (Object.hasOwn(body, key)) request[key] = { values: body[key] ?? [] };
        return adminBlog('patchPost', request);
    },
    publish: postId => adminBlog('publishPost', { postId }),
    unpublish: postId => adminBlog('unpublishPost', { postId }),
    remove: postId => adminBlog('archivePost', { postId }),
    admin: {
        list: options => adminBlog('listPosts', blogList(options)),
        byId: postId => adminBlog('getPost', { postId })
    }
};

export const suggestionsApi = {
    list: ({ open = true, category = '', status = '', limit = 100 } = {}) => publicSuggestion('listSuggestions', {
        open: optionalBoolean(open), categoryId: optional(category), statusId: optional(status), limit
    }),
    get: suggestionId => publicSuggestion('getSuggestion', { suggestionId }).then(suggestion),
    create: body => rpc(SuggestionService, 'createSuggestion', fields(body, ['categoryId', 'title', 'content'])).then(suggestion),
    vote: (suggestionId, type, enabled = true) => {
        if (!['like', 'dislike'].includes(type) || typeof enabled !== 'boolean') throw new Error('Ungültige Feedback-Bewertung.');
        return rpc(SuggestionService, type === 'like' ? 'likeSuggestion' : 'dislikeSuggestion', { suggestionId, [type]: enabled });
    },
    comments: suggestionId => publicSuggestion('listComments', { suggestionId }),
    comment: (suggestionId, content) => rpc(SuggestionService, 'commentOnSuggestion', { suggestionId, content }),
    categories: () => publicSuggestion('listCategories'),
    statuses: () => publicSuggestion('listStatuses'),
    admin: {
        list: () => adminSuggestion('listSuggestions', { limit: 100 }).then(value => value.items.map(suggestion)),
        search: ({ page = 0, size = 25, statusId = '', categoryId = '', deleted, query = '' } = {}) => adminSuggestion('searchSuggestions', {
            page, size, statusId: optional(statusId), categoryId: optional(categoryId), deleted: optionalBoolean(deleted), query: optional(query)
        }),
        patch: (suggestionId, body) => adminSuggestion('patchSuggestion', { suggestionId, ...fields(body, ['statusId', 'categoryId', 'deleted']) }).then(suggestion),
        categories: () => adminSuggestion('listCategories').then(value => value.categories),
        saveCategory: (categoryId, body) => adminSuggestion('upsertCategory', { categoryId, category: fields(body, ['name', 'displayOrder', 'deleted']) }),
        statuses: () => adminSuggestion('listStatuses').then(value => value.statuses),
        saveStatus: (statusId, body) => adminSuggestion('upsertStatus', { statusId, status: fields(body, ['name', 'html', 'open', 'deleted']) })
    }
};

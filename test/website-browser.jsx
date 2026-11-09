// Isolated local UI peer only. NOT imported by the production entry or copied into dist.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Link, useNavigate, useLocation } from 'react-router-dom';
import { create, fromBinary, toBinary } from '@bufbuild/protobuf';
import '../src/index.css';
import App from '../src/App.jsx';
import { SocialProvider } from '../src/lib/SocialContext.jsx';
import { logout } from '../src/lib/auth.js';
import { RealtimeEventSchema } from '../src/gen/seriuxmod/realtime/v1/realtime_model_pb.js';

const modules = import.meta.glob('../src/gen/**/*_service_pb.js', { eager: true });
const services = Object.values(modules).flatMap(module => Object.values(module).filter(value => value?.kind === 'service'));
const params = new URLSearchParams(location.search), mode = params.get('mode') || 'ready';
const uid = '10000000-0000-4000-8000-000000000001';
const timestamp = { seconds: 1794218400n };
const rights = ['forum.admin', 'store.admin', 'users.admin', 'permissions.admin', 'team.admin', 'social.admin', 'status.admin', 'moderation.admin'];
const calls = [], overrides = new Map(), streams = new Set();
const frame = (payload, flags = 0) => { const result = new Uint8Array(payload.length + 5); result[0] = flags; new DataView(result.buffer).setUint32(1, payload.length); result.set(payload, 5); return result; };
const response = (method, value = {}, code = 0) => new Response(new Blob([...(code ? [] : [frame(toBinary(method.output, create(method.output, value)))]),
    frame(new TextEncoder().encode(`grpc-status: ${code}\r\n`), 128)]), { headers: { 'content-type': 'application/grpc-web+proto' } });
const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
const context = canvas.getContext('2d'); context.fillStyle = '#ff7417'; context.fillRect(0, 0, 32, 32); context.fillStyle = '#4b5563'; context.fillRect(32, 32, 32, 32);
const png = Uint8Array.from(atob(canvas.toDataURL('image/png').split(',')[1]), char => char.charCodeAt(0));
const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', png))].map(value => value.toString(16).padStart(2, '0')).join('');
const texture = { textureId: `rgba8-v1-${'a'.repeat(64)}`, hashVersion: 'rgba8-v1', pixelSha256: 'a'.repeat(64), mediaSha256: digest, width: 64, height: 64, cataloguedAt: timestamp };
const region = { regionId: 'global', displayName: 'Testdatensatz Global' };
const statusService = { monitorId: 'test', displayName: 'Testdatensatz Dienst', group: 'Testdatensatz', state: 'UP', responseTimeMs: 8n, regionId: 'global' };
const summary = { generatedAt: timestamp, overallStatus: 'UP', monitoredServices: 1, healthyServices: 1, services: [statusService], regions: [{ region, overallStatus: 'UP', monitoredServices: 1, healthyServices: 1, services: [statusService] }] };
const adminTexture = { texture, publication: 1, revision: 9007199254740993n };
const node = { id: 'test-forum', type: 2, title: 'Testdatensatz Forum', topics: 1n, posts: 1n,
    permissions: { canView: true, canPostTopic: true, canPostReply: true, canModerate: true } };
const topic = { id: 'test-topic', forumId: node.id, title: 'Testdatensatz Thema', creatorUserId: uid, views: 4n, createdAt: timestamp };
const category = { id: 'test-category', name: 'Testdatensatz Kategorie' };
const product = { id: 'test-product', categoryId: category.id, name: 'Testdatensatz Produkt', priceCents: 199n, currency: 'EUR', description: 'Nur lokale UI-Prüfung', fields: [] };
const publicServer = { id: 'test-server', name: 'Testdatensatz Server', address: 'play.example.invalid', category: 'Testdatensatz', supportedVersions: ['Testversion'], tags: [] };
const blog = { id: 'test-blog', slug: 'testdatensatz', title: 'Testdatensatz Blogbeitrag', content: '<script>Testdatensatz bleibt Klartext</script>', status: 1, categories: [], tags: [], createdAt: timestamp };
const makeToken = () => `fixture.${btoa(JSON.stringify({ sub: uid, uid, username: 'Testdatensatz', exp: Date.now()/1000 + 3600, sid: 'local-fixture-only' })).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')}.fixture`;
sessionStorage.setItem('seriux_access_token', makeToken());
sessionStorage.removeItem('seriux_refresh_token'); sessionStorage.removeItem('seriux_identity_token'); sessionStorage.removeItem('seriux_user_profile');

window.fetch = async (url, init = {}) => {
    const target = new URL(url, location.href), path = target.pathname;
    if (target.hostname === 'auth.seriuxmod.net') {
        if (path.endsWith('/csrf')) return Response.json({ token: 'local', parameterName: '_csrf' });
        if (path.endsWith('/logout') || path.endsWith('/revoke')) return new Response(null, { status: 204 });
        throw new Error('Local fixture blocks real browser authorization');
    }
    const service = services.find(item => path.startsWith(`/${item.typeName}/`));
    const method = service && Object.values(service.method).find(item => path === `/${service.typeName}/${item.name}`);
    if (!method) throw new Error('Local fixture blocks unexpected network request: ' + path);
    const request = fromBinary(method.input, new Uint8Array(init.body).subarray(5));
    const name = `${service.name}/${method.name}`; calls.push({ name, request });
    if (method.name === 'Watch') {
        let stream;
        return new Response(new ReadableStream({ start(controller) {
            stream = controller; streams.add(controller);
            controller.enqueue(frame(toBinary(RealtimeEventSchema, create(RealtimeEventSchema, { eventId: 'local-ready', payload: { case: 'ready', value: { userId: uid } } }))));
            init.signal?.addEventListener('abort', () => { streams.delete(controller); try { controller.close(); } catch {} }, { once: true });
        }, cancel() { streams.delete(stream); } }), { headers: { 'content-type': 'application/grpc-web+proto' } });
    }
    if (service.name === 'PublicUserService') return response(method, method.name === 'BatchGetPublicUsers' || method.name === 'SearchPublicUsers'
        ? { profiles: [{ playerId: uid, username: 'Testdatensatz' }] } : { profile: { playerId: uid, username: 'Testdatensatz' } });
    if (name === 'PermissionService/GetMyPermissions') return response(method, { effectivePermissions: rights });
    if (/GetMyPartyOverview|GetMyClan/.test(method.name)) return response(method, {}, 5);
    const error = overrides.get(name) ?? (['error', 'denied'].includes(mode) && !/PresenceService|SocialFriendService|SocialChatService|SocialNotificationService|ClanPublicService|ClanService/.test(service.name) ? mode === 'error' ? 14 : 7 : 0);
    if (error) return response(method, {}, error);
    if (mode === 'loading' && /StatusService|SkinCatalog|Store|ForumAdmin|AdminPlayer|TeamAdmin/.test(service.name)) {
        return new Promise((resolve, reject) => init.signal?.addEventListener('abort', () => reject(new DOMException('Fixture aborted', 'AbortError')), { once: true }));
    }
    if (mode === 'empty') return response(method, {});
    if (name === 'StatusService/GetSummary') return response(method, summary);
    if (name === 'StatusService/GetAdminSummary') return response(method, { generatedAt: timestamp, overallStatus: 'UP', stackName: 'Testdatensatz', platform: { engineName: 'Testdatensatz', nodes: [], history: [] }, readiness: { total: 1, ready: 1 }, groups: [], swarmServices: [], topology: { nodes: [], links: [] } });
    if (name === 'UserAccountService/GetAdminOverview') return response(method, { registeredUsers: 7n, onlineUsers: 1n, onlineStaff: [] });
    if (name === 'AdminPlayerService/GetOverview') return response(method, { registeredUsers: 7n });
    if (name === 'AdminPlayerService/ListPlayers') return response(method, { players: [{ id: uid, username: 'Testdatensatz' }], totalElements: 1n, totalPages: 1, size: 30 });
    if (name === 'SkinCatalogService/ListTextures') return response(method, { items: [texture] });
    if (name === 'SkinCatalogService/ReadTexture') return response(method, { texture, png });
    if (name === 'SkinCatalogAdminService/ListTextures') return response(method, { items: [adminTexture] });
    if (name === 'SkinCatalogAdminService/SetPublication') { adminTexture.publication = request.publication; adminTexture.revision++; return response(method, adminTexture); }
    if (name === 'SkinCatalogAdminService/ImportSubjects') return response(method, { batchId: 'Testdatensatz-Import', results: request.subjects.map((subject, index) => ({ index, playerUuid: subject.playerUuid, outcome: index ? 4 : 1, errorCode: index ? 'UUID' : '' })) });
    if (name === 'SkinCatalogAdminService/GetSubject') return response(method, { playerUuid: request.playerUuid, sourceUsername: 'TestdatensatzUnverifiziert', observationCount: 1n, currentTextureId: texture.textureId, currentModel: 2 });
    if (name === 'SkinCatalogAdminService/GetJob' || name === 'SkinCatalogAdminService/SetJobPaused') return response(method, { playerUuid: request.playerUuid, state: request.paused ? 3 : 1, revision: 9007199254740993n });
    if (name === 'SkinCatalogAdminService/ListHistory') return response(method, { items: [{ observationId: 'Testdatensatz', playerUuid: request.playerUuid, textureId: texture.textureId, model: 2, provenance: 'ADMIN_STAGED_INPUT', firstObservedAt: timestamp, lastObservedAt: timestamp }] });
    if (name === 'StoreCatalogService/GetConfig') return response(method, { currency: 'EUR', checkoutEnabled: false });
    if (name === 'StoreCatalogService/ListCategories' || name === 'StoreAdminService/ListCategories') return response(method, { categories: [category] });
    if (name === 'StoreCatalogService/ListProducts' || name === 'StoreAdminService/ListProducts') return response(method, { products: [product] });
    if (name === 'StoreAdminService/GetSettings') return response(method, { currency: 'EUR', checkoutEnabled: false, checkoutOperational: false, missingRequirements: ['Testdatensatz: Checkout bleibt aus'] });
    if (name === 'StoreAdminService/GetOverview') return response(method, { products: 1n, revenueByCurrency: {} });
    if (name === 'PublicServerService/ListServers') return response(method, { items: [publicServer, { ...publicServer, id: 'test-zero', name: 'Testdatensatz Null Spieler', onlinePlayers: 0, maxPlayers: 20 }], totalElements: 2n, totalPages: 1, size: 24 });
    if (name === 'PublicServerAdminService/ListServers') return response(method, { items: [{ ...publicServer, status: 2 }], totalElements: 1n, totalPages: 1, size: 25 });
    if (name === 'ForumService/GetTree' || name === 'ForumAdminService/ListNodes') return response(method, { nodes: [node] });
    if (name === 'ForumService/GetForum') return response(method, node);
    if (name === 'ForumService/GetTopic') return response(method, topic);
    if (name === 'ForumService/ListTopics' || name === 'ForumService/ListLatestTopics') return response(method, { items: [topic], page: 0, size: 20, total: 1n });
    if (name === 'ForumService/ListPosts') return response(method, { items: [{ id: 'test-post', topicId: topic.id, forumId: node.id, creatorUserId: uid, content: '<script>Testdatensatz bleibt Klartext</script>', postNumber: 1, createdAt: timestamp }], page: 0, size: 20, total: 1n });
    if (name === 'ForumAdminService/ListReports') return response(method, { total: 9n, items: [] });
    if (name === 'BlogAdminService/ListPosts') return response(method, { items: [blog], total: 1n, page: 0, size: 25 });
    if (name === 'BlogAdminService/GetPost') return response(method, blog);
    if (name === 'BlogService/GetPostBySlug') return response(method, { ...blog, status: 2, publishedAt: timestamp });
    if (name === 'BlogAdminService/UpdatePost' || name === 'BlogAdminService/CreatePost') return response(method, { ...blog, ...request, id: blog.id });
    return response(method, {});
};
window.websiteFixture = { calls, mode, texture, uid, setError: (name, code) => overrides.set(name, code), signOut: logout };

function FixtureControls() {
    const navigate = useNavigate(), location = useLocation();
    window.websiteFixture.navigate = navigate; window.websiteFixture.currentRoute = location.pathname;
    return <aside style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2147483647, background: '#451a03', color: '#fde68a', fontSize: 12, padding: 8, textAlign: 'center' }} role="note">
        <b>Testdatensatz · Alle Werte lokal simuliert · Keine Live-Abnahme, echten Rechte oder Zahlungen</b>
        <nav className="mt-1 flex flex-wrap justify-center gap-4">{['/admin', '/admin/skins', '/community/skins', '/community/servers', '/store', '/store/account', '/admin/forum/blog', '/admin/forum/structure', '/status'].map(path => <Link key={path} to={path}>{path}</Link>)}</nav>
    </aside>;
}
createRoot(document.getElementById('app')).render(<MemoryRouter initialEntries={[params.get('page') || '/admin']}><SocialProvider><FixtureControls /><App /></SocialProvider></MemoryRouter>);

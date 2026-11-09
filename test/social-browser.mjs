// Local UI fixture only. Vite's production entry never imports this file.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { create, fromBinary, toBinary } from '@bufbuild/protobuf';
import '../src/index.css';
import { SocialFriendService } from '../src/gen/seriuxmod/social/v1/friend_service_pb.js';
import { PresenceService } from '../src/gen/seriuxmod/social/v1/presence_service_pb.js';
import { PartyService } from '../src/gen/seriuxmod/social/v1/party_service_pb.js';
import { ClanService, ClanPublicService } from '../src/gen/seriuxmod/social/v1/clan_service_pb.js';
import { SocialChatService } from '../src/gen/seriuxmod/social/v1/chat_service_pb.js';
import { SocialNotificationService } from '../src/gen/seriuxmod/social/v1/notification_service_pb.js';
import { PublicUserService } from '../src/gen/seriuxmod/user/v1/public_user_service_pb.js';
import { RealtimeService } from '../src/gen/seriuxmod/realtime/v1/realtime_service_pb.js';
import { RealtimeEventSchema } from '../src/gen/seriuxmod/realtime/v1/realtime_model_pb.js';
import { UserPresenceStatus, PresenceSurface } from '../src/gen/seriuxmod/social/v1/presence_model_pb.js';
import { ActivitySource } from '../src/gen/seriuxmod/social/v1/activity_model_pb.js';

const alice = '11111111-1111-4111-8111-00000000a001', bob = '11111111-1111-4111-8111-00000000a002';
const now = () => ({ seconds: BigInt(Math.floor(Date.now() / 1000)) });
const streams = new Set(), commands = [];
let status = UserPresenceStatus.ONLINE, readThrough = 0n, notificationRead = false;
const messages = [{ id: 'fixture-message', senderUserId: bob, recipientUserId: alice,
    text: '<script>Testdatensatz: bleibt Klartext</script>', sequence: 1n, clientMessageId: bob, createdAt: now() }];
const surfaces = [PresenceSurface.WEBSITE, PresenceSurface.LAUNCHER];
const services = [SocialFriendService, PresenceService, PartyService, ClanService, ClanPublicService, SocialChatService, SocialNotificationService, PublicUserService, RealtimeService];
const frame = (data, flags = 0) => { const bytes = new Uint8Array(data.length + 5); bytes[0] = flags; new DataView(bytes.buffer).setUint32(1, data.length); bytes.set(data, 5); return bytes; };
const event = value => frame(toBinary(RealtimeEventSchema, create(RealtimeEventSchema, { eventId: crypto.randomUUID(), sequence: 1n, occurredAt: now(), ...value })));
const invalidate = topic => { for (const controller of streams) controller.enqueue(event({ payload: { case: 'socialEvent', value: { topic, body: new TextEncoder().encode('{}') } } })); };
const respond = (method, data, code = 0) => new Response(new Blob([code ? new Uint8Array() : frame(toBinary(method.output, create(method.output, data))),
    frame(new TextEncoder().encode(`grpc-status: ${code}\r\n`), 128)]), { headers: { 'content-type': 'application/grpc-web+proto' } });
const token = `fixture.${btoa(JSON.stringify({ sub: alice, uid: alice, username: 'TestdatensatzAlice', exp: Date.now() / 1000 + 900 })).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')}.fixture`;
sessionStorage.setItem('seriux_access_token', token);
window.fetch = async (url, init = {}) => {
    const path = new URL(url, location.href).pathname;
    const service = services.find(value => path.startsWith(`/${value.typeName}/`));
    const method = service && Object.values(service.method).find(value => path.endsWith(`/${value.name}`));
    if (!method) throw new Error('Fixture blocked unexpected network request: ' + path);
    const request = fromBinary(method.input, new Uint8Array(init.body).subarray(5));
    if (method.name === 'Watch') {
        let controller;
        return new Response(new ReadableStream({ start(value) { controller = value; streams.add(value); value.enqueue(event({ payload: { case: 'ready', value: { userId: alice } } }));
            init.signal?.addEventListener('abort', () => { streams.delete(value); try { value.close(); } catch {} }, { once: true }); },
        cancel() { streams.delete(controller); } }), { headers: { 'content-type': 'application/grpc-web+proto' } });
    }
    if (method.name === 'BatchGetPublicUsers') return respond(method, { profiles: request.playerIds.map(playerId => ({ playerId, username: playerId === alice ? 'TestdatensatzAlice' : 'TestdatensatzBob' })) });
    if (method.name === 'SearchPublicUsers') return respond(method, { profiles: [{ playerId: bob, username: 'TestdatensatzBob' }] });
    if (method.name === 'Heartbeat') return respond(method, {});
    if (method.name === 'SetStatus') { status = request.status; commands.push({ method: method.name, status }); invalidate('presence.updated'); }
    if (method.name === 'GetMyPresence' || method.name === 'SetStatus') return respond(method, { preferredStatus: status, effectiveStatus: status, connectedSurfaces: surfaces });
    if (method.name === 'GetPublicPresence') {
        const hidden = request.userId === alice && [UserPresenceStatus.INVISIBLE, UserPresenceStatus.OFFLINE].includes(status);
        return respond(method, { online: !hidden, status: hidden ? UserPresenceStatus.OFFLINE : request.userId === alice ? status : UserPresenceStatus.IDLE,
            surfaces: hidden ? [] : request.userId === alice ? surfaces : [PresenceSurface.CLIENT, PresenceSurface.LAUNCHER] });
    }
    if (method.name === 'ListFriends') return respond(method, { friends: [{ id: 'fixture-friend', userId: alice, friendUserId: bob }] });
    if (method.name === 'ListIncomingRequests') return respond(method, { requests: [] });
    if (method.name === 'GetMyPartyOverview') return respond(method, { party: { id: 'fixture-party', name: 'Testdatensatz Party', ownerUserId: alice, maxMembers: 8 },
        members: [{ userId: alice, rankKey: 'LEADER' }, { userId: bob, rankKey: 'MEMBER' }], memberActivities: [{ userId: bob, activity: {
            userId: bob, serverAddress: 'play.example.invalid', serverName: 'Testdatensatz Server', gameMode: 'Bedwars', source: ActivitySource.CLIENT_REPORTED, observedAt: now(), expiresAt: { seconds: now().seconds + 150n } } }] });
    if (method.name === 'GetMyClan') return respond(method, {}, 5);
    if (method.name === 'GetMyInvites' || method.name === 'ListClans') return respond(method, { items: [] });
    if (method.name === 'ListNotifications') return respond(method, { items: [{ id: bob, topic: 'friend.request.accepted', body: new TextEncoder().encode('{}'), createdAt: now(),
        ...(notificationRead ? { readAt: now() } : {}) }], unreadCount: notificationRead ? 0n : 1n, totalPages: 1, size: 25 });
    if (service === SocialNotificationService && method.name.startsWith('Mark')) { notificationRead = true; commands.push({ method: method.name }); invalidate('social.notifications.updated'); return respond(method, method.name === 'MarkRead' ? { id: bob, readAt: now() } : {}); }
    if (method.name === 'ListConversations') return respond(method, { items: [{ peerUserId: bob, lastMessage: messages.at(-1), unreadCount: readThrough ? 0n : 1n, readThroughSequence: readThrough }], totalPages: 1, size: 25 });
    if (method.name === 'GetMessages') return respond(method, { items: messages, readThroughSequence: readThrough });
    if (method.name === 'SendMessage') {
        let message = messages.find(value => value.clientMessageId === request.clientMessageId);
        if (!message) { message = { id: crypto.randomUUID(), senderUserId: alice, recipientUserId: request.recipientUserId, text: request.text,
            clientMessageId: request.clientMessageId, createdAt: now(), sequence: BigInt(messages.length + 1) }; messages.push(message); }
        commands.push({ method: method.name, clientMessageId: request.clientMessageId }); invalidate('chat.message.created'); return respond(method, message);
    }
    if (service === SocialChatService && method.name === 'MarkRead') { readThrough = request.throughSequence; invalidate('chat.read.updated'); return respond(method, {}); }
    return respond(method, {}, 12);
};
window.socialFixture = { commands, signOut: () => { sessionStorage.clear(); window.dispatchEvent(new CustomEvent('seriux-auth-changed')); } };
const { SocialProvider } = await import('../src/lib/SocialContext.jsx');
const { default: SocialWorkspace } = await import('../src/pages/social/SocialWorkspace.jsx');
const { default: NavbarSocial } = await import('../src/components/NavbarSocial.jsx');
createRoot(document.getElementById('app')).render(React.createElement(MemoryRouter, { initialEntries: ['/friends'] }, React.createElement(SocialProvider, null,
    React.createElement('div', { className: 'fixed z-50 top-0 inset-x-0 bg-amber-950 p-3 text-center text-amber-200 text-sm' }, 'Testdatensatz · Nur lokale UI-Prüfung · Keine echte Anmeldung', React.createElement(NavbarSocial)),
    React.createElement(Routes, null, ...['friends', 'party', 'clans', 'chat', 'notifications'].map(initialTab => React.createElement(Route, { key: initialTab,
        path: '/' + initialTab, element: React.createElement(SocialWorkspace, { initialTab }) }))))));

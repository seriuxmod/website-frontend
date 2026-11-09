import test from 'node:test';
import assert from 'node:assert/strict';
import { installPeer } from './grpc-peer.mjs';
import { userAdminApi as api } from '../src/lib/userAdminApi.js';
import { teamApi } from '../src/lib/teamApi.js';
import { statusApi, statusAdminApi } from '../src/lib/statusAdminApi.js';
import { AdminPlayerService as Player } from '../src/gen/seriuxmod/user/v1/admin_player_service_pb.js';
import { AdminPermissionService as Permission } from '../src/gen/seriuxmod/user/v1/admin_permission_service_pb.js';
import { UserAccountService as Account } from '../src/gen/seriuxmod/user/v1/user_service_pb.js';
import { TeamAdminService as Team } from '../src/gen/seriuxmod/user/v1/team_admin_service_pb.js';
import { StatusService as Status } from '../src/gen/seriuxmod/status/v1/status_service_pb.js';

test('player/permission administration retains restriction semantics, empty rights, group membership and optimistic versions', async () => {
    const p = installPeer();
    try {
        await p.call(Account, 'getAdminOverview', {}, api.overview);
        await p.call(Player, 'getOverview', { days: 30 }, api.playersOverview);
        await p.call(Player, 'getPlayer', { userId: 'u' }, () => api.player('u'));
        await p.call(Player, 'listAudits', { userId: 'u', page: 0, size: 30 }, () => api.playerAudits('u'));
        await p.call(Account, 'lockAccount', { userId: 'u', userMessage: 'Für den Nutzer sichtbar' }, () => api.setPlayerLocked('u', true, 'Für den Nutzer sichtbar'));
        await p.call(Account, 'unlockAccount', { userId: 'u', reason: 'Synthetic' }, () => api.setPlayerLocked('u', false, 'Synthetic'));
        await p.call(Player, 'setDirectPermissions', { userId: 'u', permissions: [] }, () => api.setDirectPermissions('u', []));
        await p.call(Player, 'assignGroup', { userId: 'u', groupKey: 'test', source: 'ADMIN', sourceReference: 'Synthetic' }, () => api.assignGroup('u', { groupKey: 'test', source: 'ADMIN', sourceReference: 'Synthetic', startsAt: null, expiresAt: null }));
        await p.call(Player, 'removeGroup', { userId: 'u', groupKey: 'test' }, () => api.removeGroup('u', 'test'));
        await p.call(Permission, 'getOverview', {}, api.permissionsOverview);
        assert.deepEqual(await p.call(Permission, 'listGroups', {}, api.permissionGroups, { groups: [] }), []);
        await p.call(Permission, 'getGroup', { key: 'test' }, () => api.permissionGroup('test'));
        assert.deepEqual(await p.call(Permission, 'listCatalog', {}, api.permissionCatalog, { entries: [] }), []);
        const group = { key: 'test', displayName: 'Testdatensatz', permissions: [], defaultGroup: false, priority: 2, version: 7 };
        await p.call(Permission, 'createGroup', { group: { ...group, version: 7n } }, () => api.createPermissionGroup(group));
        await p.call(Permission, 'updateGroup', { key: 'test', group: { ...group, version: 7n } }, () => api.updatePermissionGroup('test', group));
        await p.call(Permission, 'deleteGroup', { key: 'test', version: 7n }, () => api.deletePermissionGroup('test', 7));
    } finally { p.restore(); }
});

test('all Team commands retain lists, status/priority enums, clear fields, positions and optimistic versions', async () => {
    const p = installPeer(), api = teamApi;
    try {
        await p.call(Team, 'getOverview', {}, api.overview);
        await p.call(Team, 'listActivity', { page: 0, size: 50, action: 4, bucket: 2 }, () => api.activity({ action: 'TODO_CREATED' }));
        const todo = { title: 'Synthetic', area: 'TEST', status: 1, priority: 3, assigneeId: '', dueAt: null, position: 1024n, version: 7n };
        const body = { ...todo, status: 'OPEN', priority: 'HIGH', position: 1024, version: 7 };
        await p.call(Team, 'createTodo', { todo }, () => api.saveTodo(null, body));
        await p.call(Team, 'updateTodo', { id: 't', todo }, () => api.saveTodo('t', body));
        assert.deepEqual(await p.call(Team, 'listTodos', { status: 1, assigneeId: 'u' }, () => api.todos({ status: 'OPEN', assigneeId: 'u' }), { todos: [] }), []);
        await p.call(Team, 'moveTodo', { id: 't', status: 2, position: 1024n, version: 7n }, () => api.moveTodo('t', { status: 'IN_PROGRESS', position: 1024, version: 7 }));
        await p.call(Team, 'deleteTodo', { id: 't' }, () => api.deleteTodo('t'));
        const note = { title: 'Synthetic', content: 'TEAM_TODO_STATUS_DONE', tag: '', pinned: false, version: 7 };
        await p.call(Team, 'createNote', { note: { ...note, version: 7n } }, () => api.saveNote(null, note));
        await p.call(Team, 'updateNote', { id: 'n', note: { ...note, version: 7n } }, () => api.saveNote('n', note));
        await p.call(Team, 'deleteNote', { id: 'n' }, () => api.deleteNote('n'));
        await p.call(Team, 'updateCalendarEvent', { id: 'e', event: { title: 'Synthetic', tone: 1, version: 7n } }, () => api.saveCalendarEvent('e', { title: 'Synthetic', tone: 'ORANGE', version: 7 }));
        await p.call(Team, 'deleteCalendarEvent', { id: 'e' }, () => api.deleteCalendarEvent('e'));
    } finally { p.restore(); }
});

test('public status region/incident reads omit authentication and scaling remains an explicit private command', async () => {
    const p = installPeer();
    try {
        assert.deepEqual(await p.call(Status, 'listRegions', {}, statusApi.regions, { regions: [{ regionId: 'global', displayName: 'Global' }] }, { public: true }), [{ regionId: 'global', displayName: 'Global', sortOrder: 0 }]);
        await p.call(Status, 'getRegionSummary', { regionId: 'global' }, () => statusApi.region('global'), {}, { public: true });
        assert.deepEqual(await p.call(Status, 'listIncidents', {}, statusApi.incidents, { incidents: [] }, { public: true }), []);
        await p.call(Status, 'getAdminSummary', {}, statusAdminApi.summary);
        await p.call(Status, 'scaleService', { serviceName: 'isolated-synthetic', replicas: 1 }, () => statusAdminApi.scaleService('isolated-synthetic', 1));
    } finally { p.restore(); }
});

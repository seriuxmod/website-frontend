import { TeamAdminService } from '../gen/seriuxmod/user/v1/team_admin_service_pb.js';
import { websiteRpc, optional, optionalBoolean, fields } from './grpc/websiteRpc.js';
const call = (method, value = {}) => websiteRpc(TeamAdminService, method, value);
const eventWrite = value => fields(value, ['title', 'description', 'startsAt', 'endsAt', 'allDay', 'zoneId', 'area', 'tone', 'version']);
const todoWrite = value => fields(value, ['title', 'description', 'area', 'status', 'priority', 'assigneeId', 'dueAt', 'position', 'version']);
const noteWrite = value => fields(value, ['title', 'content', 'tag', 'pinned', 'version']);

export const teamApi = {
    overview: () => call('getOverview'),
    calendar: ({ from, to }) => call('listCalendar', { from, to }).then(value => value.events),
    saveCalendarEvent: (id, body) => call(id ? 'updateCalendarEvent' : 'createCalendarEvent', { id: optional(id), event: eventWrite(body) }),
    deleteCalendarEvent: id => call('deleteCalendarEvent', { id }),
    activity: ({ from, to, area, actorId, action, page = 0, size = 50, bucket = 'DAY' } = {}) =>
        call('listActivity', { from, to, area: optional(area), actorId: optional(actorId), action: optional(action), page, size, bucket }),
    todos: ({ status, area, assigneeId } = {}) => call('listTodos', { status: optional(status), area: optional(area), assigneeId: optional(assigneeId) }).then(value => value.todos),
    saveTodo: (id, body) => call(id ? 'updateTodo' : 'createTodo', { id: optional(id), todo: todoWrite(body) }),
    moveTodo: (id, body) => call('moveTodo', { id, ...fields(body, ['status', 'position', 'version']) }),
    deleteTodo: id => call('deleteTodo', { id }),
    notes: ({ q, tag, pinned, page = 0, size = 24 } = {}) =>
        call('listNotes', { query: optional(q), tag: optional(tag), pinned: optionalBoolean(pinned), page, size }),
    saveNote: (id, body) => call(id ? 'updateNote' : 'createNote', { id: optional(id), note: noteWrite(body) }),
    deleteNote: id => call('deleteNote', { id })
};

export const TEAM_TODO_STATUSES = ['OPEN', 'IN_PROGRESS', 'REVIEW', 'DONE'];
export const TEAM_TODO_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'];
export const TEAM_EVENT_TONES = ['ORANGE', 'VIOLET', 'SKY', 'EMERALD'];
export const TEAM_ACTIVITY_ACTIONS = [
    'CALENDAR_CREATED',
    'CALENDAR_UPDATED',
    'CALENDAR_DELETED',
    'TODO_CREATED',
    'TODO_UPDATED',
    'TODO_MOVED',
    'TODO_DELETED',
    'NOTE_CREATED',
    'NOTE_UPDATED',
    'NOTE_DELETED'
];

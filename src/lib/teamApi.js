import { authenticatedFetch } from './auth';

const TEAM_API = 'https://api.seriuxmod.net/api/v1/user/admin/team';

function queryString(values = {}) {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
    });
    const query = params.toString();
    return query ? `?${query}` : '';
}

async function request(path = '', options = {}) {
    const response = await authenticatedFetch(`${TEAM_API}${path}`, {
        ...options,
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...(options.headers || {})
        }
    });
    if (response.status === 204) return null;
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const validationMessage = Array.isArray(payload.errors)
            ? payload.errors
                  .map((entry) => entry.defaultMessage || entry.message)
                  .filter(Boolean)
                  .join(' · ')
            : '';
        const error = new Error(
            validationMessage ||
                payload.message ||
                payload.detail ||
                payload.title ||
                'Die Team-Anfrage ist fehlgeschlagen.'
        );
        error.status = response.status;
        error.payload = payload;
        throw error;
    }
    return payload;
}

function mutation(path, method, body) {
    return request(path, { method, body: JSON.stringify(body) });
}

export const teamApi = {
    overview: () => request(),
    calendar: ({ from, to }) => request(`/calendar${queryString({ from, to })}`),
    saveCalendarEvent: (id, body) =>
        mutation(id ? `/calendar/${encodeURIComponent(id)}` : '/calendar', id ? 'PUT' : 'POST', body),
    deleteCalendarEvent: (id) => request(`/calendar/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    activity: ({ from, to, area, actorId, action, page = 0, size = 50, bucket = 'DAY' } = {}) =>
        request(`/activity${queryString({ from, to, area, actorId, action, page, size, bucket })}`),
    todos: ({ status, area, assigneeId } = {}) => request(`/todos${queryString({ status, area, assigneeId })}`),
    saveTodo: (id, body) => mutation(id ? `/todos/${encodeURIComponent(id)}` : '/todos', id ? 'PUT' : 'POST', body),
    moveTodo: (id, body) => mutation(`/todos/${encodeURIComponent(id)}/move`, 'PATCH', body),
    deleteTodo: (id) => request(`/todos/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    notes: ({ q, tag, pinned, page = 0, size = 24 } = {}) =>
        request(`/notes${queryString({ q, tag, pinned, page, size })}`),
    saveNote: (id, body) => mutation(id ? `/notes/${encodeURIComponent(id)}` : '/notes', id ? 'PUT' : 'POST', body),
    deleteNote: (id) => request(`/notes/${encodeURIComponent(id)}`, { method: 'DELETE' })
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

import { useCallback, useRef, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useVirtualizer } from '@tanstack/react-virtual';
import { FaListCheck, FaPlus, FaTrash } from 'react-icons/fa6';
import { hasAnyPermission } from '../../../lib/auth';
import { TEAM_TODO_PRIORITIES, TEAM_TODO_STATUSES, teamApi } from '../../../lib/teamApi';
import {
    TeamAdminPage,
    TeamAreaField,
    TeamEmpty,
    TeamFormActions,
    TeamLoading,
    TeamPanel,
    TeamSelectField,
    TeamTextField,
    formatTeamDate,
    humanizeTeamValue,
    submitTeamForm,
    useTeamResource
} from './AdminTeamShared';

const STATUS_LABELS = { OPEN: 'Offen', IN_PROGRESS: 'In Arbeit', REVIEW: 'Prüfung', DONE: 'Erledigt' };
const PRIORITY_STYLES = {
    LOW: 'border-zinc-400/15 bg-zinc-400/[.06] text-zinc-400',
    NORMAL: 'border-sky-400/15 bg-sky-400/[.06] text-sky-300',
    HIGH: 'border-orange-400/20 bg-orange-400/[.07] text-orange-300',
    CRITICAL: 'border-red-400/20 bg-red-400/[.07] text-red-300'
};

export default function TeamTodosView({ user }) {
    const [draft, setDraft] = useState({ status: '', area: '', assigneeId: '' });
    const [filters, setFilters] = useState(draft);
    const [filterError, setFilterError] = useState('');
    const [selected, setSelected] = useState(null);
    const [creating, setCreating] = useState(false);
    const [mutationError, setMutationError] = useState('');
    const [movingId, setMovingId] = useState('');
    const canWrite = hasAnyPermission(user, 'team.todos.write');
    const loader = useCallback(() => teamApi.todos(filters), [filters]);
    const resource = useTeamResource(loader, [loader]);
    const todos = Array.isArray(resource.data) ? resource.data : [];
    const applyFilters = (event) => {
        event.preventDefault();
        if (draft.assigneeId && !UUID_PATTERN.test(draft.assigneeId.trim())) {
            setFilterError('Die Zuständigkeits-ID muss eine gültige UUID sein.');
            return;
        }
        setFilterError('');
        setFilters({ ...draft, area: draft.area.trim(), assigneeId: draft.assigneeId.trim() });
    };
    const choose = (todo) => {
        setSelected(todo);
        setCreating(false);
        setMutationError('');
    };
    const changed = async (saved) => {
        await resource.reload();
        setSelected(saved || null);
        setCreating(false);
    };
    const move = async (todo, status) => {
        if (status === todo.status) return;
        setMovingId(todo.id);
        setMutationError('');
        try {
            const saved = await teamApi.moveTodo(todo.id, {
                status,
                position: Number(todo.position) || 0,
                version: todo.version
            });
            await resource.reload();
            if (selected?.id === todo.id) setSelected(saved);
        } catch (error) {
            setMutationError(error.message);
        } finally {
            setMovingId('');
        }
    };

    return (
        <TeamAdminPage
            actions={
                canWrite ? (
                    <button
                        className="admin-forum-primary"
                        onClick={() => {
                            setCreating(true);
                            setSelected(null);
                        }}
                        type="button"
                    >
                        <FaPlus /> Aufgabe anlegen
                    </button>
                ) : null
            }
            description="Persistierte Teamaufgaben nach Status, Bereich und Zuständigkeit filtern, bearbeiten und zwischen Arbeitsständen verschieben."
            error={resource.error}
            eyebrow="ARBEITSPLAN"
            icon={FaListCheck}
            loading={resource.loading}
            onRetry={resource.reload}
            preserveChildrenOnError
            title="Teamaufgaben"
        >
            <TeamPanel
                className="mb-6"
                description="Die Filter werden unverändert an den User-Service gesendet."
                eyebrow="FILTER"
                title="Aufgaben eingrenzen"
            >
                <form className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4" onSubmit={applyFilters}>
                    <FilterSelect
                        label="Status"
                        onChange={(value) => setDraft((current) => ({ ...current, status: value }))}
                        options={TEAM_TODO_STATUSES}
                        placeholder="Alle Status"
                        value={draft.status}
                    />
                    <FilterInput
                        label="Bereich"
                        maxLength={40}
                        onChange={(value) => setDraft((current) => ({ ...current, area: value }))}
                        value={draft.area}
                    />
                    <FilterInput
                        label="Zuständigkeits-ID"
                        onChange={(value) => setDraft((current) => ({ ...current, assigneeId: value }))}
                        placeholder="UUID"
                        value={draft.assigneeId}
                    />
                    <div className="flex items-end">
                        <button className="admin-forum-secondary w-full" type="submit">
                            Filter anwenden
                        </button>
                    </div>
                    {filterError && (
                        <p className="text-xs text-red-300 sm:col-span-2 xl:col-span-4" role="alert">
                            {filterError}
                        </p>
                    )}
                </form>
            </TeamPanel>
            {resource.error ? null : resource.loading ? (
                <TeamLoading title="Aufgaben werden geladen" />
            ) : (
                <div
                    className={
                        'grid gap-6 ' +
                        (creating || selected ? '2xl:grid-cols-[minmax(0,1.55fr)_minmax(390px,.45fr)]' : '')
                    }
                >
                    <div>
                        {mutationError && (
                            <p
                                className="mb-4 rounded-xl border border-red-400/15 bg-red-400/[.04] px-4 py-3 text-xs text-red-300"
                                role="alert"
                            >
                                {mutationError}
                            </p>
                        )}
                        <TodoBoard
                            canWrite={canWrite}
                            movingId={movingId}
                            onMove={move}
                            onSelect={choose}
                            selectedId={selected?.id}
                            todos={todos}
                        />
                    </div>
                    {(creating || selected) && (
                        <TodoEditor
                            canWrite={canWrite}
                            eventTodos={todos}
                            key={creating ? 'new-team-todo' : selected?.id || 'todo-placeholder'}
                            onCancel={() => {
                                setCreating(false);
                                setSelected(null);
                            }}
                            onChanged={changed}
                            todo={creating ? null : selected}
                        />
                    )}
                </div>
            )}
        </TeamAdminPage>
    );
}

function TodoBoard({ todos, selectedId, onSelect, onMove, canWrite, movingId }) {
    if (!todos.length)
        return (
            <TeamPanel eyebrow="AUFGABEN" title="Arbeitsstände">
                <TeamEmpty
                    title="Keine Aufgaben gefunden"
                    text="Der User-Service hat keine Aufgaben für die aktuellen Filter geliefert."
                />
            </TeamPanel>
        );
    return (
        <section aria-label="Aufgaben nach Status" className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {TEAM_TODO_STATUSES.map((status) => {
                const rows = todos.filter((todo) => todo.status === status);
                return (
                    <TodoColumn
                        canWrite={canWrite}
                        key={status}
                        movingId={movingId}
                        onMove={onMove}
                        onSelect={onSelect}
                        rows={rows}
                        selectedId={selectedId}
                        status={status}
                    />
                );
            })}
        </section>
    );
}

function TodoColumn({ status, rows, selectedId, onSelect, onMove, canWrite, movingId }) {
    const scrollRef = useRef(null);
    const virtualized = rows.length > 12;
    const virtualizer = useVirtualizer({
        count: virtualized ? rows.length : 0,
        estimateSize: () => 188,
        getItemKey: (index) => rows[index].id,
        getScrollElement: () => scrollRef.current,
        overscan: 4
    });
    const card = (todo) => (
        <TodoCard
            canWrite={canWrite}
            moving={movingId === todo.id}
            onMove={onMove}
            onSelect={onSelect}
            selected={selectedId === todo.id}
            todo={todo}
        />
    );
    return (
        <div className="min-w-0 rounded-[24px] border border-white/[.065] bg-[#111218]">
            <header className="flex items-center justify-between border-b border-white/[.055] px-4 py-4">
                <h3 className="font-display text-sm font-bold">{STATUS_LABELS[status]}</h3>
                <span className="rounded-full bg-white/[.05] px-2 py-1 text-[9px] font-bold text-zinc-500">
                    {rows.length}
                </span>
            </header>
            {!rows.length ? (
                <p className="px-3 py-8 text-center text-[10px] text-zinc-700">Keine Aufgaben in diesem Status</p>
            ) : virtualized ? (
                <div
                    aria-label={`${STATUS_LABELS[status]} – ${rows.length} Aufgaben`}
                    className="h-[min(68vh,720px)] overflow-auto p-3 [scrollbar-color:#3f3f46_transparent]"
                    ref={scrollRef}
                    tabIndex={0}
                >
                    <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
                        {virtualizer.getVirtualItems().map((virtualRow) => {
                            const todo = rows[virtualRow.index];
                            return (
                                <div
                                    className="absolute left-0 top-0 w-full pb-3"
                                    data-index={virtualRow.index}
                                    key={todo.id}
                                    ref={virtualizer.measureElement}
                                    style={{ transform: `translateY(${virtualRow.start}px)` }}
                                >
                                    {card(todo)}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="space-y-3 p-3">
                    {rows.map((todo) => (
                        <div key={todo.id}>{card(todo)}</div>
                    ))}
                </div>
            )}
        </div>
    );
}

function TodoCard({ todo, selected, onSelect, onMove, canWrite, moving }) {
    const [targetStatus, setTargetStatus] = useState(todo.status);
    return (
        <article
            className={
                'rounded-2xl border p-4 transition ' +
                (selected ? 'border-orange-400/25 bg-orange-400/[.045]' : 'border-white/[.055] bg-black/15')
            }
        >
            <button className="w-full text-left" onClick={() => onSelect(todo)} type="button">
                <span
                    className={
                        'inline-flex rounded-full border px-2 py-1 text-[8px] font-extrabold uppercase ' +
                        (PRIORITY_STYLES[todo.priority] || PRIORITY_STYLES.NORMAL)
                    }
                >
                    {humanizeTeamValue(todo.priority)}
                </span>
                <b className="mt-3 block text-sm leading-5 text-zinc-200">{todo.title}</b>
                <span className="mt-2 block text-[10px] text-zinc-600">
                    {todo.area} · {todo.assigneeUsername || (todo.assigneeId ? 'Zugewiesen' : 'Nicht zugewiesen')}
                </span>
                {todo.dueAt && (
                    <time className="mt-2 block text-[9px] text-zinc-500" dateTime={todo.dueAt}>
                        Fällig {formatTeamDate(todo.dueAt)}
                    </time>
                )}
            </button>
            {canWrite && (
                <div className="mt-4 flex gap-2 border-t border-white/[.05] pt-3">
                    <label className="sr-only" htmlFor={`move-${todo.id}`}>
                        Neuer Status
                    </label>
                    <select
                        className="admin-forum-select-compact min-w-0 flex-1"
                        disabled={moving}
                        id={`move-${todo.id}`}
                        onChange={(event) => setTargetStatus(event.target.value)}
                        value={targetStatus}
                    >
                        {TEAM_TODO_STATUSES.map((status) => (
                            <option key={status} value={status}>
                                {STATUS_LABELS[status]}
                            </option>
                        ))}
                    </select>
                    <button
                        className="admin-forum-secondary !px-2.5"
                        disabled={moving || targetStatus === todo.status}
                        onClick={() => onMove(todo, targetStatus)}
                        type="button"
                    >
                        {moving ? '…' : 'Setzen'}
                    </button>
                </div>
            )}
        </article>
    );
}

function TodoEditor({ todo, eventTodos, canWrite, onChanged, onCancel }) {
    const [message, setMessage] = useState('');
    const form = useForm({
        defaultValues: todoDefaults(todo, eventTodos),
        onSubmit: async ({ value }) => {
            setMessage('');
            const position = Number(value.position);
            if (!value.title.trim() || !value.area.trim()) {
                setMessage('Titel und Bereich sind erforderlich.');
                return;
            }
            if (!Number.isSafeInteger(position) || position < 0) {
                setMessage('Die Position muss eine nicht negative ganze Zahl sein.');
                return;
            }
            if (value.assigneeId && !UUID_PATTERN.test(value.assigneeId.trim())) {
                setMessage('Die Zuständigkeits-ID muss eine gültige UUID sein.');
                return;
            }
            const dueDate = value.dueAt ? new Date(value.dueAt) : null;
            if (dueDate && Number.isNaN(dueDate.getTime())) {
                setMessage('Die Fälligkeit ist ungültig.');
                return;
            }
            try {
                const body = {
                    title: value.title.trim(),
                    description: value.description.trim() || null,
                    area: value.area.trim(),
                    status: value.status,
                    priority: value.priority,
                    assigneeId: value.assigneeId.trim() || null,
                    dueAt: dueDate ? dueDate.toISOString() : null,
                    position
                };
                if (todo) body.version = todo.version;
                const saved = await teamApi.saveTodo(todo?.id, body);
                await onChanged(saved);
            } catch (error) {
                setMessage(error.message);
            }
        }
    });
    const remove = async () => {
        if (!todo || !window.confirm(`Aufgabe „${todo.title}“ endgültig löschen?`)) return;
        setMessage('');
        try {
            await teamApi.deleteTodo(todo.id);
            await onChanged(null);
        } catch (error) {
            setMessage(error.message);
        }
    };
    if (!todo && !canWrite) return null;
    return (
        <TeamPanel
            actions={
                todo && canWrite ? (
                    <button
                        aria-label="Aufgabe löschen"
                        className="grid h-10 w-10 place-items-center rounded-xl border border-red-400/15 bg-red-400/[.05] text-red-300 transition hover:bg-red-400/[.1]"
                        onClick={remove}
                        type="button"
                    >
                        <FaTrash />
                    </button>
                ) : null
            }
            className="h-fit"
            description={
                todo
                    ? `Zuletzt geändert ${formatTeamDate(todo.updatedAt)}`
                    : 'Der nächste Positionswert wird aus den geladenen Aufgaben abgeleitet.'
            }
            eyebrow="EDITOR"
            title={todo ? 'Aufgabe bearbeiten' : 'Aufgabe anlegen'}
        >
            <div className="p-5 sm:p-6">
                <form onSubmit={submitTeamForm(form)}>
                    <fieldset className="disabled:opacity-70" disabled={!canWrite}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <TeamTextField form={form} label="Titel" max="160" name="title" required />
                            </div>
                            <TeamTextField form={form} label="Bereich" max="40" name="area" required />
                            <TeamTextField
                                form={form}
                                label="Position"
                                min="0"
                                name="position"
                                required
                                step="1"
                                type="number"
                            />
                            <TeamSelectField
                                form={form}
                                label="Status"
                                name="status"
                                options={TEAM_TODO_STATUSES.map((status) => [status, STATUS_LABELS[status]])}
                                required
                            />
                            <TeamSelectField
                                form={form}
                                label="Priorität"
                                name="priority"
                                options={TEAM_TODO_PRIORITIES.map((priority) => [
                                    priority,
                                    humanizeTeamValue(priority)
                                ])}
                                required
                            />
                            <div className="sm:col-span-2">
                                <TeamTextField
                                    autoComplete="off"
                                    form={form}
                                    label="Zuständigkeits-ID (UUID)"
                                    name="assigneeId"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <TeamTextField form={form} label="Fällig am" name="dueAt" type="datetime-local" />
                            </div>
                            <div className="sm:col-span-2">
                                <TeamAreaField form={form} label="Beschreibung" maxLength={4000} name="description" />
                            </div>
                        </div>
                    </fieldset>
                    <TeamFormActions
                        canWrite={canWrite}
                        form={form}
                        message={message}
                        onCancel={onCancel}
                        submitLabel={todo ? 'Aufgabe speichern' : 'Aufgabe anlegen'}
                    />
                </form>
            </div>
        </TeamPanel>
    );
}

function FilterInput({ label, value, onChange, placeholder, maxLength }) {
    return (
        <label className="admin-forum-field">
            <span>{label}</span>
            <input
                className="admin-forum-input"
                maxLength={maxLength}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                value={value}
            />
        </label>
    );
}
function FilterSelect({ label, value, onChange, options, placeholder }) {
    return (
        <label className="admin-forum-field">
            <span>{label}</span>
            <select className="admin-forum-input" onChange={(event) => onChange(event.target.value)} value={value}>
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {STATUS_LABELS[option] || humanizeTeamValue(option)}
                    </option>
                ))}
            </select>
        </label>
    );
}
function todoDefaults(todo, todos) {
    if (todo)
        return {
            title: todo.title || '',
            description: todo.description || '',
            area: todo.area || '',
            status: todo.status || 'OPEN',
            priority: todo.priority || 'NORMAL',
            assigneeId: todo.assigneeId || '',
            dueAt: toLocalDateTime(todo.dueAt),
            position: todo.position ?? 0
        };
    const positions = todos.map((item) => Number(item.position)).filter(Number.isFinite);
    return {
        title: '',
        description: '',
        area: '',
        status: 'OPEN',
        priority: 'NORMAL',
        assigneeId: '',
        dueAt: '',
        position: positions.length ? Math.max(...positions) + 1 : 0
    };
}
function toLocalDateTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return shifted.toISOString().slice(0, 16);
}
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

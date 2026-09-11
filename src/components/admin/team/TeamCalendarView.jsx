import { useCallback, useMemo, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { FaCalendarDays, FaPlus, FaTrash } from 'react-icons/fa6';
import { hasAnyPermission } from '../../../lib/auth';
import { TEAM_EVENT_TONES, teamApi } from '../../../lib/teamApi';
import {
    TeamAdminPage,
    TeamAreaField,
    TeamCheckField,
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

const TONE_STYLES = {
    ORANGE: 'border-orange-400/25 bg-orange-400/[.07] text-orange-200',
    VIOLET: 'border-violet-400/25 bg-violet-400/[.07] text-violet-200',
    SKY: 'border-sky-400/25 bg-sky-400/[.07] text-sky-200',
    EMERALD: 'border-emerald-400/25 bg-emerald-400/[.07] text-emerald-200'
};

export default function TeamCalendarView({ user }) {
    const initialRange = useMemo(defaultCalendarRange, []);
    const [from, setFrom] = useState(initialRange.from);
    const [to, setTo] = useState(initialRange.to);
    const [selected, setSelected] = useState(null);
    const [creating, setCreating] = useState(false);
    const canWrite = hasAnyPermission(user, 'team.calendar.write');
    const loader = useCallback(() => {
        const fromInstant = dayStartIso(from);
        const toInstant = dayAfterIso(to);
        if (new Date(toInstant).getTime() - new Date(fromInstant).getTime() > 366 * DAY_MS) {
            throw new Error('Das Kalenderfenster darf höchstens 366 Tage umfassen.');
        }
        return teamApi.calendar({ from: fromInstant, to: toInstant });
    }, [from, to]);
    const resource = useTeamResource(loader, [loader]);
    const events = Array.isArray(resource.data) ? resource.data : [];

    const choose = (event) => {
        setSelected(event);
        setCreating(false);
    };
    const create = () => {
        setSelected(null);
        setCreating(true);
    };
    const changed = async (saved) => {
        await resource.reload();
        setSelected(saved || null);
        setCreating(false);
    };

    return (
        <TeamAdminPage
            actions={
                canWrite ? (
                    <button className="admin-forum-primary" onClick={create} type="button">
                        <FaPlus /> Termin anlegen
                    </button>
                ) : null
            }
            description="Interne Termine zeitlich filtern, planen und mit serverseitigem Versionsschutz bearbeiten."
            error={resource.error}
            eyebrow="TERMINE"
            icon={FaCalendarDays}
            loading={resource.loading}
            onRetry={resource.reload}
            preserveChildrenOnError
            title="Teamkalender"
        >
            <TeamPanel
                className="mb-6"
                description="Das Ende des gewählten Tages wird in das exklusive API-Zeitfenster übersetzt."
                eyebrow="ZEITRAUM"
                title="Kalenderfenster"
            >
                <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:max-w-2xl">
                    <label className="admin-forum-field">
                        <span>Von</span>
                        <input
                            className="admin-forum-input"
                            max={to}
                            min={shiftDate(to, -365)}
                            onChange={(event) => event.target.value && setFrom(event.target.value)}
                            required
                            type="date"
                            value={from}
                        />
                    </label>
                    <label className="admin-forum-field">
                        <span>Bis einschließlich</span>
                        <input
                            className="admin-forum-input"
                            max={shiftDate(from, 365)}
                            min={from}
                            onChange={(event) => event.target.value && setTo(event.target.value)}
                            required
                            type="date"
                            value={to}
                        />
                    </label>
                </div>
            </TeamPanel>
            {resource.error ? null : resource.loading ? (
                <TeamLoading
                    title="Kalender wird geladen"
                    text="Das gewählte Terminfenster wird direkt aus dem User-Service gelesen."
                />
            ) : (
                <div
                    className={
                        'grid gap-6 ' +
                        (creating || selected ? '2xl:grid-cols-[minmax(0,1.1fr)_minmax(390px,.9fr)]' : '')
                    }
                >
                    <CalendarList events={events} onSelect={choose} selectedId={selected?.id} />
                    {(creating || selected) && (
                        <CalendarEditor
                            canWrite={canWrite}
                            event={creating ? null : selected}
                            key={creating ? 'new-calendar-event' : selected?.id || 'calendar-placeholder'}
                            onCancel={() => {
                                setCreating(false);
                                setSelected(null);
                            }}
                            onChanged={changed}
                        />
                    )}
                </div>
            )}
        </TeamAdminPage>
    );
}

function CalendarList({ events, selectedId, onSelect }) {
    return (
        <TeamPanel
            description="Alle überlappenden Termine im gewählten API-Fenster, chronologisch sortiert."
            eyebrow="TERMINE"
            title={`${events.length} Einträge`}
        >
            {events.length ? (
                <div className="divide-y divide-white/[.05]">
                    {events.map((event) => (
                        <button
                            aria-pressed={selectedId === event.id}
                            className={
                                'grid w-full gap-4 px-5 py-5 text-left transition hover:bg-white/[.02] sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:px-6 ' +
                                (selectedId === event.id ? 'bg-orange-400/[.045]' : '')
                            }
                            key={event.id}
                            onClick={() => onSelect(event)}
                            type="button"
                        >
                            <time className="text-xs font-bold text-orange-300" dateTime={event.startsAt}>
                                {formatEventTime(event)}
                            </time>
                            <span className="min-w-0">
                                <b className="block truncate text-sm text-zinc-200">{event.title}</b>
                                <span className="mt-1 block truncate text-xs text-zinc-600">
                                    {event.description || 'Keine Beschreibung'}
                                </span>
                                <span className="mt-2 block text-[9px] uppercase tracking-wider text-zinc-600">
                                    {event.area} · {event.zoneId}
                                </span>
                            </span>
                            <span
                                className={
                                    'h-fit rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase ' +
                                    (TONE_STYLES[event.tone] || TONE_STYLES.ORANGE)
                                }
                            >
                                {humanizeTeamValue(event.tone)}
                            </span>
                        </button>
                    ))}
                </div>
            ) : (
                <TeamEmpty
                    title="Keine Termine im Zeitraum"
                    text="Der User-Service hat für dieses Kalenderfenster keine Einträge geliefert."
                />
            )}
        </TeamPanel>
    );
}

function CalendarEditor({ event, canWrite, onChanged, onCancel }) {
    const [message, setMessage] = useState('');
    const defaults = calendarDefaults(event);
    const form = useForm({
        defaultValues: defaults,
        onSubmit: async ({ value }) => {
            setMessage('');
            if (!value.title.trim() || !value.area.trim() || !value.zoneId.trim()) {
                setMessage('Titel, Bereich und IANA-Zeitzone sind erforderlich.');
                return;
            }
            const startsAt = new Date(value.startsAt);
            const endsAt = new Date(value.endsAt);
            if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
                setMessage('Das Terminende muss nach dem Beginn liegen.');
                return;
            }
            try {
                const body = {
                    title: value.title.trim(),
                    description: value.description.trim() || null,
                    startsAt: startsAt.toISOString(),
                    endsAt: endsAt.toISOString(),
                    allDay: Boolean(value.allDay),
                    zoneId: value.zoneId.trim(),
                    area: value.area.trim(),
                    tone: value.tone
                };
                if (event) body.version = event.version;
                const saved = await teamApi.saveCalendarEvent(event?.id, body);
                await onChanged(saved);
            } catch (error) {
                setMessage(error.message);
            }
        }
    });
    const remove = async () => {
        if (!event || !window.confirm(`Termin „${event.title}“ endgültig löschen?`)) return;
        setMessage('');
        try {
            await teamApi.deleteCalendarEvent(event.id);
            await onChanged(null);
        } catch (error) {
            setMessage(error.message);
        }
    };
    if (!event && !canWrite) return null;
    return (
        <TeamPanel
            actions={
                event && canWrite ? (
                    <button
                        aria-label="Termin löschen"
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
                event
                    ? `Zuletzt geändert ${formatTeamDate(event.updatedAt)}`
                    : 'Ein neuer Termin wird erst nach dem Speichern angelegt.'
            }
            eyebrow="EDITOR"
            title={event ? 'Termin bearbeiten' : 'Termin anlegen'}
        >
            <div className="p-5 sm:p-6">
                <form onSubmit={submitTeamForm(form)}>
                    <fieldset className="disabled:opacity-70" disabled={!canWrite}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <TeamTextField form={form} label="Titel" max="120" name="title" required />
                            </div>
                            <TeamTextField
                                form={form}
                                label="Beginn (lokale Browserzeit)"
                                name="startsAt"
                                required
                                type="datetime-local"
                            />
                            <TeamTextField
                                form={form}
                                label="Ende (lokale Browserzeit)"
                                name="endsAt"
                                required
                                type="datetime-local"
                            />
                            <TeamTextField form={form} label="Bereich" max="40" name="area" required />
                            <TeamSelectField
                                form={form}
                                label="Farbe"
                                name="tone"
                                options={TEAM_EVENT_TONES.map((tone) => [tone, humanizeTeamValue(tone)])}
                                required
                            />
                            <div className="sm:col-span-2">
                                <TeamTextField form={form} label="IANA-Zeitzone" max="64" name="zoneId" required />
                            </div>
                            <div className="sm:col-span-2">
                                <TeamCheckField form={form} label="Ganztägiger Termin" name="allDay" />
                            </div>
                            <div className="sm:col-span-2">
                                <TeamAreaField
                                    form={form}
                                    label="Beschreibung"
                                    maxLength={4000}
                                    name="description"
                                    rows={5}
                                />
                            </div>
                        </div>
                    </fieldset>
                    <TeamFormActions
                        canWrite={canWrite}
                        form={form}
                        message={message}
                        onCancel={onCancel}
                        submitLabel={event ? 'Änderungen speichern' : 'Termin anlegen'}
                    />
                </form>
            </div>
        </TeamPanel>
    );
}

function calendarDefaults(event) {
    if (event)
        return {
            title: event.title || '',
            description: event.description || '',
            startsAt: toLocalDateTime(event.startsAt),
            endsAt: toLocalDateTime(event.endsAt),
            allDay: Boolean(event.allDay),
            zoneId: event.zoneId || browserTimeZone(),
            area: event.area || '',
            tone: event.tone || 'ORANGE'
        };
    const startsAt = new Date();
    startsAt.setMinutes(0, 0, 0);
    startsAt.setHours(startsAt.getHours() + 1);
    const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
    return {
        title: '',
        description: '',
        startsAt: toLocalDateTime(startsAt),
        endsAt: toLocalDateTime(endsAt),
        allDay: false,
        zoneId: browserTimeZone(),
        area: '',
        tone: 'ORANGE'
    };
}

function defaultCalendarRange() {
    const from = new Date();
    from.setDate(1);
    const to = new Date(from);
    to.setMonth(to.getMonth() + 3);
    to.setDate(0);
    return { from: toDateInput(from), to: toDateInput(to) };
}

function shiftDate(value, days) {
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return undefined;
    date.setDate(date.getDate() + days);
    return toDateInput(date);
}
function toDateInput(value) {
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function dayStartIso(value) {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) throw new Error('Bitte einen gültigen Kalenderbeginn wählen.');
    return date.toISOString();
}
function dayAfterIso(value) {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) throw new Error('Bitte ein gültiges Kalenderende wählen.');
    date.setDate(date.getDate() + 1);
    return date.toISOString();
}
function toLocalDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return shifted.toISOString().slice(0, 16);
}
function browserTimeZone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}
function formatEventTime(event) {
    try {
        const options = event.allDay
            ? { dateStyle: 'medium', timeZone: event.zoneId }
            : { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: event.zoneId };
        const formatter = new Intl.DateTimeFormat('de-DE', options);
        const start = formatter.format(new Date(event.startsAt));
        const end = formatter.format(new Date(event.endsAt));
        return start === end ? start : `${start} – ${end}`;
    } catch {
        return `${formatTeamDate(event.startsAt)} – ${formatTeamDate(event.endsAt)}`;
    }
}
const DAY_MS = 24 * 60 * 60 * 1000;

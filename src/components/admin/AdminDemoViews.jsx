import { useMemo, useRef, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
    FaCalendarDay,
    FaCheck,
    FaClock,
    FaFloppyDisk,
    FaGripVertical,
    FaNoteSticky,
    FaPlus,
    FaUserGroup
} from 'react-icons/fa6';
import {
    CALENDAR_EVENTS,
    createActivityEvents,
    STRUCTURE_NODES,
    TEAM_NOTES,
    TODO_LANES
} from '../../data/adminModuleFixtures';
import AdminDemoChart, { TestBadge } from './AdminDemoChart';
import AdminDemoTable from './AdminDemoTable';

export function OverviewView({ chart, rows, title }) {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]">
                <AdminDemoChart config={chart} />
                <OverviewPulse title={title} rows={rows} />
            </div>
            <AdminDemoTable
                rows={rows}
                title={`Operative ${title}-Ansicht`}
                description="Kompakte Arbeitsliste als Vorbereitung für Filter, Detailansicht und spätere Aktionen."
            />
        </div>
    );
}

function OverviewPulse({ rows, title }) {
    return (
        <section className="rounded-[26px] border border-white/[.07] bg-[#111218] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="eyebrow">LIVE-ÜBERBLICK</p>
                    <h3 className="mt-2 font-display text-xl font-bold">Aktuelle Signale</h3>
                    <p className="mt-2 text-xs leading-5 text-zinc-600">Priorisierte Vorschau für {title}.</p>
                </div>
                <TestBadge />
            </div>
            <div className="mt-6 space-y-3">
                {rows.slice(0, 4).map((row, index) => {
                    const values = Object.values(row);
                    return (
                        <div
                            className="group flex items-center gap-4 rounded-2xl border border-white/[.055] bg-black/15 p-4 transition hover:border-orange-400/15"
                            key={`${values[0]}-${index}`}
                        >
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-500/10 font-display text-xs font-black text-orange-300">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <div className="min-w-0 flex-1">
                                <b className="block truncate text-sm text-zinc-200">{values[0]}</b>
                                <p className="mt-1 truncate text-[11px] text-zinc-600">
                                    {values.slice(1, 3).join(' · ')}
                                </p>
                            </div>
                            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.45)]" />
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export function CalendarView() {
    const eventsByDay = useMemo(() => new Map(CALENDAR_EVENTS.map((event) => [event.day, event])), []);

    return (
        <section className="overflow-hidden rounded-[26px] border border-white/[.07] bg-[#111218]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[.06] p-5 sm:px-6">
                <div>
                    <div className="flex items-center gap-3">
                        <p className="eyebrow">MONATSANSICHT</p>
                        <TestBadge />
                    </div>
                    <h3 className="mt-2 font-display text-xl font-bold">September 2026</h3>
                </div>
                <button
                    className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-orange-500/20 px-4 py-2.5 text-xs font-bold text-orange-200/60"
                    disabled
                    type="button"
                >
                    <FaPlus /> Termin hinzufügen
                </button>
            </div>
            <div className="grid grid-cols-7 border-b border-white/[.05] bg-black/10">
                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                    <div
                        className="px-2 py-3 text-center text-[9px] font-extrabold uppercase tracking-[.14em] text-zinc-600"
                        key={day}
                    >
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7">
                {Array.from({ length: 35 }, (_, index) => {
                    const day = index + 1;
                    const event = eventsByDay.get(day);
                    return (
                        <div
                            className="min-h-24 border-b border-r border-white/[.045] p-2 last:border-r-0 sm:min-h-32 sm:p-3"
                            key={day}
                        >
                            <span
                                className={`grid h-7 w-7 place-items-center rounded-lg text-[10px] font-bold ${day === 9 ? 'bg-orange-500 text-white' : 'text-zinc-600'}`}
                            >
                                {day <= 30 ? day : ''}
                            </span>
                            {event && day <= 30 && (
                                <div
                                    className={`mt-2 rounded-lg border px-2 py-2 text-[9px] font-bold leading-4 ${calendarTone(event.tone)}`}
                                >
                                    {event.title}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function calendarTone(tone) {
    return {
        orange: 'border-orange-400/20 bg-orange-400/[.07] text-orange-200',
        violet: 'border-violet-400/20 bg-violet-400/[.07] text-violet-200',
        sky: 'border-sky-400/20 bg-sky-400/[.07] text-sky-200',
        emerald: 'border-emerald-400/20 bg-emerald-400/[.07] text-emerald-200'
    }[tone];
}

export function BoardView() {
    return (
        <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <p className="eyebrow">AUFGABENBOARD</p>
                    <TestBadge />
                </div>
                <button
                    className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-orange-500/20 px-4 py-2.5 text-xs font-bold text-orange-200/60"
                    disabled
                    type="button"
                >
                    <FaPlus /> Aufgabe erstellen
                </button>
            </div>
            <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
                {TODO_LANES.map((lane) => (
                    <article className="rounded-[24px] border border-white/[.07] bg-[#111218] p-4" key={lane.title}>
                        <div className="flex items-center justify-between gap-3 px-1">
                            <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${laneDot(lane.tone)}`} />
                                <h3 className="text-sm font-bold text-zinc-200">{lane.title}</h3>
                            </div>
                            <span className="rounded-full bg-white/[.035] px-2.5 py-1 text-[9px] font-bold text-zinc-600">
                                {lane.items.length}
                            </span>
                        </div>
                        <div className="mt-4 space-y-3">
                            {lane.items.map(([title, area, priority]) => (
                                <div
                                    className="rounded-2xl border border-white/[.06] bg-[#0c0d11] p-4 shadow-[0_12px_28px_rgba(0,0,0,.12)]"
                                    key={title}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <b className="text-sm leading-5 text-zinc-200">{title}</b>
                                        <FaGripVertical className="mt-1 shrink-0 text-[10px] text-zinc-700" />
                                    </div>
                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                                        <span className="rounded-full border border-white/[.06] px-2.5 py-1 text-[9px] font-bold text-zinc-600">
                                            {area}
                                        </span>
                                        <span
                                            className={`text-[9px] font-extrabold uppercase tracking-wider ${priority === 'Hoch' ? 'text-orange-300' : 'text-zinc-600'}`}
                                        >
                                            {priority}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

function laneDot(tone) {
    return {
        orange: 'bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,.45)]',
        sky: 'bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,.4)]',
        emerald: 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.4)]',
        zinc: 'bg-zinc-500'
    }[tone];
}

export function NotesView() {
    return (
        <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <p className="eyebrow">NOTIZSAMMLUNG</p>
                    <TestBadge />
                </div>
                <button
                    className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-orange-500/20 px-4 py-2.5 text-xs font-bold text-orange-200/60"
                    disabled
                    type="button"
                >
                    <FaNoteSticky /> Neue Notiz
                </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {TEAM_NOTES.map(([title, text, author, tag], index) => (
                    <article
                        className={`group relative min-h-56 overflow-hidden rounded-[24px] border bg-[#111218] p-5 transition hover:-translate-y-0.5 ${index === 0 ? 'border-orange-400/20' : 'border-white/[.07]'}`}
                        key={title}
                    >
                        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-orange-500/[.035] blur-2xl" />
                        <div className="relative flex items-start justify-between gap-4">
                            <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500/10 text-orange-300">
                                <FaNoteSticky />
                            </span>
                            <span className="rounded-full border border-white/[.06] px-2.5 py-1 text-[9px] font-bold text-zinc-600">
                                {tag}
                            </span>
                        </div>
                        <h3 className="relative mt-5 font-display text-lg font-bold text-zinc-100">{title}</h3>
                        <p className="relative mt-3 text-xs leading-6 text-zinc-500">{text}</p>
                        <div className="relative mt-5 flex items-center justify-between border-t border-white/[.05] pt-4 text-[10px] text-zinc-700">
                            <span>{author}</span>
                            <span>vor {index + 1} Std.</span>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

export function StructureView() {
    return (
        <section className="rounded-[26px] border border-white/[.07] bg-[#111218] p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="eyebrow">FORUMBAUM</p>
                    <h3 className="mt-2 font-display text-xl font-bold">Kategorien und Bereiche</h3>
                    <p className="mt-2 text-xs text-zinc-600">Geplante Sortier- und Strukturansicht des Forums.</p>
                </div>
                <TestBadge />
            </div>
            <div className="mt-6 space-y-4">
                {STRUCTURE_NODES.map((node, nodeIndex) => (
                    <article className="rounded-2xl border border-white/[.06] bg-black/15 p-4" key={node.title}>
                        <div className="flex items-center gap-4">
                            <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500/10 font-display text-xs font-black text-orange-300">
                                {String(nodeIndex + 1).padStart(2, '0')}
                            </span>
                            <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-bold text-zinc-200">{node.title}</h4>
                                <p className="mt-1 text-[11px] text-zinc-600">{node.description}</p>
                            </div>
                            <FaGripVertical className="text-zinc-700" />
                        </div>
                        <div className="ml-5 mt-4 space-y-2 border-l border-white/[.07] pl-5 sm:ml-10">
                            {node.children.map((child, childIndex) => (
                                <div
                                    className="flex items-center gap-3 rounded-xl border border-white/[.05] bg-[#0d0e12] px-4 py-3"
                                    key={child}
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400/70" />
                                    <span className="flex-1 text-xs font-semibold text-zinc-400">{child}</span>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-700">
                                        Position {childIndex + 1}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

export function ActivityView({ chart }) {
    return (
        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,.85fr)]">
            <AdminDemoChart config={chart} />
            <VirtualActivityStream />
        </div>
    );
}

function VirtualActivityStream() {
    const events = useMemo(() => createActivityEvents(), []);
    const scrollRef = useRef(null);
    const virtualizer = useVirtualizer({
        count: events.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 72,
        getItemKey: (index) => events[index].id,
        overscan: 6
    });

    return (
        <section className="overflow-hidden rounded-[26px] border border-white/[.07] bg-[#111218]">
            <div className="flex items-start justify-between gap-4 border-b border-white/[.06] p-5 sm:px-6">
                <div>
                    <p className="eyebrow">AKTIVITÄTSSTREAM</p>
                    <h3 className="mt-2 font-display text-xl font-bold">Letzte Teamaktionen</h3>
                    <p className="mt-2 text-xs text-zinc-600">80 Einträge, performant mit TanStack Virtual.</p>
                </div>
                <TestBadge />
            </div>
            <div ref={scrollRef} className="h-[420px] overflow-auto [scrollbar-color:#3f3f46_transparent]">
                <div className="relative" style={{ height: `${virtualizer.getTotalSize()}px` }}>
                    {virtualizer.getVirtualItems().map((item) => {
                        const event = events[item.index];
                        return (
                            <div
                                className="absolute left-0 top-0 w-full px-5 sm:px-6"
                                data-index={item.index}
                                key={event.id}
                                ref={virtualizer.measureElement}
                                style={{ transform: `translateY(${item.start}px)` }}
                            >
                                <div className="flex min-h-[72px] items-center gap-4 border-b border-white/[.05] py-3">
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orange-500/10 text-xs text-orange-300">
                                        <FaCheck />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <b className="block truncate text-xs text-zinc-300">{event.action}</b>
                                        <p className="mt-1 truncate text-[10px] text-zinc-600">
                                            {event.actor} · {event.area}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                                            {event.status}
                                        </span>
                                        <time className="mt-1 block text-[9px] text-zinc-700">{event.time}</time>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export function SettingsView({ fields, title }) {
    const [submitted, setSubmitted] = useState(false);
    const defaultValues = useMemo(() => Object.fromEntries(fields.map((field) => [field.name, field.value])), [fields]);
    const form = useForm({
        defaultValues,
        onSubmit: async () => {
            setSubmitted(true);
            window.setTimeout(() => setSubmitted(false), 2600);
        }
    });

    return (
        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)]">
            <section className="overflow-hidden rounded-[26px] border border-white/[.07] bg-[#111218]">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[.06] p-5 sm:px-6">
                    <div>
                        <p className="eyebrow">KONFIGURATION</p>
                        <h3 className="mt-2 font-display text-xl font-bold">{title}</h3>
                        <p className="mt-2 text-xs leading-5 text-zinc-600">
                            Interaktive Formularvorschau mit TanStack Form. Es wird nichts an ein Backend übertragen.
                        </p>
                    </div>
                    <TestBadge />
                </div>
                <form
                    className="p-5 sm:p-6"
                    onSubmit={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <div className="grid gap-5 md:grid-cols-2">
                        {fields.map((field) => (
                            <form.Field key={field.name} name={field.name}>
                                {(fieldApi) =>
                                    field.type === 'checkbox' ? (
                                        <label className="flex min-h-24 cursor-pointer items-center gap-4 rounded-2xl border border-white/[.065] bg-black/15 p-4">
                                            <input
                                                checked={Boolean(fieldApi.state.value)}
                                                className="h-4 w-4 accent-orange-500"
                                                onBlur={fieldApi.handleBlur}
                                                onChange={(event) => fieldApi.handleChange(event.target.checked)}
                                                type="checkbox"
                                            />
                                            <span className="text-xs font-bold leading-5 text-zinc-300">
                                                {field.label}
                                            </span>
                                        </label>
                                    ) : (
                                        <label className="block">
                                            <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-[.12em] text-zinc-500">
                                                {field.label}
                                            </span>
                                            <input
                                                className="h-12 w-full rounded-xl border border-white/[.07] bg-[#0b0c10] px-4 text-sm text-zinc-200 outline-none transition focus:border-orange-400/30"
                                                onBlur={fieldApi.handleBlur}
                                                onChange={(event) => fieldApi.handleChange(event.target.value)}
                                                type={field.type}
                                                value={fieldApi.state.value}
                                            />
                                        </label>
                                    )
                                }
                            </form.Field>
                        ))}
                    </div>
                    <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-white/[.055] pt-5">
                        <span className="text-[10px] leading-5 text-zinc-600">
                            Nur lokale UI-Vorschau · keine Speicherung
                        </span>
                        <form.Subscribe
                            selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
                        >
                            {({ canSubmit, isSubmitting }) => (
                                <button
                                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-xs font-black text-white transition hover:bg-orange-400 disabled:opacity-50"
                                    disabled={!canSubmit || isSubmitting}
                                    type="submit"
                                >
                                    <FaFloppyDisk /> {isSubmitting ? 'Wird geprüft …' : 'Vorschau anwenden'}
                                </button>
                            )}
                        </form.Subscribe>
                    </div>
                </form>
            </section>
            <SettingsSummary submitted={submitted} fields={fields} />
        </div>
    );
}

function SettingsSummary({ submitted, fields }) {
    return (
        <aside className="rounded-[26px] border border-white/[.07] bg-[#111218] p-5 sm:p-6">
            <p className="eyebrow">FORMULARSTATUS</p>
            <h3 className="mt-2 font-display text-xl font-bold">Vorbereitung</h3>
            <div className="mt-6 space-y-3">
                <SummaryRow icon={FaCheck} label={`${fields.length} Felder definiert`} tone="emerald" />
                <SummaryRow icon={FaUserGroup} label="Berechtigungsprüfung vorgesehen" tone="sky" />
                <SummaryRow icon={FaClock} label="Audit-Log noch nicht angebunden" tone="orange" />
                <SummaryRow icon={FaCalendarDay} label="Versionierung noch nicht angebunden" tone="violet" />
            </div>
            <div
                className={`mt-6 rounded-2xl border p-4 text-xs leading-5 transition ${submitted ? 'border-emerald-400/20 bg-emerald-400/[.06] text-emerald-200' : 'border-dashed border-white/[.08] bg-black/15 text-zinc-600'}`}
            >
                {submitted
                    ? 'Die Eingaben wurden ausschließlich lokal validiert. Es wurden keine Daten gespeichert.'
                    : 'Nach der Backend-Planung kommen Speichern, Änderungsverlauf und Berechtigungen hinzu.'}
            </div>
        </aside>
    );
}

function SummaryRow({ icon: Icon, label, tone }) {
    const toneClass = {
        emerald: 'bg-emerald-400/[.08] text-emerald-300',
        sky: 'bg-sky-400/[.08] text-sky-300',
        orange: 'bg-orange-400/[.08] text-orange-300',
        violet: 'bg-violet-400/[.08] text-violet-300'
    }[tone];
    return (
        <div className="flex items-center gap-3 rounded-xl border border-white/[.055] bg-black/15 px-3 py-3">
            <span className={`grid h-8 w-8 place-items-center rounded-lg text-[10px] ${toneClass}`}>
                <Icon />
            </span>
            <span className="text-xs font-semibold text-zinc-400">{label}</span>
        </div>
    );
}

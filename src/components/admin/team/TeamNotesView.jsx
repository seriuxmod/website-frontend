import { useCallback, useEffect, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { FaMagnifyingGlass, FaNoteSticky, FaPlus, FaSpinner, FaThumbtack, FaTrash } from 'react-icons/fa6';
import { hasAnyPermission } from '../../../lib/auth';
import { teamApi } from '../../../lib/teamApi';
import {
    TeamAdminPage,
    TeamAreaField,
    TeamCheckField,
    TeamEmpty,
    TeamFormActions,
    TeamLoading,
    TeamPagination,
    TeamPanel,
    TeamTextField,
    formatTeamDate,
    submitTeamForm,
    useTeamResource
} from './AdminTeamShared';

export default function TeamNotesView({ user }) {
    const [input, setInput] = useState('');
    const [query, debouncer] = useDebouncedValue(input, { wait: 300 }, (state) => ({ isPending: state.isPending }));
    const [tag, setTag] = useState('');
    const [pinned, setPinned] = useState('');
    const [page, setPage] = useState(0);
    const [selected, setSelected] = useState(null);
    const [creating, setCreating] = useState(false);
    const canWrite = hasAnyPermission(user, 'team.notes.write');
    const loader = useCallback(
        () => teamApi.notes({ q: query.trim(), tag: tag.trim(), pinned, page, size: 24 }),
        [page, pinned, query, tag]
    );
    const resource = useTeamResource(loader, [loader]);
    const data = resource.data;
    const notes = Array.isArray(data?.content) ? data.content : [];

    useEffect(() => {
        setPage(0);
    }, [query]);
    const changed = async (saved) => {
        await resource.reload();
        setSelected(saved || null);
        setCreating(false);
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
                        <FaPlus /> Notiz anlegen
                    </button>
                ) : null
            }
            description="Gemeinsame Arbeitsnotizen serverseitig durchsuchen, filtern und mit Versionsschutz pflegen."
            error={resource.error}
            eyebrow="WISSEN"
            icon={FaNoteSticky}
            loading={resource.loading}
            onRetry={resource.reload}
            preserveChildrenOnError
            title="Teamnotizen"
        >
            <TeamPanel
                className="mb-6"
                description="Die Texteingabe wird mit TanStack Pacer gedrosselt und anschließend als q-Parameter an den User-Service gesendet."
                eyebrow="SUCHE"
                title="Notizen filtern"
            >
                <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[minmax(260px,1fr)_220px_200px]">
                    <label className="admin-forum-field relative">
                        <span>Volltextsuche</span>
                        <span className="relative">
                            <FaMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-zinc-600" />
                            <input
                                className="admin-forum-input !pl-10 !pr-10"
                                maxLength="200"
                                onChange={(event) => setInput(event.target.value)}
                                placeholder="Titel oder Inhalt …"
                                type="search"
                                value={input}
                            />
                            {debouncer.state.isPending && (
                                <FaSpinner className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-xs text-orange-300" />
                            )}
                        </span>
                    </label>
                    <label className="admin-forum-field">
                        <span>Tag</span>
                        <input
                            className="admin-forum-input"
                            maxLength="40"
                            onChange={(event) => {
                                setTag(event.target.value);
                                setPage(0);
                            }}
                            placeholder="Exakter Tag"
                            value={tag}
                        />
                    </label>
                    <label className="admin-forum-field">
                        <span>Angeheftet</span>
                        <select
                            className="admin-forum-input"
                            onChange={(event) => {
                                setPinned(event.target.value);
                                setPage(0);
                            }}
                            value={pinned}
                        >
                            <option value="">Alle Notizen</option>
                            <option value="true">Nur angeheftete</option>
                            <option value="false">Nicht angeheftete</option>
                        </select>
                    </label>
                </div>
            </TeamPanel>
            {resource.error ? null : resource.loading || !data ? (
                <TeamLoading title="Notizen werden geladen" />
            ) : (
                <div
                    className={
                        'grid gap-6 ' +
                        (creating || selected ? '2xl:grid-cols-[minmax(0,1.2fr)_minmax(390px,.8fr)]' : '')
                    }
                >
                    <TeamPanel
                        description={`${data.totalElements ?? 0} Treffer aus dem User-Service`}
                        eyebrow="NOTIZEN"
                        title="Arbeitswissen"
                    >
                        {notes.length ? (
                            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3 2xl:grid-cols-2">
                                {notes.map((note) => (
                                    <button
                                        aria-pressed={selected?.id === note.id}
                                        className={
                                            'min-h-48 rounded-2xl border p-5 text-left transition hover:border-orange-400/20 hover:bg-orange-400/[.025] ' +
                                            (selected?.id === note.id
                                                ? 'border-orange-400/25 bg-orange-400/[.045]'
                                                : 'border-white/[.06] bg-black/15')
                                        }
                                        key={note.id}
                                        onClick={() => {
                                            setSelected(note);
                                            setCreating(false);
                                        }}
                                        type="button"
                                    >
                                        <span className="flex items-start justify-between gap-3">
                                            {note.tag ? (
                                                <span className="rounded-full bg-white/[.05] px-2 py-1 text-[8px] font-extrabold uppercase text-zinc-500">
                                                    {note.tag}
                                                </span>
                                            ) : (
                                                <span />
                                            )}
                                            {note.pinned && (
                                                <FaThumbtack className="text-orange-300" title="Angeheftet" />
                                            )}
                                        </span>
                                        <b className="mt-4 block text-sm leading-5 text-zinc-200">{note.title}</b>
                                        <span className="mt-2 line-clamp-4 whitespace-pre-wrap text-xs leading-5 text-zinc-600">
                                            {note.content}
                                        </span>
                                        <span className="mt-4 block text-[9px] text-zinc-700">
                                            Geändert {formatTeamDate(note.updatedAt)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <TeamEmpty
                                title="Keine Notizen gefunden"
                                text="Für Suche und Filter hat der User-Service keine Notizen geliefert."
                            />
                        )}
                        <TeamPagination
                            onPage={setPage}
                            page={Number(data.page) || 0}
                            totalPages={Number(data.totalPages) || 0}
                        />
                    </TeamPanel>
                    {(creating || selected) && (
                        <NoteEditor
                            canWrite={canWrite}
                            key={creating ? 'new-team-note' : selected?.id || 'note-placeholder'}
                            note={creating ? null : selected}
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

function NoteEditor({ note, canWrite, onChanged, onCancel }) {
    const [message, setMessage] = useState('');
    const form = useForm({
        defaultValues: note
            ? {
                  title: note.title || '',
                  content: note.content || '',
                  tag: note.tag || '',
                  pinned: Boolean(note.pinned)
              }
            : { title: '', content: '', tag: '', pinned: false },
        onSubmit: async ({ value }) => {
            setMessage('');
            if (!value.title.trim() || !value.content.trim()) {
                setMessage('Titel und Inhalt sind erforderlich.');
                return;
            }
            try {
                const body = {
                    title: value.title.trim(),
                    content: value.content,
                    tag: value.tag.trim() || null,
                    pinned: Boolean(value.pinned)
                };
                if (note) body.version = note.version;
                const saved = await teamApi.saveNote(note?.id, body);
                await onChanged(saved);
            } catch (error) {
                setMessage(error.message);
            }
        }
    });
    const remove = async () => {
        if (!note || !window.confirm(`Notiz „${note.title}“ endgültig löschen?`)) return;
        setMessage('');
        try {
            await teamApi.deleteNote(note.id);
            await onChanged(null);
        } catch (error) {
            setMessage(error.message);
        }
    };
    if (!note && !canWrite) return null;
    return (
        <TeamPanel
            actions={
                note && canWrite ? (
                    <button
                        aria-label="Notiz löschen"
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
                note
                    ? `Erstellt von ${note.createdByUsername || note.createdById || 'Nicht verfügbar'} · geändert ${formatTeamDate(note.updatedAt)}`
                    : 'Eine neue Notiz wird erst beim Speichern persistiert.'
            }
            eyebrow="EDITOR"
            title={note ? 'Notiz bearbeiten' : 'Notiz anlegen'}
        >
            <div className="p-5 sm:p-6">
                <form onSubmit={submitTeamForm(form)}>
                    <fieldset className="disabled:opacity-70" disabled={!canWrite}>
                        <div className="space-y-4">
                            <TeamTextField form={form} label="Titel" max="120" name="title" required />
                            <TeamTextField form={form} label="Tag" max="40" name="tag" />
                            <TeamCheckField form={form} label="Notiz anheften" name="pinned" />
                            <TeamAreaField
                                form={form}
                                label="Inhalt"
                                maxLength={10000}
                                name="content"
                                required
                                rows={14}
                            />
                        </div>
                    </fieldset>
                    <TeamFormActions
                        canWrite={canWrite}
                        form={form}
                        message={message}
                        onCancel={onCancel}
                        submitLabel={note ? 'Notiz speichern' : 'Notiz anlegen'}
                    />
                </form>
            </div>
        </TeamPanel>
    );
}

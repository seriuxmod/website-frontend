import { useCallback, useEffect, useMemo, useState } from 'react';
import { FaClock, FaLinkSlash, FaUserCheck, FaUserGroup, FaUsers } from 'react-icons/fa6';
import { hasAnyPermission } from '../../../lib/auth';
import { socialApi } from '../../../lib/socialApi';
import { AdminMetricCard } from '../AdminUi';
import {
    AdminDataTable,
    AdminManagementEmpty,
    AdminManagementLoading,
    AdminManagementPage,
    AdminPagination,
    AdminPanel,
    StatusPill,
    columnHelper,
    formatDate,
    useAdminResource
} from './AdminManagementShared';
import {
    ServerSearch,
    SnapshotChart,
    UserRef,
    humanize,
    metric,
    pageRows,
    pageTotal,
    useServerSearch
} from './SocialAdminShared';

const PAGE_SIZE = 25;
export default function FriendsAdminView({ user }) {
    const [mode, setMode] = useState('friendships');
    const [input, setInput] = useState('');
    const [query, debouncer] = useServerSearch(input);
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(0);
    const canWrite = hasAnyPermission(user, 'social.friends.write');
    const overview = useAdminResource(
        useCallback(() => socialApi.admin.friendsOverview(), []),
        []
    );
    const loader = useCallback(
        () =>
            mode === 'friendships'
                ? socialApi.admin.friendships({ q: query, page, size: PAGE_SIZE })
                : socialApi.admin.friendRequests({ q: query, status, page, size: PAGE_SIZE }),
        [mode, page, query, status]
    );
    const resource = useAdminResource(loader, [loader]);
    const rows = pageRows(resource.data);
    useEffect(() => setPage(0), [mode, query, status]);
    const reload = () => Promise.all([overview.reload(), resource.reload()]);
    return (
        <AdminManagementPage
            backend="Social-Backend"
            description="Freundschaften und offene Anfragen nachvollziehen, ohne die privaten Profile der Spieler zu verändern."
            error={overview.error || resource.error}
            eyebrow="BEZIEHUNGEN"
            icon={FaUserGroup}
            loading={overview.loading || resource.loading}
            onRetry={reload}
            title="Freunde"
        >
            {overview.loading && !overview.data ? (
                <AdminManagementLoading title="Freundschaftsnetz wird ausgewertet" />
            ) : (
                <>
                    <Metrics data={overview.data || {}} />
                    <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,.65fr)]">
                        <AdminPanel
                            actions={
                                <>
                                    <div className="flex rounded-xl border border-white/[.07] bg-[#0b0c10] p-1">
                                        <Mode active={mode === 'friendships'} onClick={() => setMode('friendships')}>
                                            Freundschaften
                                        </Mode>
                                        <Mode active={mode === 'requests'} onClick={() => setMode('requests')}>
                                            Anfragen
                                        </Mode>
                                    </div>
                                    {mode === 'requests' && (
                                        <select
                                            className="admin-forum-select-compact"
                                            onChange={(event) => setStatus(event.target.value)}
                                            value={status}
                                        >
                                            <option value="">Alle Status</option>
                                            {['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED'].map((value) => (
                                                <option key={value}>{value}</option>
                                            ))}
                                        </select>
                                    )}
                                </>
                            }
                            description="Vollständig serverseitig gefilterte Social-Datensätze."
                            eyebrow="VERZEICHNIS"
                            title={mode === 'friendships' ? 'Freundschaften' : 'Freundschaftsanfragen'}
                        >
                            <div className="border-b border-white/[.05] p-5">
                                <ServerSearch
                                    onChange={setInput}
                                    pending={debouncer.state.isPending}
                                    placeholder="Name oder UUID suchen …"
                                    value={input}
                                />
                            </div>
                            {resource.loading ? (
                                <div className="p-6">
                                    <AdminManagementLoading title="Einträge werden geladen" />
                                </div>
                            ) : (
                                <FriendTable canWrite={canWrite} mode={mode} reload={reload} rows={rows} />
                            )}
                            <AdminPagination
                                onPage={setPage}
                                page={Number(resource.data?.page) || 0}
                                size={Number(resource.data?.size) || PAGE_SIZE}
                                total={pageTotal(resource.data)}
                            />
                        </AdminPanel>
                        <SnapshotChart
                            description="Aktueller Zustand der Freundschaftsdatenbank."
                            rows={[
                                { label: 'Freundschaften', value: overview.data?.friendships },
                                { label: 'Offen', value: overview.data?.pendingRequests },
                                { label: 'Abgelaufen', value: overview.data?.expiredRequests }
                            ]}
                            title="Netzwerkstatus"
                        />
                    </section>
                </>
            )}
        </AdminManagementPage>
    );
}
function Metrics({ data }) {
    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminMetricCard
                detail="bestätigte Verbindungen"
                icon={FaUserCheck}
                label="Freundschaften"
                tone="orange"
                value={metric(data.friendships)}
            />
            <AdminMetricCard
                detail="eindeutige Spieler"
                icon={FaUsers}
                label="Vernetzte Nutzer"
                tone="sky"
                value={metric(data.distinctUsers)}
            />
            <AdminMetricCard
                detail="wartet auf Antwort"
                icon={FaClock}
                label="Offene Anfragen"
                tone="violet"
                value={metric(data.pendingRequests)}
            />
            <AdminMetricCard
                detail="letzte 30 Tage"
                icon={FaUserGroup}
                label="Neue Verbindungen"
                tone="emerald"
                value={metric(data.acceptedRequestsLast30Days)}
            />
        </section>
    );
}
function Mode({ active, onClick, children }) {
    return (
        <button
            className={`rounded-lg px-3 py-2 text-[10px] font-extrabold transition ${active ? 'bg-orange-500 text-white' : 'text-zinc-500 hover:text-zinc-200'}`}
            onClick={onClick}
            type="button"
        >
            {children}
        </button>
    );
}
function FriendTable({ rows, mode, canWrite, reload }) {
    const columns = useMemo(
        () =>
            columnHelper.columns(
                mode === 'friendships'
                    ? [
                          columnHelper.accessor('firstUser', {
                              header: 'Spieler 1',
                              cell: (c) => <UserRef value={c.getValue()} />
                          }),
                          columnHelper.accessor('secondUser', {
                              header: 'Spieler 2',
                              cell: (c) => <UserRef value={c.getValue()} />
                          }),
                          columnHelper.accessor('createdAt', {
                              header: 'Seit',
                              cell: (c) => <time className="text-xs text-zinc-500">{formatDate(c.getValue())}</time>
                          }),
                          columnHelper.display({
                              id: 'action',
                              header: '',
                              cell: (c) =>
                                  canWrite ? (
                                      <button
                                          className="admin-forum-danger"
                                          onClick={async () => {
                                              const reason = askReason('Interne Begründung:');
                                              if (!reason) return;
                                              await socialApi.admin.removeFriendship(c.row.original.id, reason);
                                              await reload();
                                          }}
                                          type="button"
                                      >
                                          <FaLinkSlash /> Trennen
                                      </button>
                                  ) : null
                          })
                      ]
                    : [
                          columnHelper.accessor('sender', {
                              header: 'Absender',
                              cell: (c) => <UserRef value={c.getValue()} />
                          }),
                          columnHelper.accessor('receiver', {
                              header: 'Empfänger',
                              cell: (c) => <UserRef value={c.getValue()} />
                          }),
                          columnHelper.accessor('status', {
                              header: 'Status',
                              cell: (c) => <StatusPill value={humanize(c.getValue())} />
                          }),
                          columnHelper.accessor('createdAt', {
                              header: 'Erstellt',
                              cell: (c) => <time className="text-xs text-zinc-500">{formatDate(c.getValue())}</time>
                          }),
                          columnHelper.display({
                              id: 'action',
                              header: '',
                              cell: (c) =>
                                  canWrite && c.row.original.status === 'PENDING' ? (
                                      <div className="flex flex-wrap justify-end gap-2">
                                          <RequestAction
                                              label="Verwerfen"
                                              onApply={async () => {
                                                  const reason = askReason('Begründung für das Verwerfen:');
                                                  if (!reason) return;
                                                  await socialApi.admin.updateFriendRequest(
                                                      c.row.original.id,
                                                      'DECLINED',
                                                      reason
                                                  );
                                                  await reload();
                                              }}
                                          />
                                          <RequestAction
                                              label="Ablaufen lassen"
                                              secondary
                                              onApply={async () => {
                                                  const reason = askReason('Begründung für das vorzeitige Ablaufen:');
                                                  if (!reason) return;
                                                  await socialApi.admin.updateFriendRequest(
                                                      c.row.original.id,
                                                      'EXPIRED',
                                                      reason
                                                  );
                                                  await reload();
                                              }}
                                          />
                                      </div>
                                  ) : null
                          })
                      ]
            ),
        [canWrite, mode, reload]
    );
    return rows.length ? (
        <AdminDataTable
            columns={columns}
            getSearchValue={(row) => JSON.stringify(row)}
            rows={rows}
            searchPlaceholder="Geladene Seite filtern …"
        />
    ) : (
        <AdminManagementEmpty
            title="Keine Einträge vorhanden"
            text="Für den gewählten Filter existieren aktuell keine Social-Datensätze."
        />
    );
}

function RequestAction({ label, onApply, secondary = false }) {
    return (
        <button
            className={secondary ? 'admin-forum-secondary !px-3 !py-2' : 'admin-forum-danger'}
            onClick={onApply}
            type="button"
        >
            {label}
        </button>
    );
}

function askReason(message) {
    const reason = window.prompt(message)?.trim();
    if (!reason) return null;
    if (reason.length > 500) {
        window.alert('Die Begründung darf höchstens 500 Zeichen lang sein.');
        return null;
    }
    return reason;
}

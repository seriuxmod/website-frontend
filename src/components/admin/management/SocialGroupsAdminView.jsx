import { useCallback, useEffect, useMemo, useState } from 'react';
import { FaClock, FaDoorOpen, FaPeopleGroup, FaShieldHalved, FaUserGroup, FaUsers } from 'react-icons/fa6';
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
    formatNumber,
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
const CONFIG = {
    clans: {
        title: 'Clans',
        icon: FaShieldHalved,
        read: 'social.clans.read',
        write: 'social.clans.write',
        statuses: ['ACTIVE', 'DISABLED'],
        overview: () => socialApi.admin.clansOverview(),
        list: (args) => socialApi.admin.clans(args),
        detail: (id) => socialApi.admin.clan(id)
    },
    parties: {
        title: 'Parties',
        icon: FaPeopleGroup,
        read: 'social.parties.read',
        write: 'social.parties.write',
        statuses: ['ACTIVE', 'DISBANDED'],
        overview: () => socialApi.admin.partiesOverview(),
        list: (args) => socialApi.admin.parties(args),
        detail: (id) => socialApi.admin.party(id)
    }
};
export default function SocialGroupsAdminView({ user, kind }) {
    const config = CONFIG[kind];
    const [input, setInput] = useState('');
    const [query, debouncer] = useServerSearch(input);
    const [page, setPage] = useState(0);
    const [status, setStatus] = useState('');
    const [selectedId, setSelectedId] = useState('');
    const canWrite = hasAnyPermission(user, config.write);
    const overview = useAdminResource(useCallback(config.overview, [config]), [config]);
    const loader = useCallback(
        () => config.list({ q: query, status, page, size: PAGE_SIZE }),
        [config, page, query, status]
    );
    const resource = useAdminResource(loader, [loader]);
    const detailLoader = useCallback(
        () => (selectedId ? config.detail(selectedId) : Promise.resolve(null)),
        [config, selectedId]
    );
    const detail = useAdminResource(detailLoader, [detailLoader]);
    useEffect(() => setPage(0), [query, status]);
    const reload = () => Promise.all([overview.reload(), resource.reload(), detail.reload()]);
    const rows = pageRows(resource.data);
    return (
        <AdminManagementPage
            backend="Social-Backend"
            description={
                kind === 'clans'
                    ? 'Clans, Mitgliedschaften und Einladungen zentral prüfen und auffällige Gemeinschaften deaktivieren.'
                    : 'Aktive Spielgruppen, Mitglieder und Einladungen in Echtzeit überblicken und bei Bedarf geordnet auflösen.'
            }
            error={overview.error || resource.error}
            eyebrow="COMMUNITY-STRUKTUR"
            icon={config.icon}
            loading={overview.loading || resource.loading}
            onRetry={reload}
            title={config.title}
        >
            {overview.loading && !overview.data ? (
                <AdminManagementLoading title={`${config.title} werden ausgewertet`} />
            ) : (
                <>
                    <Metrics data={overview.data || {}} kind={kind} />
                    <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.3fr)_minmax(370px,.7fr)]">
                        <AdminPanel
                            actions={
                                <select
                                    className="admin-forum-select-compact"
                                    onChange={(e) => setStatus(e.target.value)}
                                    value={status}
                                >
                                    <option value="">Alle Status</option>
                                    {config.statuses.map((v) => (
                                        <option key={v}>{v}</option>
                                    ))}
                                </select>
                            }
                            description="Suche und Statusfilter werden vom Social-Service ausgewertet."
                            eyebrow="VERZEICHNIS"
                            title={config.title}
                        >
                            <div className="border-b border-white/[.05] p-5">
                                <ServerSearch
                                    onChange={setInput}
                                    pending={debouncer.state.isPending}
                                    placeholder={`${config.title} suchen …`}
                                    value={input}
                                />
                            </div>
                            {resource.loading ? (
                                <div className="p-6">
                                    <AdminManagementLoading title={`${config.title} werden geladen`} />
                                </div>
                            ) : (
                                <GroupsTable kind={kind} onOpen={setSelectedId} rows={rows} />
                            )}
                            <AdminPagination
                                onPage={setPage}
                                page={Number(resource.data?.page) || 0}
                                size={Number(resource.data?.size) || PAGE_SIZE}
                                total={pageTotal(resource.data)}
                            />
                        </AdminPanel>
                        <GroupDetail canWrite={canWrite} detail={detail} kind={kind} onChanged={reload} />
                    </section>
                    <section className="mt-6">
                        <SnapshotChart
                            description="Persistierter Gesamtzustand aus dem Social-Service."
                            rows={chartRows(kind, overview.data || {})}
                            title={`${config.title}-Status`}
                        />
                    </section>
                </>
            )}
        </AdminManagementPage>
    );
}
function Metrics({ data, kind }) {
    const rows =
        kind === 'clans'
            ? [
                  [data.activeClans, 'Aktive Clans', FaShieldHalved, 'orange'],
                  [data.disabledClans, 'Deaktiviert', FaDoorOpen, 'red'],
                  [data.activeMemberships, 'Mitgliedschaften', FaUsers, 'sky'],
                  [data.pendingInvitations, 'Offene Einladungen', FaClock, 'violet']
              ]
            : [
                  [data.activeParties, 'Aktive Parties', FaPeopleGroup, 'orange'],
                  [data.disbandedParties, 'Aufgelöst', FaDoorOpen, 'red'],
                  [data.activeMembers, 'Aktive Mitglieder', FaUsers, 'sky'],
                  [data.averageActivePartySize, 'Ø Gruppengröße', FaUserGroup, 'violet']
              ];
    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {rows.map(([value, label, Icon, tone]) => (
                <AdminMetricCard
                    detail="Live aus dem Social-Service"
                    icon={Icon}
                    key={label}
                    label={label}
                    tone={tone}
                    value={metric(value)}
                />
            ))}
        </section>
    );
}
function GroupsTable({ rows, kind, onOpen }) {
    const columns = useMemo(
        () =>
            columnHelper.columns([
                columnHelper.accessor('name', {
                    header: kind === 'clans' ? 'Clan' : 'Party',
                    cell: (c) => (
                        <div>
                            <b className="block text-sm text-zinc-200">{c.getValue() || 'Ohne Namen'}</b>
                            <span className="text-[9px] text-zinc-600">
                                {kind === 'clans' && c.row.original.tag ? `[${c.row.original.tag}] · ` : ''}$
                                {c.row.original.id}
                            </span>
                        </div>
                    )
                }),
                columnHelper.accessor('owner', { header: 'Inhaber', cell: (c) => <UserRef value={c.getValue()} /> }),
                columnHelper.accessor('activeMembers', {
                    header: 'Mitglieder',
                    cell: (c) => <b className="text-xs">{formatNumber(c.getValue())}</b>
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
                    id: 'open',
                    header: '',
                    cell: (c) => (
                        <button
                            className="admin-forum-secondary !px-3 !py-2"
                            onClick={() => onOpen(c.row.original.id)}
                            type="button"
                        >
                            Öffnen
                        </button>
                    )
                })
            ]),
        [kind, onOpen]
    );
    return rows.length ? (
        <AdminDataTable
            columns={columns}
            getSearchValue={(row) => `${row.name} ${row.tag || ''} ${row.owner?.username || ''}`}
            rows={rows}
            searchPlaceholder="Geladene Seite filtern …"
        />
    ) : (
        <AdminManagementEmpty
            title={`Keine ${kind === 'clans' ? 'Clans' : 'Parties'} vorhanden`}
            text="Der gewählte Filter enthält keine Datensätze."
        />
    );
}
function GroupDetail({ detail, kind, canWrite, onChanged }) {
    if (!detail.data && !detail.loading)
        return (
            <AdminPanel className="h-fit" eyebrow="DETAILS" title="Auswahl">
                <AdminManagementEmpty
                    title="Kein Eintrag ausgewählt"
                    text="Öffne links einen Eintrag für Mitglieder, Einladungen und Maßnahmen."
                />
            </AdminPanel>
        );
    if (detail.loading)
        return (
            <AdminPanel className="h-fit" eyebrow="DETAILS" title="Wird geladen">
                <div className="p-5">
                    <AdminManagementLoading />
                </div>
            </AdminPanel>
        );
    if (detail.error)
        return (
            <AdminPanel className="h-fit" eyebrow="DETAILS" title="Nicht verfügbar">
                <AdminManagementEmpty title="Details konnten nicht geladen werden" text={detail.error} />
            </AdminPanel>
        );
    const value = kind === 'clans' ? detail.data.clan : detail.data.party;
    const members = detail.data.members || [];
    const apply = async () => {
        const requiresReason = kind === 'parties' || value.status === 'ACTIVE';
        const reason = window
            .prompt(
                kind === 'clans'
                    ? value.status === 'ACTIVE'
                        ? 'Grund für die Deaktivierung:'
                        : 'Interne Notiz zur Reaktivierung (optional):'
                    : 'Grund für das Auflösen:'
            )
            ?.trim();
        if (reason === undefined || (requiresReason && !reason)) return;
        if (reason.length > 500) {
            window.alert('Die Begründung darf höchstens 500 Zeichen lang sein.');
            return;
        }
        if (kind === 'clans')
            await socialApi.admin.updateClanStatus(
                value.id,
                value.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
                reason || null
            );
        else await socialApi.admin.disbandParty(value.id, reason);
        await onChanged();
    };
    return (
        <AdminPanel
            actions={
                canWrite && (kind === 'clans' || value.status === 'ACTIVE') ? (
                    <button
                        className={value.status === 'ACTIVE' ? 'admin-forum-danger' : 'admin-forum-secondary'}
                        onClick={apply}
                        type="button"
                    >
                        {kind === 'clans'
                            ? value.status === 'ACTIVE'
                                ? 'Deaktivieren'
                                : 'Reaktivieren'
                            : 'Party auflösen'}
                    </button>
                ) : null
            }
            className="h-fit"
            eyebrow="DETAILS"
            title={value.name || 'Ohne Namen'}
        >
            <div className="space-y-5 p-5">
                <div className="flex items-center justify-between gap-3">
                    <UserRef value={value.owner} />
                    <StatusPill value={humanize(value.status)} />
                </div>
                <p className="text-xs leading-5 text-zinc-500">
                    {value.description || `${members.length} geladene Mitglieder`}
                </p>
                <div className="max-h-[360px] divide-y divide-white/[.045] overflow-auto rounded-2xl border border-white/[.055] bg-black/15">
                    {members.map((member) => (
                        <div
                            className="flex items-center justify-between gap-3 px-4 py-3"
                            key={member.id || member.userId}
                        >
                            <span className="font-mono text-[10px] text-zinc-400">{member.userId}</span>
                            <span className="text-[9px] font-bold text-zinc-600">
                                {humanize(member.rankKey)} · {humanize(member.status)}
                            </span>
                        </div>
                    ))}
                    {!members.length && (
                        <p className="p-6 text-center text-xs text-zinc-600">Keine Mitglieder vorhanden.</p>
                    )}
                </div>
            </div>
        </AdminPanel>
    );
}
function chartRows(kind, data) {
    return kind === 'clans'
        ? [
              { label: 'Aktiv', value: data.activeClans },
              { label: 'Deaktiviert', value: data.disabledClans },
              { label: 'Offen', value: data.openClans },
              { label: 'Einladungen', value: data.pendingInvitations }
          ]
        : [
              { label: 'Aktiv', value: data.activeParties },
              { label: 'Aufgelöst', value: data.disbandedParties },
              { label: 'Mitglieder', value: data.activeMembers },
              { label: 'Einladungen', value: data.pendingInvitations }
          ];
}

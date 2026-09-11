import { useCallback, useMemo } from 'react';
import { areaY, defineChart, lineY } from '@tanstack/charts';
import { Chart } from '@tanstack/charts/react/tooltip';
import { scaleLinear, scalePoint } from 'd3-scale';
import { FaCalendarCheck, FaListCheck, FaUserCheck, FaUsers } from 'react-icons/fa6';
import { teamApi } from '../../../lib/teamApi';
import { AdminMetricCard } from '../AdminUi';
import {
    TeamAdminPage,
    TeamEmpty,
    TeamLoading,
    TeamPanel,
    TeamTable,
    formatTeamDate,
    formatTeamNumber,
    humanizeTeamValue,
    shortTeamId,
    teamColumnHelper,
    useTeamResource
} from './AdminTeamShared';

export default function TeamOverviewView() {
    const resource = useTeamResource(
        useCallback(() => teamApi.overview(), []),
        []
    );
    const data = resource.data;
    return (
        <TeamAdminPage
            description="Aktive Teammitglieder, offene Arbeit, kommende Termine und der echte Änderungsverlauf aus dem User-Service."
            error={resource.error}
            eyebrow="LIVE-ÜBERSICHT"
            icon={FaUsers}
            loading={resource.loading}
            onRetry={resource.reload}
            title="Teamübersicht"
        >
            {resource.loading || !data ? (
                <TeamLoading
                    title="Teamübersicht wird geladen"
                    text="Mitglieder, Aufgaben und Aktivität werden aktuell aggregiert."
                />
            ) : (
                <>
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <AdminMetricCard
                            icon={FaUsers}
                            label="Teammitglieder"
                            tone="orange"
                            value={formatTeamNumber(data.memberCount)}
                            detail={`Stand ${formatTeamDate(data.generatedAt)}`}
                        />
                        <AdminMetricCard
                            icon={FaUserCheck}
                            label="Heute aktiv"
                            tone="emerald"
                            value={formatTeamNumber(data.activeTodayCount)}
                            detail="Vom User-Service ermittelte Aktivität"
                        />
                        <AdminMetricCard
                            icon={FaListCheck}
                            label="Offene Aufgaben"
                            tone="sky"
                            value={formatTeamNumber(data.openTodoCount)}
                            detail="Nicht als erledigt markiert"
                        />
                        <AdminMetricCard
                            icon={FaCalendarCheck}
                            label="Kommende Termine"
                            tone="violet"
                            value={formatTeamNumber(data.upcomingEventCount)}
                            detail={`Zeitzone ${data.zoneId || 'Nicht verfügbar'}`}
                        />
                    </section>
                    <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,.8fr)]">
                        <TeamActivityChart buckets={data.activityBuckets || []} />
                        <RecentActivity rows={data.recentActivity || []} />
                    </section>
                    <div className="mt-6">
                        <MembersTable rows={data.members || []} />
                    </div>
                </>
            )}
        </TeamAdminPage>
    );
}

function TeamActivityChart({ buckets }) {
    const rows = useMemo(
        () =>
            buckets.map((bucket) => ({
                label: shortBucket(bucket.startsAt),
                count: Number(bucket.count) || 0,
                startsAt: bucket.startsAt
            })),
        [buckets]
    );
    const definition = useMemo(() => (rows.length ? defineActivityChart(rows) : null), [rows]);
    return (
        <TeamPanel
            description="Anzahl protokollierter Teamaktionen je vom Backend gelieferter Zeitspanne."
            eyebrow="AKTIVITÄT"
            title="Teamverlauf"
        >
            {definition ? (
                <div className="min-h-[340px] px-2 pb-5 pt-6 text-zinc-300 sm:px-5">
                    <Chart ariaLabel="Teamaktivität im Zeitverlauf" definition={definition} height={300} />
                </div>
            ) : (
                <TeamEmpty
                    title="Noch kein Aktivitätsverlauf"
                    text="Protokollierte Teamaktionen erscheinen nach der ersten Änderung hier."
                />
            )}
        </TeamPanel>
    );
}

function defineActivityChart(rows) {
    return defineChart({
        marks: [
            areaY(rows, {
                id: 'team-overview-activity-area',
                x: 'label',
                y: 'count',
                fill: 'url(#team-overview-gradient)',
                fillOpacity: 0.7
            }),
            lineY(rows, {
                id: 'team-overview-activity-line',
                x: 'label',
                y: 'count',
                stroke: '#fb923c',
                strokeWidth: 2.5,
                points: true
            })
        ],
        scales: {
            x: { scale: () => scalePoint().padding(0.22), axis: { label: 'Zeitraum' } },
            y: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'Aktionen' } }
        },
        gradients: [
            {
                id: 'team-overview-gradient',
                x1: 0,
                y1: 1,
                x2: 0,
                y2: 0,
                stops: [
                    { offset: 0, color: '#fb923c', opacity: 0.01 },
                    { offset: 1, color: '#fb923c', opacity: 0.34 }
                ]
            }
        ],
        clip: true,
        theme: {
            foreground: '#d4d4d8',
            muted: '#5f6069',
            grid: '#272931',
            background: 'transparent',
            palette: ['#fb923c']
        }
    });
}

function RecentActivity({ rows }) {
    return (
        <TeamPanel
            description="Zuletzt persistierte Änderungen in den Teamwerkzeugen."
            eyebrow="AUDIT"
            title="Letzte Aktionen"
        >
            {rows.length ? (
                <div className="divide-y divide-white/[.05]">
                    {rows.map((row) => (
                        <article className="flex items-start gap-3 px-5 py-4" key={row.id}>
                            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-orange-400" />
                            <div className="min-w-0 flex-1">
                                <b className="block text-xs text-zinc-300">{humanizeTeamValue(row.action)}</b>
                                <p className="mt-1 truncate text-[10px] text-zinc-600">
                                    {row.actorUsername || shortTeamId(row.actorId)} ·{' '}
                                    {row.area || humanizeTeamValue(row.entityType)}
                                </p>
                            </div>
                            <time className="shrink-0 text-right text-[9px] text-zinc-600" dateTime={row.occurredAt}>
                                {formatTeamDate(row.occurredAt)}
                            </time>
                        </article>
                    ))}
                </div>
            ) : (
                <TeamEmpty
                    title="Noch keine Aktionen"
                    text="Kalender-, Aufgaben- und Notizänderungen werden hier unverfälscht angezeigt."
                />
            )}
        </TeamPanel>
    );
}

function MembersTable({ rows }) {
    const columns = useMemo(
        () =>
            teamColumnHelper.columns([
                teamColumnHelper.accessor('username', {
                    header: 'Mitglied',
                    cell: (context) => (
                        <b className="text-zinc-200">{context.getValue() || shortTeamId(context.row.original.id)}</b>
                    )
                }),
                teamColumnHelper.accessor('groups', {
                    header: 'Gruppen',
                    cell: (context) => <span>{(context.getValue() || []).join(', ') || 'Keine Gruppen'}</span>
                }),
                teamColumnHelper.accessor('surfaces', {
                    header: 'Bereiche',
                    cell: (context) => (
                        <span>
                            {Array.from(context.getValue() || [])
                                .map(humanizeTeamValue)
                                .join(', ') || 'Keine Bereiche'}
                        </span>
                    )
                }),
                teamColumnHelper.accessor('activeToday', {
                    header: 'Heute',
                    cell: (context) => (
                        <span className={context.getValue() ? 'text-emerald-300' : 'text-zinc-600'}>
                            {context.getValue() ? 'Aktiv' : 'Nicht aktiv'}
                        </span>
                    )
                }),
                teamColumnHelper.accessor('lastSeenAt', {
                    header: 'Zuletzt gesehen',
                    cell: (context) => <time dateTime={context.getValue()}>{formatTeamDate(context.getValue())}</time>
                })
            ]),
        []
    );
    return (
        <TeamPanel
            description="Mitglieder, deren Gruppen und vom Backend zugeordnete Arbeitsbereiche."
            eyebrow="TEAM"
            title="Mitglieder"
        >
            <TeamTable
                caption="Teammitglieder"
                columns={columns}
                rows={rows}
                emptyTitle="Keine Teammitglieder vorhanden"
                emptyText="Sobald der User-Service Teamzugänge ausweist, erscheinen sie hier."
            />
        </TeamPanel>
    );
}

function shortBucket(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? String(value || '')
        : new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' }).format(date);
}

import { FaCircleCheck, FaDatabase, FaFlask, FaLayerGroup, FaListCheck } from 'react-icons/fa6';
import { AdminMetricCard } from '../../components/admin/AdminUi';
import AdminDemoTable from '../../components/admin/AdminDemoTable';
import AdminSystemStatusView from '../../components/admin/AdminSystemStatusView';
import {
    ActivityView,
    BoardView,
    CalendarView,
    NotesView,
    OverviewView,
    SettingsView,
    StructureView
} from '../../components/admin/AdminDemoViews';
import { adminNavigationGroups } from '../../config/adminNavigation';
import {
    FORM_FIELDS,
    MODULE_METRICS,
    OVERVIEW_CHARTS,
    OVERVIEW_TABLES,
    SECTION_METRICS,
    TABLE_DATA
} from '../../data/adminModuleFixtures';

const MODULE_ROUTES = {
    'system-status': '/admin/system-status',
    team: '/admin/team',
    'team-calendar': '/admin/team/calendar',
    'team-activity': '/admin/team/activity',
    'team-todos': '/admin/team/todos',
    'team-notes': '/admin/team/notes',
    players: '/admin/players',
    permissions: '/admin/permissions',
    cosmetics: '/admin/cosmetics',
    friends: '/admin/friends',
    clans: '/admin/clans',
    parties: '/admin/parties',
    'public-servers': '/admin/public-servers',
    translations: '/admin/translations',
    moderation: '/admin/moderation',
    bans: '/admin/moderation/bans',
    mutes: '/admin/moderation/mutes',
    'moderation-settings': '/admin/moderation/settings',
    'forum-analytics': '/admin/forum/analytics',
    'forum-structure': '/admin/forum/structure',
    'forum-permissions': '/admin/forum/permissions',
    'forum-labels': '/admin/forum/labels',
    'forum-reports': '/admin/forum/reports',
    'forum-suggestions': '/admin/forum/suggestions',
    'forum-blog': '/admin/forum/blog',
    'forum-settings': '/admin/forum/settings',
    commerce: '/admin/commerce',
    customers: '/admin/commerce/customers',
    catalog: '/admin/commerce/catalog',
    fields: '/admin/commerce/fields',
    coupons: '/admin/commerce/coupons',
    orders: '/admin/commerce/orders',
    'payment-methods': '/admin/commerce/payment-methods',
    'commerce-settings': '/admin/commerce/settings'
};

const MODULE_TITLES = {
    team: 'Teamübersicht',
    moderation: 'Moderationsübersicht',
    commerce: 'Shopübersicht'
};

const MODULE_KINDS = {
    'system-status': 'overview',
    team: 'overview',
    'team-calendar': 'calendar',
    'team-activity': 'activity',
    'team-todos': 'board',
    'team-notes': 'notes',
    moderation: 'overview',
    'forum-analytics': 'overview',
    'forum-structure': 'structure',
    'moderation-settings': 'settings',
    'forum-settings': 'settings',
    commerce: 'overview',
    'commerce-settings': 'settings'
};

const METRIC_ICONS = [FaDatabase, FaLayerGroup, FaListCheck, FaCircleCheck];

export default function AdminModulePreview({ module }) {
    const isLiveStatus = module === 'system-status';
    const route = MODULE_ROUTES[module] ?? MODULE_ROUTES.players;
    const group = adminNavigationGroups.find((candidate) => candidate.items.some((item) => item.to === route));
    const item = group?.items.find((candidate) => candidate.to === route);
    const Icon = item?.icon ?? FaDatabase;
    const title = MODULE_TITLES[module] ?? item?.label ?? 'Administrationsmodul';
    const description = item?.description ?? 'Demonstrative Arbeitsfläche für den späteren Datenanschluss.';
    const metrics = MODULE_METRICS[module] ?? SECTION_METRICS[group?.label] ?? SECTION_METRICS.Verwaltung;

    return (
        <div>
            <header className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <p className="eyebrow">
                            {group?.label ?? 'Verwaltung'} · {isLiveStatus ? 'LIVE-MONITORING' : 'UI-PROTOTYP'}
                        </p>
                        <span
                            className={`rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.14em] ${
                                isLiveStatus
                                    ? 'border-emerald-400/20 bg-emerald-400/[.07] text-emerald-300'
                                    : 'border-amber-400/20 bg-amber-400/[.07] text-amber-200'
                            }`}
                        >
                            {isLiveStatus ? 'Status-Backend verbunden' : 'Noch nicht implementiert'}
                        </span>
                    </div>
                    <h2 className="mt-3 flex items-center gap-4 font-display text-3xl font-bold tracking-[-.04em] sm:text-4xl">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-400/[.09] text-lg text-orange-300">
                            <Icon />
                        </span>
                        {title}
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500">{description}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-[9px] font-extrabold uppercase tracking-[.13em] text-zinc-600">
                    <span className="rounded-full border border-white/[.07] bg-white/[.025] px-3 py-2">
                        {isLiveStatus ? 'REST API' : 'UI-Prototyp'}
                    </span>
                    <span className="rounded-full border border-white/[.07] bg-white/[.025] px-3 py-2">
                        {isLiveStatus ? 'Auto-Refresh 15s' : 'Keine Backend-Verbindung'}
                    </span>
                </div>
            </header>

            {!isLiveStatus && (
                <div className="mb-6 flex items-start gap-4 rounded-2xl border border-amber-400/15 bg-amber-400/[.045] p-4 text-amber-100/80">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-400/10 text-amber-300">
                        <FaFlask />
                    </span>
                    <div>
                        <b className="text-sm text-amber-100">Demonstrativer Testdatensatz</b>
                        <p className="mt-1 text-xs leading-5 text-amber-100/55">
                            Alle Werte dieser Modulansicht sind lokal erzeugt und eindeutig als Testdaten markiert. Es
                            werden weder neue Backend-Endpunkte abgefragt noch Änderungen gespeichert.
                        </p>
                    </div>
                </div>
            )}

            {isLiveStatus ? (
                <AdminSystemStatusView />
            ) : (
                <>
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {metrics.map(([value, label, tone], index) => (
                            <AdminMetricCard
                                detail={`${label} · Testdatensatz`}
                                icon={METRIC_ICONS[index]}
                                key={label}
                                label={`Kennzahl 0${index + 1}`}
                                tone={tone}
                                value={value}
                            />
                        ))}
                    </section>

                    <section className="mt-6">{renderModuleView(module, title)}</section>
                </>
            )}
        </div>
    );
}

function renderModuleView(module, title) {
    const kind = MODULE_KINDS[module] ?? 'table';

    if (kind === 'overview') {
        return <OverviewView chart={OVERVIEW_CHARTS[module]} rows={OVERVIEW_TABLES[module]} title={title} />;
    }
    if (kind === 'calendar') return <CalendarView />;
    if (kind === 'activity') return <ActivityView chart={OVERVIEW_CHARTS[module]} />;
    if (kind === 'board') return <BoardView />;
    if (kind === 'notes') return <NotesView />;
    if (kind === 'structure') return <StructureView />;
    if (kind === 'settings') return <SettingsView fields={FORM_FIELDS[module]} title={title} />;

    return <AdminDemoTable rows={TABLE_DATA[module] ?? TABLE_DATA.players} title={`${title} verwalten`} />;
}

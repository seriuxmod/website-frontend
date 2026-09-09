import {
    FaArrowRight,
    FaBagShopping,
    FaBan,
    FaBoxesStacked,
    FaChartColumn,
    FaCircleCheck,
    FaCircleNodes,
    FaCreditCard,
    FaDatabase,
    FaFlask,
    FaGear,
    FaGift,
    FaLayerGroup,
    FaListCheck,
    FaMagnifyingGlass,
    FaMoneyCheckDollar,
    FaObjectGroup,
    FaPeopleGroup,
    FaReceipt,
    FaServer,
    FaShieldHalved,
    FaTags,
    FaUserGroup,
    FaUserShield,
    FaUsers,
    FaVolumeXmark
} from 'react-icons/fa6';
import { AdminMetricCard } from '../../components/admin/AdminUi';

const MODULES = {
    'system-status': {
        section: 'Allgemein',
        title: 'Systemstatus',
        description: 'Zentrale Betriebsansicht für Services, Abhängigkeiten und laufende Störungen.',
        icon: FaServer
    },
    players: {
        section: 'Verwaltung',
        title: 'Spieler',
        description: 'Spieler suchen, Profildaten prüfen und den Lebenszyklus eines Kontos nachvollziehen.',
        icon: FaUsers
    },
    permissions: {
        section: 'Verwaltung',
        title: 'Berechtigungen',
        description: 'Gruppen, direkte Rechte und zeitlich begrenzte Zuweisungen übersichtlich verwalten.',
        icon: FaUserShield
    },
    cosmetics: {
        section: 'Verwaltung',
        title: 'Cosmetics',
        description: 'Cosmetics, Freischaltungen, Sichtbarkeit und Asset-Zuordnungen an einem Ort verwalten.',
        icon: FaGift
    },
    friends: {
        section: 'Verwaltung',
        title: 'Freunde',
        description: 'Freundschaften, offene Anfragen und auffällige Verbindungen prüfen.',
        icon: FaUserGroup
    },
    clans: {
        section: 'Verwaltung',
        title: 'Clans',
        description: 'Clans, Mitglieder, Ränge, Einladungen und Statistiken administrieren.',
        icon: FaShieldHalved
    },
    parties: {
        section: 'Verwaltung',
        title: 'Parties',
        description: 'Aktive Parties, Mitglieder, Rollen und Einladungen nachvollziehen.',
        icon: FaPeopleGroup
    },
    moderation: {
        section: 'Moderation',
        title: 'Moderationsübersicht',
        description: 'Offene Vorgänge, aktuelle Maßnahmen und die Auslastung des Moderationsteams bündeln.',
        icon: FaChartColumn
    },
    bans: {
        section: 'Moderation',
        title: 'Bans',
        description: 'Aktive und abgelaufene Kontosperren mit Begründung und Verlauf anzeigen.',
        icon: FaBan
    },
    mutes: {
        section: 'Moderation',
        title: 'Mutes',
        description: 'Kommunikationssperren, Laufzeiten und zugehörige Moderationsnotizen verwalten.',
        icon: FaVolumeXmark
    },
    'moderation-settings': {
        section: 'Moderation',
        title: 'Moderationseinstellungen',
        description: 'Ban- und Mute-Gründe sowie die Standardlaufzeiten zentral konfigurieren.',
        icon: FaGear
    },
    'forum-analytics': {
        section: 'Forum',
        title: 'Nutzungsstatistik',
        description: 'Aktivität, neue Themen, Antworten und wiederkehrende Nutzer auswerten.',
        icon: FaChartColumn
    },
    'forum-structure': {
        section: 'Forum',
        title: 'Struktur',
        description: 'Kategorien, Foren und deren Reihenfolge in einer gemeinsamen Struktur pflegen.',
        icon: FaCircleNodes
    },
    'forum-permissions': {
        section: 'Forum',
        title: 'Gruppenrechte',
        description: 'Lesen, Schreiben und Moderation pro Forum und Benutzergruppe definieren.',
        icon: FaUserShield
    },
    'forum-labels': {
        section: 'Forum',
        title: 'Labels',
        description: 'Labeltypen, Darstellung und erlaubte Bereiche des Forums konfigurieren.',
        icon: FaTags
    },
    'forum-reports': {
        section: 'Forum',
        title: 'Meldungen',
        description: 'Gemeldete Beiträge und Themen priorisiert prüfen und bearbeiten.',
        icon: FaBan
    },
    'forum-suggestions': {
        section: 'Forum',
        title: 'Vorschläge',
        description: 'Community-Vorschläge, Abstimmungen, Kategorien und Status verwalten.',
        icon: FaListCheck
    },
    'forum-blog': {
        section: 'Forum',
        title: 'Blog',
        description: 'Beiträge entwerfen, veröffentlichen und für die Landingpage aufbereiten.',
        icon: FaObjectGroup
    },
    'forum-settings': {
        section: 'Forum',
        title: 'Forumeinstellungen',
        description: 'Globale Inhaltsgrenzen, Reaktionen und Filterregeln festlegen.',
        icon: FaGear
    },
    commerce: {
        section: 'E-Commerce',
        title: 'Shopübersicht',
        description: 'Kennzahlen, Bestellungen, Umsatz und operative Shop-Hinweise bündeln.',
        icon: FaBagShopping
    },
    customers: {
        section: 'E-Commerce',
        title: 'Kunden',
        description: 'Kundenkonten, Guthaben, Bestellverlauf und Berechtigungen einsehen.',
        icon: FaUsers
    },
    catalog: {
        section: 'E-Commerce',
        title: 'Katalog',
        description: 'Kategorien und Produkte mit Preisen, Sichtbarkeit und Limits pflegen.',
        icon: FaBoxesStacked
    },
    fields: {
        section: 'E-Commerce',
        title: 'Produktfelder',
        description: 'Zusätzliche Produktangaben, Validierungen und Auswahloptionen definieren.',
        icon: FaLayerGroup
    },
    coupons: {
        section: 'E-Commerce',
        title: 'Coupons',
        description: 'Rabattcodes, Laufzeiten, Produktbindungen und Einlöselimits verwalten.',
        icon: FaTags
    },
    orders: {
        section: 'E-Commerce',
        title: 'Bestellungen',
        description: 'Bestellstatus, Zahlungen, Empfänger und digitale Auslieferung verfolgen.',
        icon: FaReceipt
    },
    'payment-methods': {
        section: 'E-Commerce',
        title: 'Zahlungsmethoden',
        description: 'Anbieter, sichtbare Zahlarten und deren Betriebsstatus konfigurieren.',
        icon: FaCreditCard
    },
    'commerce-settings': {
        section: 'E-Commerce',
        title: 'Shop-Einstellungen',
        description: 'Firmendaten, Währung, Steuern, Rechnungen und Checkout zentral konfigurieren.',
        icon: FaMoneyCheckDollar
    }
};

const TEST_METRICS = {
    Allgemein: [
        ['14', 'Elemente in der Vorschau'],
        ['12', 'Beispielwerte verfügbar'],
        ['1', 'Hinweis zur Datenquelle'],
        ['Entwurf', 'aktueller Modulstatus']
    ],
    Verwaltung: [
        ['24', 'Beispieleinträge'],
        ['6', 'aktive Ansichten'],
        ['3', 'vorgesehene Filter'],
        ['Entwurf', 'aktueller Modulstatus']
    ],
    Moderation: [
        ['4', 'offene Testvorgänge'],
        ['2', 'Beispielmaßnahmen'],
        ['8', 'vorgesehene Filter'],
        ['Entwurf', 'aktueller Modulstatus']
    ],
    Forum: [
        ['1.284', 'simulierte Aufrufe'],
        ['312', 'Beispieleinträge'],
        ['7', 'offene Testmeldungen'],
        ['Entwurf', 'aktueller Modulstatus']
    ],
    'E-Commerce': [
        ['42', 'simulierte Bestellungen'],
        ['18', 'Beispielkunden'],
        ['6', 'Testprodukte'],
        ['Entwurf', 'aktueller Modulstatus']
    ]
};

const METRIC_ICONS = [FaDatabase, FaLayerGroup, FaListCheck, FaCircleCheck];
const METRIC_TONES = ['orange', 'sky', 'violet', 'emerald'];

export default function AdminModulePreview({ module }) {
    const config = MODULES[module] ?? MODULES.players;
    const Icon = config.icon;
    const metrics = TEST_METRICS[config.section] ?? TEST_METRICS.Verwaltung;
    const rows = createPreviewRows(config.title);

    return (
        <div>
            <header className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <p className="eyebrow">{config.section} · UI-VORSCHAU</p>
                        <span className="rounded-full border border-amber-400/20 bg-amber-400/[.07] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.14em] text-amber-200">
                            Noch nicht implementiert
                        </span>
                    </div>
                    <h2 className="mt-3 flex items-center gap-4 font-display text-3xl font-bold tracking-[-.04em] sm:text-4xl">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-orange-400/15 bg-orange-400/[.08] text-lg text-orange-300">
                            <Icon />
                        </span>
                        {config.title}
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500">{config.description}</p>
                </div>
                <button
                    className="inline-flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/[.07] bg-white/[.025] px-4 text-xs font-bold text-zinc-600"
                    disabled
                    type="button"
                >
                    <FaMagnifyingGlass /> Suche folgt mit der API
                </button>
            </header>

            <div className="mb-6 flex items-start gap-4 rounded-2xl border border-amber-400/15 bg-amber-400/[.045] p-4 text-amber-100/80">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-400/10 text-amber-300">
                    <FaFlask />
                </span>
                <div>
                    <b className="text-sm text-amber-100">Lokaler Testdatensatz</b>
                    <p className="mt-1 text-xs leading-5 text-amber-100/55">
                        Diese Seite zeigt ausschließlich den geplanten Aufbau. Es werden keine neuen Backend-Daten
                        geladen und keine Änderungen gespeichert.
                    </p>
                </div>
            </div>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map(([value, detail], index) => (
                    <AdminMetricCard
                        detail={`${detail} · Testdatensatz`}
                        icon={METRIC_ICONS[index]}
                        key={detail}
                        label={index === 3 ? 'Modulstatus' : `Kennzahl 0${index + 1}`}
                        tone={METRIC_TONES[index]}
                        value={value}
                    />
                ))}
            </section>

            <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.55fr)]">
                <article className="overflow-hidden rounded-[26px] border border-white/[.07] bg-[#111218]">
                    <div className="flex flex-col gap-4 border-b border-white/[.06] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div>
                            <p className="eyebrow">LAYOUT-VORSCHAU</p>
                            <h3 className="mt-2 font-display text-xl font-bold">{config.title} verwalten</h3>
                        </div>
                        <button
                            className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-orange-500/20 px-4 py-2.5 text-xs font-bold text-orange-200/50"
                            disabled
                            type="button"
                        >
                            Aktion wird später angebunden
                        </button>
                    </div>
                    <div className="divide-y divide-white/[.05] px-5 sm:px-6">
                        {rows.map((row, index) => (
                            <div
                                className="grid gap-3 py-5 sm:grid-cols-[44px_minmax(0,1fr)_auto_auto] sm:items-center"
                                key={row.title}
                            >
                                <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/[.06] bg-black/20 text-xs font-black text-zinc-600">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <div className="min-w-0">
                                    <b className="block truncate text-sm text-zinc-200">{row.title}</b>
                                    <span className="mt-1 block truncate text-xs text-zinc-600">{row.description}</span>
                                </div>
                                <span className="w-fit rounded-full border border-sky-400/15 bg-sky-400/[.06] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-sky-200">
                                    Testdatensatz
                                </span>
                                <button
                                    aria-label={`${row.title} öffnen`}
                                    className="grid h-9 w-9 cursor-not-allowed place-items-center rounded-xl border border-white/[.06] text-zinc-700"
                                    disabled
                                    type="button"
                                >
                                    <FaArrowRight />
                                </button>
                            </div>
                        ))}
                    </div>
                </article>

                <aside className="rounded-[26px] border border-white/[.07] bg-[#111218] p-5 sm:p-6">
                    <p className="eyebrow">IMPLEMENTIERUNGSSTATUS</p>
                    <h3 className="mt-2 font-display text-xl font-bold">Was bereits steht</h3>
                    <div className="mt-6 space-y-3">
                        <StatusRow done text="Route und Sidebar-Eintrag" />
                        <StatusRow done text="Responsive Card-Layout" />
                        <StatusRow text="API-Client und Datenmodell" />
                        <StatusRow text="Formulare und Aktionen" />
                        <StatusRow text="Berechtigungen je Aktion" />
                    </div>
                    <div className="mt-6 rounded-2xl border border-dashed border-white/[.08] bg-black/15 p-4">
                        <b className="text-xs text-zinc-300">Nächster Arbeitsschritt</b>
                        <p className="mt-2 text-xs leading-5 text-zinc-600">
                            Datenvertrag festlegen, echten Lade-/Leer-/Fehlerzustand ergänzen und erst danach die
                            Aktionen freischalten.
                        </p>
                    </div>
                </aside>
            </section>
        </div>
    );
}

function createPreviewRows(title) {
    return [
        { title: `${title} · Primäransicht`, description: 'Beispiel für den wichtigsten Datensatz dieses Moduls' },
        { title: `${title} · Detailansicht`, description: 'Vorschau für zusätzliche Informationen und Statuswerte' },
        { title: `${title} · Letzte Änderung`, description: 'Später mit Audit- und Benutzerinformationen verbunden' },
        {
            title: `${title} · Konfiguration`,
            description: 'Interaktionen bleiben bis zur Backend-Anbindung deaktiviert'
        }
    ];
}

function StatusRow({ done = false, text }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-white/[.055] bg-black/15 px-3 py-3">
            <span
                className={`h-2 w-2 shrink-0 rounded-full ${done ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.45)]' : 'bg-zinc-700'}`}
            />
            <span className={`text-xs font-semibold ${done ? 'text-zinc-300' : 'text-zinc-600'}`}>{text}</span>
        </div>
    );
}

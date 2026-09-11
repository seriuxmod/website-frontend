import {
    FaBagShopping,
    FaBan,
    FaBoxesStacked,
    FaCalendarDays,
    FaChartColumn,
    FaChartLine,
    FaCircleNodes,
    FaComments,
    FaCreditCard,
    FaGear,
    FaGift,
    FaLanguage,
    FaLayerGroup,
    FaListCheck,
    FaMoneyCheckDollar,
    FaNoteSticky,
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

export const adminNavigationGroups = [
    {
        id: 'general',
        label: 'Allgemein',
        description: 'Dashboard und technischer Zustand der Plattform.',
        icon: FaChartLine,
        items: [
            {
                to: '/admin',
                label: 'Übersicht',
                description: 'Die wichtigsten Kennzahlen und Hinweise auf einen Blick.',
                icon: FaChartLine,
                end: true
            },
            {
                to: '/admin/system-status',
                label: 'Systemstatus',
                description: 'Services, Abhängigkeiten und Störungen prüfen.',
                icon: FaServer,
                permissions: ['status.admin']
            }
        ]
    },
    {
        id: 'team',
        label: 'Team',
        description: 'Zusammenarbeit, Termine und interne Organisation.',
        icon: FaUserGroup,
        items: [
            {
                to: '/admin/team',
                label: 'Übersicht',
                description: 'Aktuelle Teamthemen und Aufgaben zusammenführen.',
                icon: FaUserGroup,
                permissions: ['team.overview.read'],
                end: true
            },
            {
                to: '/admin/team/calendar',
                label: 'Terminkalender',
                description: 'Interne Termine und Besprechungen organisieren.',
                icon: FaCalendarDays,
                permissions: ['team.calendar.read']
            },
            {
                to: '/admin/team/activity',
                label: 'Aktivitätsanalyse',
                description: 'Teamaktivität und Bearbeitungsstände auswerten.',
                icon: FaChartLine,
                permissions: ['team.activity.read']
            },
            {
                to: '/admin/team/todos',
                label: 'Todolist',
                description: 'Interne Aufgaben planen und priorisieren.',
                icon: FaListCheck,
                permissions: ['team.todos.read']
            },
            {
                to: '/admin/team/notes',
                label: 'Interne Notizen',
                description: 'Gemeinsame interne Hinweise festhalten.',
                icon: FaNoteSticky,
                permissions: ['team.notes.read']
            }
        ]
    },
    {
        id: 'management',
        label: 'Verwaltung',
        description: 'Spieler, Rechte und soziale Funktionen verwalten.',
        icon: FaUsers,
        items: [
            {
                to: '/admin/players',
                label: 'Spieler',
                description: 'Konten und Profile verwalten.',
                icon: FaUsers,
                permissions: ['users.read.any', 'users.lock', 'permissions.user.write', 'permissions.assignment.write']
            },
            {
                to: '/admin/permissions',
                label: 'Berechtigungen',
                description: 'Gruppen und Zugriffsrechte steuern.',
                icon: FaUserShield,
                permissions: ['permissions.group.read', 'permissions.group.write']
            },
            {
                to: '/admin/cosmetics',
                label: 'Cosmetics',
                description: 'Freischaltungen und Assets verwalten.',
                icon: FaGift,
                permissions: ['store.cosmetics.read']
            },
            {
                to: '/admin/friends',
                label: 'Freunde',
                description: 'Freundschaften und Anfragen prüfen.',
                icon: FaUserGroup,
                permissions: ['social.friends.read']
            },
            {
                to: '/admin/clans',
                label: 'Clans',
                description: 'Clans und Mitglieder organisieren.',
                icon: FaShieldHalved,
                permissions: ['social.clans.read']
            },
            {
                to: '/admin/parties',
                label: 'Parties',
                description: 'Aktive Gruppen und Einladungen prüfen.',
                icon: FaPeopleGroup,
                permissions: ['social.parties.read']
            },
            {
                to: '/admin/public-servers',
                label: 'Öffentliche Serverliste',
                description: 'Öffentliche Minecraft-Server und deren Freigabe verwalten.',
                icon: FaServer,
                permissions: ['social.servers.read']
            },
            {
                to: '/admin/translations',
                label: 'Übersetzungen',
                description: 'Sprachen und Übersetzungseinträge organisieren.',
                icon: FaLanguage,
                permissions: ['forum.translations.read']
            }
        ]
    },
    {
        id: 'moderation',
        label: 'Moderation',
        description: 'Maßnahmen, Vorgänge und Regeln zentral bearbeiten.',
        icon: FaShieldHalved,
        items: [
            {
                to: '/admin/moderation',
                label: 'Übersicht',
                description: 'Offene Vorgänge und Maßnahmen bündeln.',
                icon: FaChartColumn,
                end: true,
                allPermissions: ['moderation.ban.read', 'moderation.mute.read']
            },
            {
                to: '/admin/moderation/bans',
                label: 'Bans',
                description: 'Kontosperren verwalten.',
                icon: FaBan,
                permissions: ['moderation.ban.read', 'moderation.ban.write']
            },
            {
                to: '/admin/moderation/mutes',
                label: 'Mutes',
                description: 'Kommunikationssperren verwalten.',
                icon: FaVolumeXmark,
                permissions: ['moderation.mute.read', 'moderation.mute.write']
            },
            {
                to: '/admin/moderation/settings',
                label: 'Einstellungen',
                description: 'Ban- und Mute-Gründe konfigurieren.',
                icon: FaGear,
                permissionAlternatives: [
                    ['moderation.ban.read', 'moderation.mute.read'],
                    ['moderation.ban.reason.write'],
                    ['moderation.mute.reason.write']
                ]
            }
        ]
    },
    {
        id: 'forum',
        label: 'Forum',
        description: 'Inhalte, Struktur und Community-Vorgänge steuern.',
        icon: FaComments,
        items: [
            {
                to: '/admin/forum/analytics',
                label: 'Nutzungsstatistik',
                description: 'Aktivität und Reichweite auswerten.',
                icon: FaChartColumn
            },
            {
                to: '/admin/forum/structure',
                label: 'Struktur',
                description: 'Kategorien und Foren organisieren.',
                icon: FaCircleNodes
            },
            {
                to: '/admin/forum/permissions',
                label: 'Gruppenrechte',
                description: 'Rechte pro Forum und Gruppe steuern.',
                icon: FaUserShield
            },
            {
                to: '/admin/forum/labels',
                label: 'Labels',
                description: 'Labels und Bereiche konfigurieren.',
                icon: FaTags
            },
            {
                to: '/admin/forum/reports',
                label: 'Meldungen',
                description: 'Gemeldete Inhalte bearbeiten.',
                icon: FaBan
            },
            {
                to: '/admin/forum/suggestions',
                label: 'Vorschläge',
                description: 'Community-Vorschläge verwalten.',
                icon: FaListCheck
            },
            {
                to: '/admin/forum/blog',
                label: 'Blog',
                description: 'Beiträge entwerfen und veröffentlichen.',
                icon: FaObjectGroup
            },
            {
                to: '/admin/forum/settings',
                label: 'Einstellungen',
                description: 'Globale Forumregeln konfigurieren.',
                icon: FaGear
            }
        ]
    },
    {
        id: 'commerce',
        label: 'E-Commerce',
        description: 'Katalog, Bestellungen und Zahlungen verwalten.',
        icon: FaBagShopping,
        items: [
            {
                to: '/admin/commerce',
                label: 'Übersicht',
                description: 'Umsatz und Shop-Hinweise überblicken.',
                icon: FaChartColumn,
                end: true,
                permissions: ['store.dashboard.read']
            },
            {
                to: '/admin/commerce/customers',
                label: 'Kunden',
                description: 'Kunden und Kaufverläufe einsehen.',
                icon: FaUsers,
                permissions: ['store.customers.read']
            },
            {
                to: '/admin/commerce/catalog',
                label: 'Katalog',
                description: 'Produkte und Kategorien pflegen.',
                icon: FaBoxesStacked,
                permissions: ['store.catalog.read']
            },
            {
                to: '/admin/commerce/fields',
                label: 'Produktfelder',
                description: 'Zusätzliche Produktangaben definieren.',
                icon: FaLayerGroup,
                permissions: ['store.catalog.read']
            },
            {
                to: '/admin/commerce/coupons',
                label: 'Coupons',
                description: 'Rabattcodes und Limits verwalten.',
                icon: FaTags,
                permissions: ['store.catalog.read']
            },
            {
                to: '/admin/commerce/orders',
                label: 'Bestellungen',
                description: 'Bestellstatus und Auslieferung verfolgen.',
                icon: FaReceipt,
                permissions: ['store.orders.read']
            },
            {
                to: '/admin/commerce/payment-methods',
                label: 'Zahlungsmethoden',
                description: 'Anbieter und Zahlarten konfigurieren.',
                icon: FaCreditCard,
                permissions: ['store.settings.read']
            },
            {
                to: '/admin/commerce/settings',
                label: 'Einstellungen',
                description: 'Firmendaten und Checkout konfigurieren.',
                icon: FaMoneyCheckDollar,
                permissions: ['store.settings.read']
            }
        ]
    }
];

export function adminItemIsActive(pathname, item) {
    return item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export function adminGroupIsActive(pathname, group) {
    return group.items.some((item) => adminItemIsActive(pathname, item));
}

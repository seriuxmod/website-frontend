import {
    FaBagShopping,
    FaBan,
    FaBoxesStacked,
    FaChartColumn,
    FaChartLine,
    FaCircleNodes,
    FaComments,
    FaCreditCard,
    FaGear,
    FaGift,
    FaLayerGroup,
    FaListCheck,
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
                icon: FaServer
            }
        ]
    },
    {
        id: 'management',
        label: 'Verwaltung',
        description: 'Spieler, Rechte und soziale Funktionen verwalten.',
        icon: FaUsers,
        items: [
            { to: '/admin/players', label: 'Spieler', description: 'Konten und Profile verwalten.', icon: FaUsers },
            {
                to: '/admin/permissions',
                label: 'Berechtigungen',
                description: 'Gruppen und Zugriffsrechte steuern.',
                icon: FaUserShield
            },
            {
                to: '/admin/cosmetics',
                label: 'Cosmetics',
                description: 'Freischaltungen und Assets verwalten.',
                icon: FaGift
            },
            {
                to: '/admin/friends',
                label: 'Freunde',
                description: 'Freundschaften und Anfragen prüfen.',
                icon: FaUserGroup
            },
            {
                to: '/admin/clans',
                label: 'Clans',
                description: 'Clans und Mitglieder organisieren.',
                icon: FaShieldHalved
            },
            {
                to: '/admin/parties',
                label: 'Parties',
                description: 'Aktive Gruppen und Einladungen prüfen.',
                icon: FaPeopleGroup
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
                end: true
            },
            { to: '/admin/moderation/bans', label: 'Bans', description: 'Kontosperren verwalten.', icon: FaBan },
            {
                to: '/admin/moderation/mutes',
                label: 'Mutes',
                description: 'Kommunikationssperren verwalten.',
                icon: FaVolumeXmark
            },
            {
                to: '/admin/moderation/settings',
                label: 'Einstellungen',
                description: 'Ban- und Mute-Gründe konfigurieren.',
                icon: FaGear
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
                end: true
            },
            {
                to: '/admin/commerce/customers',
                label: 'Kunden',
                description: 'Kunden und Kaufverläufe einsehen.',
                icon: FaUsers
            },
            {
                to: '/admin/commerce/catalog',
                label: 'Katalog',
                description: 'Produkte und Kategorien pflegen.',
                icon: FaBoxesStacked
            },
            {
                to: '/admin/commerce/fields',
                label: 'Produktfelder',
                description: 'Zusätzliche Produktangaben definieren.',
                icon: FaLayerGroup
            },
            {
                to: '/admin/commerce/coupons',
                label: 'Coupons',
                description: 'Rabattcodes und Limits verwalten.',
                icon: FaTags
            },
            {
                to: '/admin/commerce/orders',
                label: 'Bestellungen',
                description: 'Bestellstatus und Auslieferung verfolgen.',
                icon: FaReceipt
            },
            {
                to: '/admin/commerce/payment-methods',
                label: 'Zahlungsmethoden',
                description: 'Anbieter und Zahlarten konfigurieren.',
                icon: FaCreditCard
            },
            {
                to: '/admin/commerce/settings',
                label: 'Einstellungen',
                description: 'Firmendaten und Checkout konfigurieren.',
                icon: FaMoneyCheckDollar
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

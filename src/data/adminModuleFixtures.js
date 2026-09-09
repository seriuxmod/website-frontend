export const MODULE_METRICS = {
    'system-status': [
        ['14/14', 'Services erreichbar', 'emerald'],
        ['42 ms', 'Mittlere Antwortzeit', 'sky'],
        ['99,98 %', 'Verfügbarkeit', 'orange'],
        ['0', 'Offene Störungen', 'violet']
    ],
    team: [
        ['8', 'Teammitglieder', 'sky'],
        ['5', 'Heute aktiv', 'emerald'],
        ['17', 'Offene Aufgaben', 'orange'],
        ['3', 'Anstehende Termine', 'violet']
    ],
    'team-calendar': [
        ['12', 'Termine im Monat', 'orange'],
        ['3', 'Diese Woche', 'sky'],
        ['2', 'Wiederkehrend', 'violet'],
        ['1', 'Heute', 'emerald']
    ],
    'team-activity': [
        ['248', 'Aktionen diese Woche', 'orange'],
        ['6', 'Aktive Bereiche', 'sky'],
        ['34', 'Ø pro Tag', 'emerald'],
        ['8', 'Mitwirkende', 'violet']
    ],
    'team-todos': [
        ['17', 'Offene Aufgaben', 'orange'],
        ['6', 'In Bearbeitung', 'sky'],
        ['9', 'Diese Woche erledigt', 'emerald'],
        ['2', 'Hohe Priorität', 'violet']
    ],
    'team-notes': [
        ['14', 'Aktive Notizen', 'orange'],
        ['4', 'Angepinnt', 'violet'],
        ['6', 'Autoren', 'sky'],
        ['3', 'Heute geändert', 'emerald']
    ],
    moderation: [
        ['12', 'Offene Fälle', 'orange'],
        ['4', 'Hohe Priorität', 'violet'],
        ['38', 'Diese Woche gelöst', 'emerald'],
        ['7 min', 'Ø Reaktionszeit', 'sky']
    ],
    'forum-analytics': [
        ['1.284', 'Aufrufe heute', 'orange'],
        ['87', 'Aktive Mitglieder', 'emerald'],
        ['42', 'Neue Beiträge', 'sky'],
        ['6,8 %', 'Interaktionsrate', 'violet']
    ],
    commerce: [
        ['4.280 €', 'Umsatz im Monat', 'emerald'],
        ['42', 'Bestellungen', 'orange'],
        ['18', 'Neue Kunden', 'sky'],
        ['31,40 €', 'Ø Bestellwert', 'violet']
    ]
};

export const SECTION_METRICS = {
    Verwaltung: [
        ['24', 'Einträge in der Ansicht', 'orange'],
        ['18', 'Aktiv', 'emerald'],
        ['4', 'Zu prüfen', 'sky'],
        ['2', 'Auffällig', 'violet']
    ],
    Moderation: [
        ['18', 'Maßnahmen gesamt', 'orange'],
        ['12', 'Aktiv', 'violet'],
        ['5', 'Laufen bald aus', 'sky'],
        ['1', 'Zur Prüfung', 'emerald']
    ],
    Forum: [
        ['28', 'Einträge', 'orange'],
        ['21', 'Aktiv', 'emerald'],
        ['7', 'Entwürfe', 'sky'],
        ['3', 'Zu prüfen', 'violet']
    ],
    'E-Commerce': [
        ['42', 'Einträge', 'orange'],
        ['31', 'Aktiv', 'emerald'],
        ['8', 'In Bearbeitung', 'sky'],
        ['3', 'Zu prüfen', 'violet']
    ]
};

export const OVERVIEW_CHARTS = {
    'system-status': {
        title: 'Antwortzeit der Plattform',
        label: 'Millisekunden',
        suffix: 'ms',
        data: [34, 39, 36, 47, 42, 45, 38, 41, 44, 40, 37, 42]
    },
    team: {
        title: 'Abgeschlossene Teamaktionen',
        label: 'Aktionen',
        suffix: '',
        data: [18, 24, 22, 31, 27, 36, 42, 38, 46, 51, 44, 57]
    },
    'team-activity': {
        title: 'Aktivität nach Tageszeit',
        label: 'Aktionen',
        suffix: '',
        data: [12, 18, 16, 24, 31, 28, 39, 44, 41, 52, 47, 61]
    },
    moderation: {
        title: 'Bearbeitete Moderationsfälle',
        label: 'Fälle',
        suffix: '',
        data: [7, 12, 9, 16, 14, 18, 21, 19, 24, 22, 28, 31]
    },
    'forum-analytics': {
        title: 'Forumaktivität',
        label: 'Interaktionen',
        suffix: '',
        data: [48, 55, 52, 68, 72, 64, 81, 89, 84, 96, 91, 108]
    },
    commerce: {
        title: 'Umsatzentwicklung',
        label: 'Umsatz in Euro',
        suffix: '€',
        data: [180, 240, 210, 380, 320, 460, 510, 490, 640, 580, 720, 810]
    }
};

export const STATUS_FLOW_SERVICES = [
    { name: 'DNS Auflösung', status: 'operational', latency: 38 },
    { name: 'API Gateway', status: 'operational', latency: 46 },
    { name: 'CDN', status: 'degraded', latency: 612 },
    { name: 'Database', status: 'operational', latency: 31 },
    { name: 'Payment Gateway', status: 'operational', latency: 128 },
    { name: 'Notification Service', status: 'offline', latency: 0 }
];

export const STATUS_STACKS = [
    {
        stack: 'edge_traefik',
        service: 'Edge Router',
        replicas: '2 / 2',
        latency: '18 ms',
        status: 'ready'
    },
    {
        stack: 'gateway_api-gateway',
        service: 'API Gateway',
        replicas: '3 / 3',
        latency: '46 ms',
        status: 'ready'
    },
    {
        stack: 'auth_oauth2-server',
        service: 'OAuth2 Server',
        replicas: '2 / 2',
        latency: '44 ms',
        status: 'ready'
    },
    {
        stack: 'users_user-service',
        service: 'User Service',
        replicas: '2 / 2',
        latency: '51 ms',
        status: 'ready'
    },
    {
        stack: 'status_status-service',
        service: 'Status Service',
        replicas: '2 / 2',
        latency: '37 ms',
        status: 'ready'
    },
    {
        stack: 'forum_forum-service',
        service: 'Forum Service',
        replicas: '2 / 2',
        latency: '58 ms',
        status: 'ready'
    },
    {
        stack: 'store_store-service',
        service: 'Store Service',
        replicas: '2 / 2',
        latency: '684 ms',
        status: 'delayed'
    },
    {
        stack: 'social_social-service',
        service: 'Social Service',
        replicas: '2 / 2',
        latency: '63 ms',
        status: 'ready'
    },
    {
        stack: 'data_postgres',
        service: 'PostgreSQL',
        replicas: '1 / 1',
        latency: '31 ms',
        status: 'ready'
    },
    {
        stack: 'data_redis',
        service: 'Redis',
        replicas: '1 / 1',
        latency: '12 ms',
        status: 'ready'
    },
    {
        stack: 'payments_payment-gateway',
        service: 'Payment Gateway',
        replicas: '1 / 1',
        latency: '128 ms',
        status: 'ready'
    },
    {
        stack: 'notifications_notification-service',
        service: 'Notification Service',
        replicas: '0 / 1',
        latency: 'Timeout',
        status: 'offline'
    },
    {
        stack: 'cdn_r2-edge-worker',
        service: 'CDN Edge Worker',
        replicas: '1 / 1',
        latency: '612 ms',
        status: 'delayed'
    },
    {
        stack: 'monitor_status-probe',
        service: 'Status Probe',
        replicas: '1 / 1',
        latency: '24 ms',
        status: 'ready'
    }
];

export const STATUS_LOAD_FACTORS = {
    networking: {
        label: 'Networking',
        unit: 'Mbit/s',
        rows: [
            { id: 'gateway', label: 'API Gateway', value: 846 },
            { id: 'cdn', label: 'CDN Edge Worker', value: 712 },
            { id: 'forum', label: 'Forum Service', value: 438 },
            { id: 'social', label: 'Social Service', value: 286 },
            { id: 'auth', label: 'OAuth2 Server', value: 142 }
        ]
    },
    cpu: {
        label: 'CPU',
        unit: '%',
        rows: [
            { id: 'forum', label: 'Forum Service', value: 78 },
            { id: 'gateway', label: 'API Gateway', value: 64 },
            { id: 'users', label: 'User Service', value: 51 },
            { id: 'store', label: 'Store Service', value: 39 },
            { id: 'auth', label: 'OAuth2 Server', value: 28 }
        ]
    },
    ram: {
        label: 'RAM',
        unit: 'GB',
        rows: [
            { id: 'forum', label: 'Forum Service', value: 5.8 },
            { id: 'users', label: 'User Service', value: 4.6 },
            { id: 'store', label: 'Store Service', value: 3.9 },
            { id: 'gateway', label: 'API Gateway', value: 2.8 },
            { id: 'auth', label: 'OAuth2 Server', value: 2.1 }
        ]
    }
};

export const TABLE_DATA = {
    players: [
        {
            player: 'TestSpieler01',
            group: 'Administrator',
            status: 'Online',
            surface: 'Webseite',
            updated: 'vor 2 Min.'
        },
        { player: 'TestSpieler02', group: 'Moderator', status: 'Online', surface: 'Client', updated: 'vor 5 Min.' },
        { player: 'TestSpieler03', group: 'Developer', status: 'Offline', surface: '–', updated: 'vor 1 Std.' },
        { player: 'TestSpieler04', group: 'User', status: 'Offline', surface: '–', updated: 'gestern' },
        { player: 'TestSpieler05', group: 'Supporter', status: 'Online', surface: 'Launcher', updated: 'gerade eben' },
        { player: 'TestSpieler06', group: 'User', status: 'Gesperrt', surface: '–', updated: 'vor 4 Tagen' }
    ],
    permissions: [
        { group: 'Administrator', members: '2', rights: 'Alle Bereiche', priority: '100', status: 'Aktiv' },
        { group: 'Developer', members: '4', rights: 'Technik & Inhalte', priority: '80', status: 'Aktiv' },
        { group: 'Moderator', members: '6', rights: 'Moderation', priority: '60', status: 'Aktiv' },
        { group: 'Supporter', members: '8', rights: 'Support', priority: '40', status: 'Aktiv' },
        { group: 'User', members: '1.284', rights: 'Standard', priority: '10', status: 'Aktiv' }
    ],
    cosmetics: [
        { cosmetic: 'Founder Cape', type: 'Cape', owners: '32', visibility: 'Öffentlich', status: 'Aktiv' },
        { cosmetic: 'Fox Wings', type: 'Wings', owners: '118', visibility: 'Shop', status: 'Aktiv' },
        { cosmetic: 'Halloween Hat', type: 'Hat', owners: '84', visibility: 'Saisonal', status: 'Geplant' },
        { cosmetic: 'Staff Badge', type: 'Badge', owners: '20', visibility: 'Intern', status: 'Aktiv' },
        { cosmetic: 'Legacy Cloak', type: 'Cloak', owners: '11', visibility: 'Archiv', status: 'Deaktiviert' }
    ],
    friends: [
        {
            connection: 'TestSpieler01 ↔ TestSpieler02',
            since: '12. Aug.',
            interactions: '48',
            reports: '0',
            status: 'Aktiv'
        },
        {
            connection: 'TestSpieler03 ↔ TestSpieler04',
            since: '18. Aug.',
            interactions: '17',
            reports: '1',
            status: 'Prüfen'
        },
        {
            connection: 'TestSpieler05 ↔ TestSpieler06',
            since: '22. Aug.',
            interactions: '61',
            reports: '0',
            status: 'Aktiv'
        },
        {
            connection: 'TestSpieler02 ↔ TestSpieler05',
            since: '27. Aug.',
            interactions: '9',
            reports: '0',
            status: 'Aktiv'
        }
    ],
    clans: [
        { clan: 'FoxForce', tag: 'FOX', members: '24/30', owner: 'TestSpieler01', status: 'Aktiv' },
        { clan: 'BlockBande', tag: 'BLK', members: '18/25', owner: 'TestSpieler02', status: 'Aktiv' },
        { clan: 'NetherCrew', tag: 'NTH', members: '8/20', owner: 'TestSpieler03', status: 'Prüfen' },
        { clan: 'SkyBuilders', tag: 'SKY', members: '29/30', owner: 'TestSpieler04', status: 'Voll' }
    ],
    parties: [
        { party: 'PTY-1042', leader: 'TestSpieler02', members: '4/8', server: 'Lobby-01', status: 'Aktiv' },
        { party: 'PTY-1048', leader: 'TestSpieler05', members: '2/8', server: 'BedWars-03', status: 'Im Spiel' },
        { party: 'PTY-1051', leader: 'TestSpieler01', members: '7/8', server: 'Lobby-02', status: 'Aktiv' },
        { party: 'PTY-1057', leader: 'TestSpieler04', members: '3/8', server: 'SMP-01', status: 'Im Spiel' }
    ],
    'public-servers': [
        {
            server: 'Seriux Network',
            address: 'play.example.net',
            players: '284/1.000',
            category: 'Netzwerk',
            status: 'Freigegeben'
        },
        {
            server: 'Block Valley',
            address: 'valley.example.net',
            players: '86/250',
            category: 'Survival',
            status: 'Freigegeben'
        },
        { server: 'Sky Realm', address: 'sky.example.net', players: '41/120', category: 'SkyBlock', status: 'Prüfung' },
        {
            server: 'Creative Lab',
            address: 'build.example.net',
            players: '12/80',
            category: 'Creative',
            status: 'Entwurf'
        }
    ],
    translations: [
        {
            key: 'navigation.download',
            german: 'Herunterladen',
            english: 'Download',
            coverage: '100 %',
            status: 'Freigegeben'
        },
        { key: 'launcher.play', german: 'Spielen', english: 'Play', coverage: '100 %', status: 'Freigegeben' },
        { key: 'friends.pending', german: 'Ausstehend', english: 'Pending', coverage: '80 %', status: 'Prüfung' },
        { key: 'store.checkout', german: 'Kasse', english: 'Checkout', coverage: '60 %', status: 'Entwurf' },
        { key: 'moderation.appeal', german: 'Einspruch', english: 'Appeal', coverage: '40 %', status: 'Offen' }
    ],
    bans: [
        {
            player: 'TestSpieler06',
            reason: 'Unzulässige Modifikation',
            duration: '30 Tage',
            moderator: 'TestMod01',
            status: 'Aktiv'
        },
        {
            player: 'TestSpieler12',
            reason: 'Accountmissbrauch',
            duration: 'Permanent',
            moderator: 'TestMod02',
            status: 'Aktiv'
        },
        {
            player: 'TestSpieler18',
            reason: 'Umgehung einer Sperre',
            duration: '14 Tage',
            moderator: 'TestMod01',
            status: 'Prüfung'
        },
        {
            player: 'TestSpieler22',
            reason: 'Unangebrachter Skin',
            duration: '7 Tage',
            moderator: 'TestMod03',
            status: 'Abgelaufen'
        }
    ],
    mutes: [
        { player: 'TestSpieler07', reason: 'Spam', duration: '24 Stunden', moderator: 'TestMod02', status: 'Aktiv' },
        { player: 'TestSpieler09', reason: 'Beleidigung', duration: '7 Tage', moderator: 'TestMod01', status: 'Aktiv' },
        { player: 'TestSpieler14', reason: 'Werbung', duration: '3 Tage', moderator: 'TestMod03', status: 'Prüfung' },
        { player: 'TestSpieler20', reason: 'Spam', duration: '2 Stunden', moderator: 'TestMod02', status: 'Abgelaufen' }
    ],
    'forum-permissions': [
        { group: 'Administrator', read: 'Alle', write: 'Alle', moderate: 'Alle', status: 'Aktiv' },
        { group: 'Moderator', read: 'Alle', write: 'Alle', moderate: 'Community', status: 'Aktiv' },
        { group: 'Developer', read: 'Alle', write: 'Technik', moderate: 'Technik', status: 'Aktiv' },
        { group: 'User', read: 'Öffentlich', write: 'Öffentlich', moderate: 'Nein', status: 'Aktiv' }
    ],
    'forum-labels': [
        { label: 'Ankündigung', color: 'Orange', usage: '18 Themen', scope: 'Global', status: 'Aktiv' },
        { label: 'Behoben', color: 'Grün', usage: '46 Themen', scope: 'Support', status: 'Aktiv' },
        { label: 'In Prüfung', color: 'Blau', usage: '12 Themen', scope: 'Vorschläge', status: 'Aktiv' },
        { label: 'Archiv', color: 'Grau', usage: '81 Themen', scope: 'Global', status: 'Aktiv' }
    ],
    'forum-reports': [
        { report: 'RPT-2041', content: 'Beitrag #1842', reason: 'Spam', priority: 'Normal', status: 'Offen' },
        { report: 'RPT-2042', content: 'Thema #731', reason: 'Beleidigung', priority: 'Hoch', status: 'In Prüfung' },
        { report: 'RPT-2043', content: 'Beitrag #1848', reason: 'Off-Topic', priority: 'Niedrig', status: 'Offen' },
        { report: 'RPT-2044', content: 'Profil TestUser', reason: 'Werbung', priority: 'Normal', status: 'Gelöst' }
    ],
    'forum-suggestions': [
        {
            suggestion: 'Mehr HUD-Profile',
            author: 'TestSpieler02',
            votes: '184',
            category: 'Client',
            status: 'Angenommen'
        },
        {
            suggestion: 'Launcher Themes',
            author: 'TestSpieler04',
            votes: '126',
            category: 'Launcher',
            status: 'In Prüfung'
        },
        { suggestion: 'Clan Turniere', author: 'TestSpieler08', votes: '92', category: 'Community', status: 'Geplant' },
        {
            suggestion: 'Server Favoriten',
            author: 'TestSpieler11',
            votes: '71',
            category: 'Serverliste',
            status: 'Offen'
        }
    ],
    'forum-blog': [
        {
            article: 'Das nächste Client-Update',
            author: 'TestAutor01',
            updated: 'Heute, 14:20',
            placement: 'Landingpage',
            status: 'Entwurf'
        },
        {
            article: 'Neue Serverpartnerschaft',
            author: 'TestAutor02',
            updated: 'Gestern, 18:40',
            placement: 'Landingpage',
            status: 'Geplant'
        },
        {
            article: 'Community Rückblick',
            author: 'TestAutor01',
            updated: '04. Sept.',
            placement: 'Archiv',
            status: 'Veröffentlicht'
        },
        {
            article: 'Moderationsupdate',
            author: 'TestAutor03',
            updated: '01. Sept.',
            placement: 'Blog',
            status: 'Prüfung'
        }
    ],
    customers: [
        { customer: 'TestKunde01', orders: '8', revenue: '186,40 €', lastOrder: 'Heute', status: 'Aktiv' },
        { customer: 'TestKunde02', orders: '3', revenue: '74,90 €', lastOrder: 'Gestern', status: 'Aktiv' },
        { customer: 'TestKunde03', orders: '1', revenue: '12,50 €', lastOrder: '28. Aug.', status: 'Neu' },
        { customer: 'TestKunde04', orders: '5', revenue: '142,20 €', lastOrder: '19. Aug.', status: 'Prüfung' }
    ],
    catalog: [
        { product: 'Fox Wings', category: 'Wings', price: '12,99 €', stock: 'Digital', status: 'Aktiv' },
        { product: 'Founder Cape', category: 'Capes', price: '8,99 €', stock: 'Digital', status: 'Aktiv' },
        { product: 'Name Color Pack', category: 'Profil', price: '4,99 €', stock: 'Digital', status: 'Aktiv' },
        { product: 'Halloween Bundle', category: 'Bundle', price: '19,99 €', stock: 'Geplant', status: 'Entwurf' }
    ],
    fields: [
        { field: 'Minecraft-UUID', type: 'Text', required: 'Ja', products: 'Alle', status: 'Aktiv' },
        { field: 'Variantenfarbe', type: 'Auswahl', required: 'Nein', products: 'Cosmetics', status: 'Aktiv' },
        { field: 'Geschenkempfänger', type: 'Spieler', required: 'Nein', products: 'Geschenke', status: 'Aktiv' },
        { field: 'Personalisierung', type: 'Text', required: 'Nein', products: 'Capes', status: 'Entwurf' }
    ],
    coupons: [
        { code: 'WELCOME10', discount: '10 %', redemptions: '84/500', expires: '31. Dez.', status: 'Aktiv' },
        { code: 'TEAM25', discount: '25 %', redemptions: '12/50', expires: 'Unbegrenzt', status: 'Intern' },
        { code: 'SUMMER15', discount: '15 %', redemptions: '218/250', expires: 'Abgelaufen', status: 'Beendet' },
        { code: 'HALLOWEEN', discount: '20 %', redemptions: '0/1.000', expires: '31. Okt.', status: 'Geplant' }
    ],
    orders: [
        { order: 'SXM-10482', customer: 'TestKunde01', total: '12,99 €', payment: 'PayPal', status: 'Bezahlt' },
        { order: 'SXM-10483', customer: 'TestKunde03', total: '8,99 €', payment: 'Visa', status: 'Ausgeliefert' },
        { order: 'SXM-10484', customer: 'TestKunde02', total: '19,99 €', payment: 'Apple Pay', status: 'In Prüfung' },
        { order: 'SXM-10485', customer: 'TestKunde04', total: '4,99 €', payment: 'Google Pay', status: 'Offen' }
    ],
    'payment-methods': [
        { provider: 'PayPal', method: 'Wallet', transactions: '184', fee: '2,49 %', status: 'Aktiv' },
        { provider: 'Stripe', method: 'Visa / Mastercard', transactions: '126', fee: '1,50 %', status: 'Aktiv' },
        { provider: 'Stripe', method: 'Apple Pay', transactions: '68', fee: '1,50 %', status: 'Aktiv' },
        { provider: 'Stripe', method: 'Google Pay', transactions: '51', fee: '1,50 %', status: 'Aktiv' }
    ]
};

export const OVERVIEW_TABLES = {
    'system-status': [
        {
            service: 'API Gateway',
            availability: '99,99 %',
            latency: '31 ms',
            region: 'Frankfurt',
            status: 'Operational'
        },
        {
            service: 'Auth Server',
            availability: '99,98 %',
            latency: '42 ms',
            region: 'Frankfurt',
            status: 'Operational'
        },
        {
            service: 'User Service',
            availability: '99,97 %',
            latency: '47 ms',
            region: 'Frankfurt',
            status: 'Operational'
        },
        {
            service: 'Forum Service',
            availability: '99,96 %',
            latency: '53 ms',
            region: 'Frankfurt',
            status: 'Operational'
        }
    ],
    team: [
        {
            activity: 'Release-Planung aktualisiert',
            owner: 'TestMember01',
            area: 'Launcher',
            time: 'vor 8 Min.',
            status: 'Erledigt'
        },
        {
            activity: 'Forum-Meldungen geprüft',
            owner: 'TestMember02',
            area: 'Moderation',
            time: 'vor 24 Min.',
            status: 'Erledigt'
        },
        {
            activity: 'Shop-Katalog vorbereitet',
            owner: 'TestMember03',
            area: 'Store',
            time: 'vor 1 Std.',
            status: 'In Arbeit'
        },
        {
            activity: 'Übersetzungen ergänzt',
            owner: 'TestMember04',
            area: 'Client',
            time: 'vor 2 Std.',
            status: 'Prüfung'
        }
    ],
    moderation: [
        { case: 'MOD-1842', subject: 'Chatverhalten', assignee: 'TestMod01', priority: 'Hoch', status: 'In Prüfung' },
        { case: 'MOD-1843', subject: 'Unzulässiger Skin', assignee: 'TestMod02', priority: 'Normal', status: 'Offen' },
        {
            case: 'MOD-1844',
            subject: 'Accountmissbrauch',
            assignee: 'TestMod01',
            priority: 'Kritisch',
            status: 'Eskaliert'
        },
        { case: 'MOD-1845', subject: 'Spam', assignee: 'TestMod03', priority: 'Niedrig', status: 'Gelöst' }
    ],
    'forum-analytics': [
        { board: 'Ankündigungen', topics: '18', posts: '284', activity: '+12 %', status: 'Aktiv' },
        { board: 'Allgemein', topics: '142', posts: '1.842', activity: '+8 %', status: 'Aktiv' },
        { board: 'Support', topics: '86', posts: '612', activity: '+4 %', status: 'Aktiv' },
        { board: 'Vorschläge', topics: '71', posts: '944', activity: '+18 %', status: 'Aktiv' }
    ],
    commerce: [
        { order: 'SXM-10482', customer: 'TestKunde01', total: '12,99 €', method: 'PayPal', status: 'Bezahlt' },
        { order: 'SXM-10483', customer: 'TestKunde03', total: '8,99 €', method: 'Visa', status: 'Ausgeliefert' },
        { order: 'SXM-10484', customer: 'TestKunde02', total: '19,99 €', method: 'Apple Pay', status: 'In Prüfung' },
        { order: 'SXM-10485', customer: 'TestKunde04', total: '4,99 €', method: 'Google Pay', status: 'Offen' }
    ]
};

export const CALENDAR_EVENTS = [
    { day: 3, title: 'Sprint Planning', tone: 'orange' },
    { day: 7, title: 'Moderationsrunde', tone: 'violet' },
    { day: 9, title: 'Backend Sync', tone: 'sky' },
    { day: 14, title: 'Release Review', tone: 'emerald' },
    { day: 18, title: 'Community Call', tone: 'orange' },
    { day: 23, title: 'Launcher QA', tone: 'sky' },
    { day: 27, title: 'Monatsrückblick', tone: 'violet' }
];

export const TODO_LANES = [
    {
        title: 'Offen',
        tone: 'zinc',
        items: [
            ['API-Verträge dokumentieren', 'Backend', 'Hoch'],
            ['Neue Launcher-Texte prüfen', 'Content', 'Normal'],
            ['Serverliste kategorisieren', 'Community', 'Normal']
        ]
    },
    {
        title: 'In Bearbeitung',
        tone: 'orange',
        items: [
            ['Admin-Dashboard layouten', 'Webseite', 'Hoch'],
            ['Zahlungsanbieter vorbereiten', 'Store', 'Normal'],
            ['Forumrechte abgleichen', 'Forum', 'Hoch']
        ]
    },
    {
        title: 'Prüfung',
        tone: 'sky',
        items: [
            ['macOS Build testen', 'Launcher', 'Hoch'],
            ['Übersetzung DE/EN', 'Client', 'Normal']
        ]
    },
    {
        title: 'Erledigt',
        tone: 'emerald',
        items: [
            ['Statusseite integrieren', 'Webseite', 'Normal'],
            ['Auth-Layout vereinheitlichen', 'Auth', 'Hoch']
        ]
    }
];

export const TEAM_NOTES = [
    [
        'Release-Fokus',
        'Vor dem nächsten Tag ausschließlich kritische Launcher-Fehler bearbeiten.',
        'TestMember01',
        'Angepinnt'
    ],
    [
        'Moderation',
        'Neue Ban-Gründe müssen vor der Aktivierung durch zwei Personen geprüft werden.',
        'TestMember02',
        'Team'
    ],
    ['Store', 'Checkout-Texte nach Einbindung der Zahlungsanbieter erneut gegenlesen.', 'TestMember03', 'Commerce'],
    [
        'Forum',
        'Archivstruktur für erledigte Vorschläge im nächsten Teammeeting abstimmen.',
        'TestMember04',
        'Community'
    ],
    ['Übersetzungen', 'Englische Launcher-Texte sind für den nächsten Testlauf priorisiert.', 'TestMember05', 'Client'],
    ['Infrastruktur', 'Service-Metriken zunächst nur lesend anbinden.', 'TestMember01', 'Technik']
];

export const STRUCTURE_NODES = [
    {
        title: 'SeriuxMod',
        description: 'Öffentliche Hauptkategorie',
        children: ['Ankündigungen', 'Allgemeine Diskussion', 'Hilfe & Support']
    },
    {
        title: 'Entwicklung',
        description: 'Technik und Feedback',
        children: ['Client', 'Launcher', 'Vorschläge & Fehler']
    },
    {
        title: 'Community',
        description: 'Spieler und Projekte',
        children: ['Vorstellungen', 'Server', 'Off-Topic']
    }
];

export const FORM_FIELDS = {
    'moderation-settings': [
        { name: 'defaultBanDuration', label: 'Standard-Bandauer', value: '7 Tage', type: 'text' },
        { name: 'defaultMuteDuration', label: 'Standard-Mutedauer', value: '24 Stunden', type: 'text' },
        { name: 'appealEmail', label: 'Kontakt für Einsprüche', value: 'contact@seriuxmod.net', type: 'email' },
        { name: 'requireSecondReview', label: 'Zweite Prüfung bei permanenten Sperren', value: true, type: 'checkbox' }
    ],
    'forum-settings': [
        { name: 'topicLength', label: 'Maximale Themenlänge', value: '12000', type: 'number' },
        { name: 'editWindow', label: 'Bearbeitungsfenster in Minuten', value: '30', type: 'number' },
        { name: 'reportThreshold', label: 'Meldungen bis zur Prüfung', value: '3', type: 'number' },
        { name: 'reactionsEnabled', label: 'Reaktionen im Forum erlauben', value: true, type: 'checkbox' }
    ],
    'commerce-settings': [
        { name: 'companyName', label: 'Unternehmensname', value: 'SeriuxMod', type: 'text' },
        { name: 'vatId', label: 'Umsatzsteuer-ID', value: 'Noch nicht hinterlegt', type: 'text' },
        { name: 'currency', label: 'Standardwährung', value: 'EUR', type: 'text' },
        { name: 'invoicePrefix', label: 'Rechnungspräfix', value: 'SXM', type: 'text' },
        { name: 'automaticInvoices', label: 'Rechnungen automatisch erstellen', value: true, type: 'checkbox' }
    ]
};

export const COLUMN_LABELS = {
    activity: 'Aktivität',
    address: 'Adresse',
    article: 'Beitrag',
    assignee: 'Zuständig',
    author: 'Autor',
    availability: 'Verfügbarkeit',
    board: 'Bereich',
    case: 'Vorgang',
    category: 'Kategorie',
    clan: 'Clan',
    code: 'Code',
    color: 'Farbe',
    connection: 'Verbindung',
    content: 'Inhalt',
    cosmetic: 'Cosmetic',
    coverage: 'Abdeckung',
    customer: 'Kunde',
    discount: 'Rabatt',
    duration: 'Dauer',
    english: 'Englisch',
    expires: 'Gültig bis',
    fee: 'Gebühr',
    field: 'Feld',
    german: 'Deutsch',
    group: 'Gruppe',
    interactions: 'Interaktionen',
    key: 'Schlüssel',
    label: 'Label',
    lastOrder: 'Letzte Bestellung',
    leader: 'Leitung',
    members: 'Mitglieder',
    method: 'Methode',
    moderate: 'Moderieren',
    moderator: 'Moderator',
    order: 'Bestellung',
    orders: 'Bestellungen',
    owner: 'Verantwortlich',
    owners: 'Besitzer',
    party: 'Party',
    payment: 'Zahlung',
    placement: 'Platzierung',
    player: 'Spieler',
    players: 'Spieler',
    posts: 'Beiträge',
    price: 'Preis',
    priority: 'Priorität',
    product: 'Produkt',
    products: 'Produkte',
    read: 'Lesen',
    reason: 'Grund',
    redemptions: 'Einlösungen',
    report: 'Meldung',
    reports: 'Meldungen',
    required: 'Pflichtfeld',
    revenue: 'Umsatz',
    rights: 'Rechte',
    scope: 'Bereich',
    server: 'Server',
    since: 'Seit',
    stock: 'Verfügbarkeit',
    subject: 'Gegenstand',
    suggestion: 'Vorschlag',
    surface: 'Oberfläche',
    tag: 'Tag',
    time: 'Zeitpunkt',
    topics: 'Themen',
    total: 'Gesamt',
    transactions: 'Transaktionen',
    type: 'Typ',
    updated: 'Aktualisiert',
    usage: 'Verwendung',
    votes: 'Stimmen',
    write: 'Schreiben'
};

export function createActivityEvents(count = 80) {
    const actions = [
        'Datensatz geprüft',
        'Status aktualisiert',
        'Notiz ergänzt',
        'Freigabe vorbereitet',
        'Aufgabe verschoben'
    ];
    const areas = ['Launcher', 'Client', 'Forum', 'Store', 'Moderation', 'Webseite'];
    return Array.from({ length: count }, (_, index) => ({
        id: `TEST-${String(index + 1).padStart(3, '0')}`,
        action: actions[index % actions.length],
        area: areas[index % areas.length],
        actor: `TestMember${String((index % 8) + 1).padStart(2, '0')}`,
        time: `vor ${index + 2} Min.`,
        status: index % 7 === 0 ? 'Prüfung' : 'Erledigt'
    }));
}

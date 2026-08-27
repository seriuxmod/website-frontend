import {
    FaAt,
    FaCircleQuestion,
    FaHeart,
    FaLightbulb,
    FaMedal,
    FaMusic,
    FaNewspaper,
    FaScrewdriverWrench
} from 'react-icons/fa6';

export const communityItems = [
    {
        slug: 'badges',
        label: 'Badges',
        description: 'Nutzer-Badges entdecken',
        icon: FaMedal,
        eyebrow: 'DEINE AUSZEICHNUNGEN',
        title: 'Badges, die deine Geschichte zeigen.',
        copy: 'Entdecke Community-, Event- und Unterstützer-Badges und erfahre, wie du sie für dein SeriuxMod-Profil freischaltest.',
        features: ['Community-Auszeichnungen', 'Event-Badges', 'Profil-Darstellung']
    },
    {
        slug: 'names',
        label: 'Namen',
        description: 'Minecraft-Namen suchen',
        icon: FaAt,
        eyebrow: 'SPIELER FINDEN',
        title: 'Minecraft-Profile schnell finden.',
        copy: 'Suche Spieler über ihren aktuellen Minecraft-Namen und öffne ihr öffentliches SeriuxMod-Profil.',
        features: ['Namenssuche', 'Öffentliche Profile', 'Minecraft-Identität']
    },
    {
        slug: 'feedback',
        label: 'Feedback',
        description: 'Funktionsvorschläge einreichen',
        icon: FaLightbulb,
        eyebrow: 'DEINE IDEEN',
        title: 'Gestalte SeriuxMod mit uns.',
        copy: 'Teile Ideen, melde Probleme und diskutiere neue Client-Funktionen direkt mit der Community.',
        features: ['Feature-Vorschläge', 'Community-Abstimmung', 'Offene Diskussionen'],
        cta: { label: 'Zum Feedback-Forum', to: '/forum/6a907487820fbf197544646a' }
    },
    {
        slug: 'tools',
        label: 'Tools',
        description: 'Generatoren & Rechner',
        icon: FaScrewdriverWrench,
        eyebrow: 'PRAKTISCHE HELFER',
        title: 'Werkzeuge für deinen Minecraft-Alltag.',
        copy: 'Hier entsteht eine Sammlung nützlicher Generatoren, Rechner und kleiner Hilfen für Client und Community.',
        features: ['Minecraft-Rechner', 'Profil-Generatoren', 'Client-Hilfen']
    },
    {
        slug: 'blog',
        label: 'Blog',
        description: 'Neuigkeiten & Updates',
        icon: FaNewspaper,
        eyebrow: 'SERIUXMOD NEWS',
        title: 'Updates aus erster Hand.',
        copy: 'Release Notes, Entwicklungsstände und Einblicke hinter die Kulissen des SeriuxMod-Projekts.',
        features: ['Release Notes', 'Entwicklungsupdates', 'Community-News'],
        cta: { label: 'Ankündigungen lesen', to: '/forum/demo-announcements' }
    },
    {
        slug: 'spotify',
        label: 'Spotify',
        description: 'Community-Musik',
        icon: FaMusic,
        eyebrow: 'COMMUNITY SOUND',
        title: 'Der Sound für deine nächste Session.',
        copy: 'Entdecke künftig Playlists und Musikempfehlungen aus der SeriuxMod-Community.',
        features: ['Community-Playlists', 'Musikempfehlungen', 'Gemeinsame Sessions']
    },
    {
        slug: 'contribute',
        label: 'Mitwirken',
        description: 'Der Community helfen',
        icon: FaHeart,
        eyebrow: 'GEMEINSAM BAUEN',
        title: 'Mach SeriuxMod ein Stück besser.',
        copy: 'Unterstütze das Projekt mit Code, Tests, Übersetzungen, Design oder hilfreichem Feedback.',
        features: ['Open-Source-Projekte', 'Tests & Übersetzungen', 'Community-Support'],
        cta: { label: 'SeriuxMod auf GitHub', to: 'https://github.com/seriuxmod', external: true }
    },
    {
        slug: 'support',
        label: 'Support',
        description: 'Hilfe erhalten',
        icon: FaCircleQuestion,
        eyebrow: 'WIR HELFEN DIR',
        title: 'Antworten, wenn du sie brauchst.',
        copy: 'Finde Anleitungen für Launcher, Webseite und Client oder stelle deine Frage direkt im Support-Forum.',
        features: ['Launcher-Hilfe', 'Account-Support', 'Community-Antworten'],
        cta: { label: 'Support-Forum öffnen', to: '/forum/demo-support' }
    }
];

export const communityPageBySlug = Object.fromEntries(communityItems.map((item) => [item.slug, item]));

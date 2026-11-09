import { FaAt, FaCircleQuestion, FaLightbulb, FaMedal, FaPalette, FaServer } from 'react-icons/fa6';

export const communityItems = [
    {
        slug: 'servers', label: 'Server', description: 'Freigegebene Minecraft-Server entdecken', icon: FaServer,
        eyebrow: 'SERVERVERZEICHNIS', title: 'Minecraft-Server entdecken',
        copy: 'Öffentliche Einträge aus dem Social-Katalog.', features: ['Freigegebene Einträge', 'Optionale Spielerzahlen']
    },
    {
        slug: 'skins', label: 'Skins', description: 'Veröffentlichte Skin-Texturen entdecken', icon: FaPalette,
        eyebrow: 'GEMEINSAME BIBLIOTHEK', title: 'Skin-Texturen entdecken',
        copy: 'Explizit veröffentlichte, exakt deduplizierte Texturen ohne öffentliche Herkunftsbezüge.',
        features: ['Veröffentlichter Katalog', 'Exakte Pixelidentität', 'Keine öffentlichen Herkunfts-UUIDs']
    },
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
        cta: { label: 'Vorschläge öffnen', to: '/community/feedback' }
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

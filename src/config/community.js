import { FaAt, FaCircleQuestion, FaLightbulb, FaMedal } from 'react-icons/fa6';

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

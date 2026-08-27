import { useEffect, useState } from 'react';
import { FaArrowRight, FaCheck, FaCloudArrowDown, FaComments, FaGamepad, FaLayerGroup, FaShieldHalved, FaStore, FaUserGroup, FaUsers, FaWindows } from 'react-icons/fa6';

const API = 'https://api.seriuxmod.net/api/v1';

const features = [
    [FaLayerGroup, 'Dein Spiel. Dein Setup.', 'Ein Client, der zu dir passt.', 'Performance-Module, HUD-Elemente und Quality-of-Life-Features in einem klaren Interface.'],
    [FaUsers, 'Gemeinsam spielen', 'Deine Community immer dabei.', 'Profile, Freunde und Social Features verbinden dich über Servergrenzen hinweg.'],
    [FaStore, 'Ausdruck ohne Grenzen', 'Mach deinen Look einzigartig.', 'Entdecke Cosmetics und synchronisiere deinen Auftritt über dein SeriuxMod-Konto.'],
];

const platformModules = [
    {
        icon: FaComments,
        name: 'Forum & Content',
        text: 'Diskussionen, News und Ideen aus der gesamten Community.',
        capabilities: ['Foren & Topics', 'Posts & Reaktionen', 'Blog & News', 'Vorschläge & Votes', 'Support-Tickets'],
        action: 'Community entdecken',
        href: '/forum',
    },
    {
        icon: FaUserGroup,
        name: 'Social Hub',
        text: 'Alles, was deine Freunde und Mitspieler zusammenbringt.',
        capabilities: ['Freundesliste', 'Freundschaftsanfragen', 'Clans & Ränge', 'Partys & Einladungen', 'Clan-Statistiken'],
        action: 'Social Hub öffnen',
        href: '/clans',
    },
    {
        icon: FaStore,
        name: 'Store & Cosmetics',
        text: 'Deine Sammlung, deine Credits und dein persönlicher Stil.',
        capabilities: ['Cosmetics', 'Capes & Emotes', 'Extensions', 'Bestellungen', 'Credits & Freischaltungen'],
        action: 'Store ansehen',
        href: '/store',
    },
    {
        icon: FaShieldHalved,
        name: 'Account & Sicherheit',
        text: 'Eine Identität für Client, Website und Community.',
        capabilities: ['Seriux-Profil', 'Minecraft-Verknüpfung', 'Gruppen & Rechte', 'Geräte & Sessions', 'Moderationshistorie'],
        action: 'Account verwalten',
        href: 'https://auth.seriuxmod.net',
    },
];

function SystemStatus() {
    const [online, setOnline] = useState(null);
    useEffect(() => {
        const controller = new AbortController();
        fetch(`${API}/status/summary`, { signal: controller.signal })
            .then((response) => response.ok ? response.json() : Promise.reject())
            .then((data) => {
                const core = data.services?.filter((service) => service.group === 'seriuxmod') ?? [];
                setOnline(core.length > 0 && core.every((service) => service.state === 'UP'));
            })
            .catch(() => setOnline(false));
        return () => controller.abort();
    }, []);
    return <a href={`${API}/status`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-3 py-2 text-xs text-zinc-400"><i className={`h-2 w-2 rounded-full ${online === false ? 'bg-amber-400' : 'bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,.12)]'}`} />{online ? 'Alle Kernsysteme online' : 'Systemstatus ansehen'}</a>;
}

function ForumPreview() {
    const [state, setState] = useState({ loading: true, forums: [], topics: [], error: false });

    useEffect(() => {
        const controller = new AbortController();
        Promise.all([
            fetch(`${API}/forum/tree`, { signal: controller.signal }),
            fetch(`${API}/forum/latest?size=6`, { signal: controller.signal }),
        ])
            .then((responses) => responses.every((response) => response.ok) ? Promise.all(responses.map((response) => response.json())) : Promise.reject())
            .then(([tree, latest]) => setState({ loading: false, forums: tree.nodes ?? [], topics: latest.items ?? [], error: false }))
            .catch((error) => {
                if (error.name !== 'AbortError') setState({ loading: false, forums: [], topics: [], error: true });
            });
        return () => controller.abort();
    }, []);

    return <section id="forum" className="border-y border-white/[.06] bg-[#0c0d11] py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div><p className="eyebrow">AUS DER COMMUNITY</p><h2 className="section-title">Aktuelle Themen.</h2><p className="section-copy">Das Forum ist für alle lesbar. Zum Schreiben und Bearbeiten meldest du dich mit deinem Minecraft-Konto an.</p></div>
                <a href="/#/forum" className="button-secondary">Alle Foren öffnen <FaArrowRight /></a>
            </div>
            {!state.loading && !state.error && state.forums.length > 0 && <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {state.forums.map((forum) => <a key={forum.id} href={`/#/forum?forum=${forum.id}`} className="rounded-2xl border border-white/[.07] bg-[#121318] p-6 transition hover:border-orange-500/30"><h3 className="font-display text-lg font-bold">{forum.title}</h3><p className="mt-2 text-sm leading-6 text-zinc-500">{forum.description || 'Community-Forum'}</p><span className="mt-5 block text-xs text-orange-400">{forum.topics ?? 0} Themen · {forum.posts ?? 0} Beiträge</span></a>)}
            </div>}
            <div className={`${state.forums.length > 0 ? 'mt-5' : 'mt-12'} overflow-hidden rounded-3xl border border-white/[.07] bg-[#121318]`}>
                {state.loading && <p className="p-8 text-sm text-zinc-500">Themen werden geladen …</p>}
                {state.error && <p className="p-8 text-sm text-amber-400">Das Forum ist momentan nicht erreichbar.</p>}
                {!state.loading && !state.error && state.forums.length === 0 && state.topics.length === 0 && <p className="p-8 text-sm text-zinc-500">Noch wurden keine öffentlichen Foren oder Themen erstellt.</p>}
                {!state.loading && !state.error && state.forums.length > 0 && state.topics.length === 0 && <p className="p-8 text-sm text-zinc-500">In diesen Foren wurden noch keine Themen erstellt.</p>}
                {state.topics.map((topic) => <a key={topic.id} href={`/#/forum?topic=${topic.id}`} className="group grid gap-3 border-b border-white/[.06] p-6 last:border-0 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div><h3 className="font-display text-lg font-bold transition group-hover:text-orange-400">{topic.title}</h3><p className="mt-2 text-xs text-zinc-600">{topic.sticky ? 'Angepinnt · ' : ''}{topic.views ?? 0} Aufrufe</p></div>
                    <span className="text-xs text-zinc-500">{new Date(topic.lastReplyAt ?? topic.createdAt).toLocaleDateString('de-DE')}</span>
                </a>)}
            </div>
        </div>
    </section>;
}

function ClientPreview() {
    return <div className="relative min-h-[430px] lg:min-h-[560px]">
        <div className="absolute inset-[5%] rounded-full border border-orange-500/20" />
        <div className="absolute left-1/2 top-1/2 w-[115%] -translate-x-1/2 -translate-y-1/2 rotate-12 rounded-[50%] border border-orange-500/10 py-32" />
        <div className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-white/10 bg-[#111318] shadow-[0_50px_100px_rgba(0,0,0,.6),0_0_80px_rgba(255,90,22,.12)] lg:-rotate-2">
            <div className="flex h-11 items-center gap-1.5 border-b border-white/5 bg-white/[.025] px-4"><i className="h-2 w-2 rounded-full bg-orange-500" /><i className="h-2 w-2 rounded-full bg-zinc-700" /><i className="h-2 w-2 rounded-full bg-zinc-700" /><span className="ml-auto text-[8px] font-bold tracking-[.24em] text-zinc-600">SERIUX CLIENT</span></div>
            <div className="scene relative h-[320px] overflow-hidden">
                <div className="absolute right-16 top-12 h-14 w-14 rounded bg-orange-400 shadow-[0_0_55px_#ff5a16]" />
                <div className="mountain absolute bottom-[35%] left-[-5%] h-1/2 w-3/4 bg-[#1a2028]" />
                <div className="mountain absolute bottom-[35%] left-[38%] h-[38%] w-3/4 bg-[#10151b]" />
                <div className="absolute left-5 top-5 z-10 rounded-xl border border-white/10 bg-black/60 px-4 py-3 backdrop-blur"><span className="text-[9px] tracking-widest text-zinc-500">FPS</span><b className="ml-4 text-orange-400">248</b></div>
                <div className="absolute bottom-5 right-5 z-10 flex items-center gap-3 rounded-xl border border-white/10 bg-black/60 px-4 py-3 backdrop-blur"><i className="h-2 w-2 rounded-full bg-emerald-400" /><span><small className="block text-[8px] tracking-widest text-zinc-500">SERVER</small><b className="text-sm">Online</b></span></div>
            </div>
        </div>
        <div className="absolute bottom-8 left-[-2%] z-20 hidden items-center gap-3 rounded-xl border border-white/10 bg-[#111318]/90 px-4 py-3 shadow-2xl backdrop-blur sm:flex"><FaLayerGroup className="text-xl text-orange-500" /><span><b className="block text-sm">42 Module</b><small className="text-[9px] text-zinc-500">Alles unter Kontrolle</small></span></div>
        <div className="absolute right-[-2%] top-16 z-20 hidden items-center gap-3 rounded-xl border border-white/10 bg-[#111318]/90 px-4 py-3 shadow-2xl backdrop-blur sm:flex"><FaShieldHalved className="text-xl text-orange-500" /><span><b className="block text-sm">Sicher verbunden</b><small className="text-[9px] text-zinc-500">Seriux Account</small></span></div>
    </div>;
}

export default function Home() {
    return <main id="top" className="overflow-hidden bg-[#090a0d] text-white">
        <section className="mx-auto grid min-h-[760px] max-w-7xl items-center gap-14 px-5 py-20 lg:grid-cols-2 lg:px-10 lg:py-28">
            <div>
                <SystemStatus />
                <p className="mt-8 text-xs font-extrabold tracking-[.18em] text-orange-400">DEIN MINECRAFT. NEU GEDACHT.</p>
                <h1 className="mt-4 font-display text-5xl font-bold leading-[.98] tracking-[-.055em] sm:text-7xl">Mehr als spielen.<br /><span className="bg-gradient-to-r from-orange-500 to-amber-300 bg-clip-text text-transparent">Erlebe Minecraft.</span></h1>
                <p className="mt-7 max-w-xl text-base leading-8 text-zinc-400">SeriuxMod verbindet Performance, Individualität und Community in einem modernen Minecraft Client – gemacht für dein nächstes Abenteuer.</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href="#download" className="button-primary"><FaWindows /> Für Windows herunterladen</a><a href="#features" className="button-secondary">Features entdecken <FaArrowRight /></a></div>
                <div className="mt-7 flex flex-wrap gap-5 text-xs text-zinc-600">{['Kostenlos', 'Sicher', 'Community-first'].map((item) => <span className="flex items-center gap-1.5" key={item}><FaCheck className="text-orange-500" />{item}</span>)}</div>
            </div>
            <ClientPreview />
        </section>

        <section id="features" className="mx-auto max-w-7xl px-5 py-24 lg:px-10 lg:py-32">
            <div className="max-w-2xl"><p className="eyebrow">ALLES, WAS DU BRAUCHST</p><h2 className="section-title">Gebaut für dein bestes Spiel.</h2><p className="section-copy">Leistungsstarke Werkzeuge, klares Design und eine Plattform, die mit dir wächst.</p></div>
            <div className="mt-14 grid gap-5 lg:grid-cols-3">{features.map(([Icon, eyebrow, title, text]) => <article key={title} className="group relative min-h-[370px] overflow-hidden rounded-3xl border border-white/[.07] bg-gradient-to-br from-[#16181d] to-[#0e0f12] p-8">
                <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl transition group-hover:bg-orange-500/20" />
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-orange-500/10 text-xl text-orange-500"><Icon /></div>
                <div className="mt-20"><small className="text-zinc-600">{eyebrow}</small><h3 className="mt-2 font-display text-2xl font-bold tracking-tight">{title}</h3><p className="mt-4 text-sm leading-7 text-zinc-500">{text}</p></div>
                <a href="#download" className="absolute bottom-8 flex items-center gap-2 text-xs font-bold text-zinc-300">Mehr erfahren <FaArrowRight /></a>
            </article>)}</div>
        </section>

        <ForumPreview />

        <section id="platform" className="border-y border-white/[.06] bg-[#0c0d11] py-24 lg:py-32">
            <div className="mx-auto max-w-7xl px-5 lg:px-10">
                <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
                    <div className="max-w-2xl"><p className="eyebrow">DAS SERIUXMOD-ÖKOSYSTEM</p><h2 className="section-title">Eine Plattform für alles.</h2><p className="section-copy">Das Backend verbindet Community, Social Features, Store und deinen Minecraft-Account. Nach der Anmeldung stehen alle Module mit derselben Identität bereit.</p></div>
                    <div className="flex items-center gap-3 rounded-2xl border border-white/[.07] bg-white/[.025] px-4 py-3 text-xs text-zinc-500"><i className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_12px_#f97316]" /> API v1 verbunden</div>
                </div>
                <div className="mt-14 grid gap-5 md:grid-cols-2">
                    {platformModules.map(({ icon: Icon, name, text, capabilities, action, href }, moduleIndex) => <article key={name} className="platform-card group relative overflow-hidden rounded-3xl border border-white/[.07] bg-[#121318] p-7 sm:p-9">
                        <span className="absolute right-7 top-6 font-display text-5xl font-bold text-white/[.025]">0{moduleIndex + 1}</span>
                        <div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-lg text-orange-400"><Icon /></div><div><h3 className="font-display text-2xl font-bold tracking-tight">{name}</h3><p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">{text}</p></div></div>
                        <div className="mt-8 grid gap-2 sm:grid-cols-2">{capabilities.map((capability) => <span key={capability} className="flex items-center gap-2 rounded-xl border border-white/[.045] bg-black/15 px-3 py-2.5 text-xs text-zinc-400"><FaCheck className="text-[10px] text-orange-500" /> {capability}</span>)}</div>
                        <a href={href} className="mt-7 inline-flex items-center gap-2 text-xs font-bold text-zinc-300 transition group-hover:text-orange-400">{action} <FaArrowRight /></a>
                    </article>)}
                </div>
                <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
                    <div className="rounded-3xl border border-white/[.07] bg-gradient-to-br from-[#17191f] to-[#101115] p-7 sm:p-9"><div className="flex items-center gap-3"><FaGamepad className="text-xl text-orange-400" /><h3 className="font-display text-xl font-bold">Minecraft Client & Launcher</h3></div><p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500">Module, Cosmetics und Account-Einstellungen werden zukünftig direkt mit dem Client synchronisiert. Die Microsoft-/Minecraft-Verknüpfung wird im nächsten Authserver-Schritt eingerichtet.</p></div>
                    <a href={`${API}/status/summary`} target="_blank" rel="noreferrer" className="group rounded-3xl border border-emerald-400/10 bg-emerald-400/[.035] p-7 sm:p-9"><div className="flex items-center gap-3"><i className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,.09)]" /><h3 className="font-display text-xl font-bold">Live-Systemstatus</h3></div><p className="mt-4 text-sm leading-7 text-zinc-500">Verfügbarkeit aller SeriuxMod-Dienste in Echtzeit prüfen.</p><span className="mt-6 flex items-center gap-2 text-xs font-bold text-emerald-400">Status öffnen <FaArrowRight className="transition group-hover:translate-x-1" /></span></a>
                </div>
            </div>
        </section>

        <section id="community" className="bg-gradient-to-br from-orange-500 to-[#e33d0b] py-24 text-[#251007]">
            <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 lg:grid-cols-2 lg:px-10">
                <div><p className="text-xs font-extrabold tracking-[.18em] text-orange-950/70">EINE PLATTFORM. EINE IDENTITÄT.</p><h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-[-.045em] sm:text-6xl">Deine Welt hört nicht am Serverrand auf.</h2><p className="mt-6 max-w-xl leading-8 text-orange-950/70">Account, Freunde und Einstellungen an einem Ort. Forum, Social Hub und Store bilden ein gemeinsames Erlebnis auf dem SeriuxMod-Backend.</p><a href="#download" className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white px-5 py-4 text-sm font-bold shadow-xl">Website-Zugang im Launcher aktivieren <FaArrowRight /></a></div>
                <div className="relative mx-auto w-full max-w-lg rounded-3xl border border-white/20 bg-[#101115] p-8 text-white shadow-[0_35px_80px_rgba(78,15,0,.35)]"><div className="flex items-center gap-5"><img className="h-24 w-24 rounded-2xl object-contain" src="/logo.png" alt="SeriuxMod Fuchs" /><div><small className="text-[10px] tracking-[.18em] text-orange-400">SERIUX PROFILE</small><h3 className="mt-2 font-display text-2xl font-bold">Willkommen zurück.</h3><p className="mt-2 text-xs text-zinc-500">Dein Account. Dein Netzwerk. Dein Client.</p></div></div><span className="mt-7 flex items-center gap-2 text-[10px] text-emerald-400"><i className="h-2 w-2 rounded-full bg-emerald-400" /> ONLINE</span></div>
            </div>
        </section>

        <section id="download" className="mx-auto max-w-7xl px-5 py-24 lg:px-10"><div className="relative flex flex-col items-start justify-between gap-10 overflow-hidden rounded-3xl border border-white/10 bg-[#131419] p-8 sm:p-14 lg:flex-row lg:items-center"><div className="absolute -right-24 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" /><div className="relative max-w-2xl"><p className="eyebrow">BEREIT, WENN DU ES BIST</p><h2 className="mt-3 font-display text-4xl font-bold tracking-tight">Dein nächstes Abenteuer startet hier.</h2><p className="mt-4 text-sm leading-7 text-zinc-500">Dein Spielerprofil entsteht beim ersten verifizierten Minecraft-Login. Den optionalen Website-Zugang mit E-Mail und Passwort aktivierst du anschließend direkt im Launcher.</p></div><a href="#top" className="button-primary relative shrink-0"><FaCloudArrowDown /> Launcher herunterladen</a></div></section>
    </main>;
}

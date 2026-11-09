// Run in the local fixture browser only: await (await import('./website-browser-checks.mjs')).runReadChecks()
// These checks exercise real React pages against the simulated binary peer, NOT a deployed backend.
const reads = [
    ['/admin', 'Gemeldete Regionen'], ['/admin/skins', 'Texturen und Veröffentlichung'],
    ['/community/skins', '64 × 64 Pixel'], ['/community/servers', 'Keine Spielerzahl gemeldet'],
    ['/store', 'Testdatensatz Produkt'], ['/store/account', 'Noch keine Bestellungen vorhanden.'],
    ['/store/checkout', 'Rechnungsdaten'], ['/forum', 'Testdatensatz Forum'],
    ['/forum/test-forum', 'Testdatensatz Thema'], ['/forum/topic/test-topic', '<script>Testdatensatz bleibt Klartext</script>'],
    ['/community/blog/testdatensatz', '<script>Testdatensatz bleibt Klartext</script>'],
    ['/admin/forum/analytics', 'Forum'], ['/admin/forum/blog', 'Redaktionsübersicht'],
    ['/admin/forum/structure', 'Forum-Struktur'], ['/admin/forum/permissions', 'Forum-Gruppenrechte'],
    ['/admin/forum/labels', 'Label-Verzeichnis'], ['/admin/forum/reports', 'Forum-Meldungen'],
    ['/admin/forum/suggestions', 'Vorschlagsverwaltung'], ['/admin/forum/settings', 'Forum-Einstellungen'],
    ['/admin/players', 'Benutzerkonten'], ['/admin/permissions', 'Berechtigungsgruppen'],
    ['/admin/translations', 'Übersetzungen'], ['/admin/cosmetics', 'Cosmetics'], ['/admin/friends', 'Freunde'],
    ['/admin/clans', 'Clans'], ['/admin/parties', 'Parties'], ['/admin/public-servers', 'Öffentliche Serverliste'],
    ['/admin/team', 'Teamübersicht'], ['/admin/team/calendar', 'Teamkalender'], ['/admin/team/activity', 'Teamaktivität'],
    ['/admin/team/todos', 'Teamaufgaben'], ['/admin/team/notes', 'Teamnotizen'],
    ['/admin/commerce', 'Shopübersicht'], ['/admin/commerce/catalog', 'Produktkatalog'],
    ['/admin/commerce/customers', 'Store-Konten'], ['/admin/commerce/orders', 'Vorgänge'],
    ['/admin/commerce/fields', 'Produktfelder'], ['/admin/commerce/coupons', 'Coupons'],
    ['/admin/commerce/payment-methods', 'Zahlungsmethoden'], ['/admin/commerce/settings', 'Firmendaten'],
    ['/admin/system-status', 'Keine Topologie gemeldet'], ['/status', 'Gemeldete Vorfälle'],
    ['/admin/moderation', 'Noch nicht mit dem Backend verbunden']
];
const failures = [
    ['/admin/skins', 'Skin-Katalog'], ['/community/skins', 'Skin-Texturen entdecken'],
    ['/community/servers', 'Minecraft-Server entdecken'], ['/store/account', 'Käufe & Freischaltungen'],
    ['/store/checkout', 'Checkout'], ['/admin/forum/blog', 'Blog'], ['/admin/forum/structure', 'Forum-Struktur'],
    ['/admin/commerce/catalog', 'Katalog'], ['/admin/players', 'Spieler'], ['/admin/translations', 'Übersetzungen']
];

export function until(condition, message) {
    return new Promise((resolve, reject) => {
        let observer, timeout;
        const check = () => { if (!condition()) return; observer?.disconnect(); clearTimeout(timeout); resolve(); };
        observer = new MutationObserver(check); observer.observe(document.getElementById('app'), { childList: true, subtree: true, attributes: true, characterData: true });
        timeout = setTimeout(() => { observer.disconnect(); reject(new Error(message)); }, 10000);
        check();
    });
}
export async function runReadChecks() {
    const fixture = window.websiteFixture;
    if (!fixture || fixture.mode !== 'ready') throw new Error('Use the local ready fixture.');
    const results = [];
    for (const [route, text] of reads) {
        fixture.navigate(route);
        await until(() => fixture.currentRoute === route && document.querySelector('main')?.innerText.includes(text)
            && !document.querySelector('main .animate-spin'), `Read view did not settle: ${route}`);
        const main = document.querySelector('main');
        if (main.querySelector('[role="alert"]')) throw new Error(`Unexpected alert: ${route}`);
        if (document.documentElement.scrollWidth > innerWidth) throw new Error(`Horizontal overflow: ${route}`);
        if (main.querySelector('script')) throw new Error(`Injected script: ${route}`);
        if (route === '/community/skins' && main.textContent.includes(fixture.uid)) throw new Error('Public skin page leaked source UUID.');
        if (route === '/community/servers' && !main.innerText.includes('0 / 20')) throw new Error('Real zero population was lost.');
        if (route === '/admin' && ![...main.querySelectorAll('article')].find(element => element.innerText.includes('OFFENE MELDUNGEN'))?.innerText.includes('\n9\n')) throw new Error('Native report total was lost.');
        results.push({ route, passed: true });
    }
    fixture.readEvidence = { kind: 'local-binary-peer-not-live', viewport: { width: innerWidth, height: innerHeight }, results };
    return fixture.readEvidence;
}
export async function runFailureChecks() {
    const fixture = window.websiteFixture;
    if (!fixture || !['error', 'denied'].includes(fixture.mode)) throw new Error('Use the local error or denied fixture.');
    const results = [];
    for (const [route, text] of failures) {
        fixture.navigate(route);
        await until(() => fixture.currentRoute === route && document.querySelector('main')?.innerText.includes(text)
            && document.querySelector('main')?.innerText.includes(fixture.mode === 'error' ? 'Der Backend-Dienst ist derzeit nicht erreichbar.' : 'Für diese Aktion fehlt')
            && !document.querySelector('main .animate-spin'), `Failure view did not settle: ${route}`);
        const main = document.querySelector('main');
        if (![...main.querySelectorAll('button')].some(button => /Erneut versuchen|Aktualisieren/.test(button.textContent))) throw new Error(`No retry: ${route}`);
        results.push({ route, passed: true });
    }
    fixture.failureEvidence = { kind: 'local-binary-peer-not-live', mode: fixture.mode, results };
    return fixture.failureEvidence;
}

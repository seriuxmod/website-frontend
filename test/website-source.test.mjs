import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

// Public source guard: no private contracts, gateway config or test credentials required.
test('website has no remaining application REST fetches; fixture entrypoints stay outside the production build', async () => {
    async function files(directory) {
        return (await Promise.all((await readdir(directory, { withFileTypes: true })).filter(entry => entry.name !== 'gen').map(entry => {
            const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
            return entry.isDirectory() ? files(path) : /\.(js|jsx)$/.test(entry.name) ? [path] : [];
        }))).flat();
    }
    for (const file of await files(new URL('../src/', import.meta.url))) {
        const source = await readFile(file, 'utf8');
        if (file.pathname.endsWith('/AdminApiWorldMap.jsx')) continue; // preserved, unreachable design artifact, not a data source
        assert.ok(!source.includes('api.seriuxmod.net') && !source.includes('/api/v1'), file.pathname);
        assert.ok(!source.includes('AdminApiWorldMap'), 'synthetic traffic/geography must remain an unreachable design artifact');
        assert.ok(!source.includes('website-browser') && !source.includes('social-browser') && !source.includes('live-website-browser'), file.pathname);
    }
});

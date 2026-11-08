import { copyFile, writeFile } from 'node:fs/promises';

await copyFile(new URL('../404.html', import.meta.url), new URL('../dist/404.html', import.meta.url));
await writeFile(new URL('../dist/CNAME', import.meta.url), 'seriuxmod.net\n');
await writeFile(new URL('../dist/.nojekyll', import.meta.url), '');

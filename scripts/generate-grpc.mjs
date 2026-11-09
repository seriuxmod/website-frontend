import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readdirSync } from 'node:fs';

const root = fileURLToPath(new URL('../', import.meta.url));
const proto = fileURLToPath(new URL('../../grpc-contracts/src/main/proto', import.meta.url));
// Generate all public domain contracts, not the internal auth/session transports.
// Generated descriptors do NOT expose a method: the browser gateway still needs exact per-RPC approval.
function sources(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const file = path.join(directory, entry.name);
        return entry.isDirectory() ? sources(file) : entry.name.endsWith('.proto') && !entry.name.startsWith('internal_') ? [file] : [];
    });
}
const files = sources(path.join(proto, 'seriuxmod')).sort();
const result = spawnSync(process.execPath, ['node_modules/@bufbuild/buf/bin/buf', 'generate', proto,
    '--template', 'buf.gen.yaml', ...files.flatMap(file => ['--path', file])], { cwd: root, stdio: 'inherit' });
process.exit(result.status ?? 1);

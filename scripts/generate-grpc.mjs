import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const proto = fileURLToPath(new URL('../../grpc-contracts/src/main/proto', import.meta.url));
const files = [
    'user/v1/public_user_model.proto', 'user/v1/public_user_service.proto',
    'user/v1/permission_model.proto', 'user/v1/permission_service.proto',
    'user/v1/account_security_model.proto', 'user/v1/account_security_service.proto',
    'auth/v1/device_session_model.proto', 'auth/v1/device_session_service.proto'
];
const result = spawnSync(process.execPath, ['node_modules/@bufbuild/buf/bin/buf', 'generate', proto,
    '--template', 'buf.gen.yaml', ...files.flatMap(file => ['--path', path.join(proto, 'seriuxmod', file)])], { cwd: root, stdio: 'inherit' });
process.exit(result.status ?? 1);

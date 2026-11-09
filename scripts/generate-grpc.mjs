import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const proto = fileURLToPath(new URL('../../grpc-contracts/src/main/proto', import.meta.url));
const files = [
    'user/v1/public_user_model.proto', 'user/v1/public_user_service.proto',
    'user/v1/permission_model.proto', 'user/v1/permission_service.proto',
    'user/v1/account_security_model.proto', 'user/v1/account_security_service.proto',
    'auth/v1/device_session_model.proto', 'auth/v1/device_session_service.proto',
    'social/v1/friend_model.proto', 'social/v1/friend_service.proto',
    'social/v1/clan_model.proto', 'social/v1/clan_service.proto',
    'social/v1/presence_model.proto', 'social/v1/presence_service.proto',
    'social/v1/activity_model.proto', 'social/v1/party_model.proto', 'social/v1/party_service.proto',
    'social/v1/notification_model.proto', 'social/v1/notification_service.proto',
    'social/v1/chat_model.proto', 'social/v1/chat_service.proto',
    'realtime/v1/realtime_model.proto', 'realtime/v1/realtime_service.proto',
    'user/v1/permission_event_model.proto', 'user/v1/user_model.proto', 'status/v1/status_model.proto'
];
const result = spawnSync(process.execPath, ['node_modules/@bufbuild/buf/bin/buf', 'generate', proto,
    '--template', 'buf.gen.yaml', ...files.flatMap(file => ['--path', path.join(proto, 'seriuxmod', file)])], { cwd: root, stdio: 'inherit' });
process.exit(result.status ?? 1);

import test from 'node:test';
import assert from 'node:assert/strict';
import { deflateSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { installPeer } from './grpc-peer.mjs';
import { skinApi as api, parseSkinSubjectCsv } from '../src/lib/skinApi.js';
import { SkinCatalogService as Public, SkinCatalogAdminService as Admin } from '../src/gen/seriuxmod/forum/v1/skin_catalog_service_pb.js';

// Genuine, synthetic 64x64 RGBA PNG, not a copied Minecraft/Laby asset.
function pngFixture() {
    const chunk = (type, data) => {
        const name = Buffer.from(type), bytes = Buffer.concat([name, data]);
        let crc = 0xffffffff;
        for (const byte of bytes) { crc ^= byte; for (let n = 0; n < 8; n++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1; }
        const prefix = Buffer.alloc(4), suffix = Buffer.alloc(4); prefix.writeUInt32BE(data.length); suffix.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
        return Buffer.concat([prefix, bytes, suffix]);
    };
    const header = Buffer.alloc(13); header.writeUInt32BE(64); header.writeUInt32BE(64, 4); header[8] = 8; header[9] = 6;
    return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(Buffer.alloc(64 * 257))), chunk('IEND', Buffer.alloc(0))]);
}
const png = pngFixture(), sha = value => createHash('sha256').update(value).digest('hex');
const texture = { textureId: `rgba8-v1-${'a'.repeat(64)}`, hashVersion: 'rgba8-v1', pixelSha256: 'a'.repeat(64), mediaSha256: sha(png), width: 64, height: 64 };
const uuid = '10000000-0000-4000-8000-000000000001';

test('published skin reads are anonymous, bounded and integrity-checked without exposing source subjects or admin revision state', async () => {
    const p = installPeer();
    try {
        const page = await p.call(Public, 'listTextures', { afterCursor: '', limit: 12 }, api.list, { items: [texture], nextCursor: 'opaque' }, { public: true });
        assert.equal(page.items[0].textureId, texture.textureId); assert.equal(page.nextCursor, 'opaque');
        assert.equal(Object.hasOwn(page.items[0], 'playerUuid'), false); assert.equal(Object.hasOwn(page.items[0], 'revision'), false);
        await p.call(Public, 'getTexture', { textureId: texture.textureId }, () => api.get(texture.textureId), texture, { public: true });
        const blob = await p.call(Public, 'readTexture', { textureId: texture.textureId }, () => api.media(texture), { texture, png }, { public: true });
        assert.equal(blob.type, 'image/png'); assert.deepEqual(new Uint8Array(await blob.arrayBuffer()), new Uint8Array(png));
        await p.call(Public, 'listTextures', { afterCursor: 'opaque', limit: 12 }, () => api.list('opaque'), { items: [] }, { public: true });
        assert.throws(() => api.get('https://external.invalid/skin.png'), /Textur-ID/);
        assert.throws(() => api.get(texture.textureId + '\n'), /Textur-ID/);
    } finally { p.restore(); }
});

test('private or malformed skin media fails closed; no admin, REST or third-party read fallback is attempted', async () => {
    const p = installPeer();
    try {
        await assert.rejects(p.call(Public, 'readTexture', { textureId: texture.textureId }, () => api.media(texture), {}, { public: true, code: 5 }), error => error.status === 404);
        await assert.rejects(p.call(Public, 'readTexture', { textureId: texture.textureId }, () => api.media(texture), { texture: { ...texture, height: 32 }, png }, { public: true }), /Katalog/);
        const altered = Buffer.from(png); altered[altered.length - 1] ^= 1;
        await assert.rejects(p.call(Public, 'readTexture', { textureId: texture.textureId }, () => api.media(texture), { texture, png: altered }, { public: true }), /Integritätsprüfung/);
        const wrongHeader = Buffer.from(png); wrongHeader.writeUInt32BE(1024, 16);
        const invalid = { ...texture, mediaSha256: sha(wrongHeader) };
        await assert.rejects(p.call(Public, 'readTexture', { textureId: texture.textureId }, () => api.media(invalid), { texture: invalid, png: wrongHeader }, { public: true }), /PNG-Kopfdaten/);
        assert.equal(p.paths.length, 4);
        await assert.rejects(api.media({ ...texture, width: 1024 }), /Texturmetadaten/);
        assert.equal(p.paths.length, 4, 'invalid catalog metadata must fail before any request');
    } finally { p.restore(); }
});

test('skin administration preserves exact revisions and private observation/job projections without worker claims or uploads', async () => {
    const p = installPeer(), revision = 9007199254740993n;
    try {
        const page = await p.call(Admin, 'listTextures', { afterCursor: '', limit: 24, publication: 1 }, () => api.admin.list('', 'DRAFT'), { items: [{ texture, publication: 1, revision }] });
        assert.equal(page.items[0].revision, '9007199254740993'); assert.equal(page.items[0].publication, 'DRAFT');
        await p.call(Admin, 'getTexture', { textureId: texture.textureId }, () => api.admin.get(texture.textureId), { texture, revision });
        await p.call(Admin, 'setPublication', { textureId: texture.textureId, publication: 2, expectedRevision: revision }, () => api.admin.setPublication(texture.textureId, 'PUBLISHED', page.items[0].revision));
        await assert.rejects(p.call(Admin, 'setPublication', { textureId: texture.textureId, publication: 3, expectedRevision: revision }, () => api.admin.setPublication(texture.textureId, 'HIDDEN', '9007199254740993'), {}, { code: 10 }), error => error.status === 409);
        assert.throws(() => api.admin.setPublication(texture.textureId, 'PUBLISHED', 9007199254740993), /Revisionsstand/);
        assert.throws(() => api.admin.setPublication(texture.textureId, 'PUBLISHED', '9223372036854775808'), /Revisionsstand/);
        assert.throws(() => api.admin.setPublication(texture.textureId, 'PUBLISHED', '1\n'), /Revisionsstand/);
        const subject = await p.call(Admin, 'getSubject', { playerUuid: uuid }, () => api.admin.subject(uuid), { playerUuid: uuid, sourceUsername: 'Synthetic', observationCount: revision, currentModel: 2 });
        assert.equal(subject.observationCount, revision.toString()); assert.equal(subject.currentModel, 'SLIM');
        const history = await p.call(Admin, 'listHistory', { playerUuid: uuid, afterCursor: 'opaque', limit: 24 }, () => api.admin.history(uuid, 'opaque'), { items: [{ playerUuid: uuid, model: 1, provenance: 'ADMIN_STAGED_INPUT' }] });
        assert.equal(history.items[0].provenance, 'ADMIN_STAGED_INPUT');
        const job = await p.call(Admin, 'getJob', { playerUuid: uuid }, () => api.admin.job(uuid), { playerUuid: uuid, state: 3, revision });
        assert.equal(job.state, 'PAUSED');
        await p.call(Admin, 'setJobPaused', { playerUuid: uuid, paused: false, expectedRevision: revision }, () => api.admin.setPaused(uuid, false, job.revision));
        assert.ok(!p.paths.some(path => /Claim|Complete|Fail/.test(path)));
    } finally { p.restore(); }
});

test('skin seed import has an explicit two-column/100-row boundary, per-row outcomes and caller-retained replay key', async () => {
    const p = installPeer();
    try {
        assert.deepEqual(parseSkinSubjectCsv(`uuid,username\r\n${uuid},Synthetic`), [{ playerUuid: uuid, username: 'Synthetic' }]);
        assert.throws(() => parseSkinSubjectCsv(''), /1–100/);
        assert.throws(() => parseSkinSubjectCsv(Array(101).fill(`${uuid},Synthetic`).join('\n')), /1–100/);
        assert.throws(() => parseSkinSubjectCsv(`${uuid},Synthetic,email@example.invalid`), /Kontodaten/);
        const expected = { idempotencyKey: uuid, sourceLabel: 'approved-fixture', subjects: [{ playerUuid: uuid, username: 'Synthetic' }, { playerUuid: 'invalid-uuid', username: '' }] };
        const call = () => api.admin.importSubjects(uuid, 'approved-fixture', `${uuid},Synthetic\ninvalid-uuid,`);
        const response = { batchId: 'batch', results: [{ index: 0, playerUuid: uuid, outcome: 1 }, { index: 1, outcome: 4, errorCode: 'UUID' }] };
        const result = await p.call(Admin, 'importSubjects', expected, call, response);
        assert.equal(result.results[0].outcome, 'CREATED'); assert.equal(result.results[1].outcome, 'INVALID');
        await p.call(Admin, 'importSubjects', expected, call, response);
        assert.equal(p.paths.length, 2, 'only caller-initiated manual replay uses the same key');
    } finally { p.restore(); }
});

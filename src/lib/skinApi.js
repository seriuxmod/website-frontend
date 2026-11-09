import { SkinCatalogService, SkinCatalogAdminService } from '../gen/seriuxmod/forum/v1/skin_catalog_service_pb.js';
import { websiteRpc as rpc } from './grpc/websiteRpc.js';

const publicCall = (method, request, signal) => rpc(SkinCatalogService, method, request, { public: true, exactLongs: true, signal });
const adminCall = (method, request, signal) => rpc(SkinCatalogAdminService, method, request, { exactLongs: true, signal });
function textureId(value) {
    if (typeof value !== 'string' || !/^rgba8-v1-[0-9a-f]{64}$/.test(value) || value.length !== 73) throw new Error('Ungültige Textur-ID.');
    return value;
}
function revision(value) {
    if (typeof value !== 'string' || !/^(0|[1-9][0-9]{0,18})$/.test(value) || /[^0-9]/.test(value) || BigInt(value) > 9223372036854775807n)
        throw new Error('Ein unveränderter Revisionsstand aus dem Backend ist erforderlich.');
    return value;
}
export function parseSkinSubjectCsv(text) {
    if (typeof text !== 'string' || text.length > 14000) throw new Error('Die Ausgangsliste ist zu groß. Maximal 100 Zeilen pro Import.');
    const lines = text.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
    if (/^(uuid|player_uuid|playerUuid),username$/.test(lines[0] ?? '')) lines.shift();
    if (!lines.length || lines.length > 100) throw new Error('Ein Import benötigt 1–100 Zeilen im Format uuid,username.');
    return lines.map((line, index) => {
        const row = line.split(',').map(value => value.trim());
        if (row.length !== 2 || row.some(value => value.length > 64)) throw new Error(`Zeile ${index + 1}: ausschließlich uuid,username übernehmen, keine weiteren Kontodaten.`);
        return { playerUuid: row[0], username: row[1] };
    });
}
export const skinApi = {
    list: (afterCursor = '', limit = 12, signal) => publicCall('listTextures', { afterCursor, limit }, signal),
    get: (id, signal) => publicCall('getTexture', { textureId: textureId(id) }, signal),
    async media(texture, signal) {
        if (texture.width !== 64 || ![32, 64].includes(texture.height) || texture.hashVersion !== 'rgba8-v1'
            || !/^[0-9a-f]{64}$/.test(texture.mediaSha256 ?? '') || texture.textureId !== `rgba8-v1-${texture.pixelSha256}`)
            throw new Error('Ungültige Texturmetadaten.');
        const result = await publicCall('readTexture', { textureId: textureId(texture.textureId) }, signal);
        if (!['textureId', 'mediaSha256', 'pixelSha256', 'hashVersion', 'width', 'height'].every(key => result.texture?.[key] === texture[key])
            || typeof result.png !== 'string' || result.png.length > 174764) throw new Error('Texturantwort stimmt nicht mit dem Katalog überein.');
        const bytes = Uint8Array.from(atob(result.png), character => character.charCodeAt(0));
        if (bytes.length < 33 || bytes.length > 131072) throw new Error('Ungültige Texturgröße.');
        const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        if (![137,80,78,71,13,10,26,10].every((value, index) => bytes[index] === value)
            || header.getUint32(8) !== 13 || header.getUint32(12) !== 0x49484452
            || header.getUint32(16) !== texture.width || header.getUint32(20) !== texture.height)
            throw new Error('Die PNG-Kopfdaten stimmen nicht mit der Textur überein.');
        const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join('');
        if (digest !== texture.mediaSha256) throw new Error('Die Integritätsprüfung der Textur ist fehlgeschlagen.');
        return new Blob([bytes], { type: 'image/png' });
    },
    admin: {
        list: (afterCursor = '', publication, signal) => adminCall('listTextures', { afterCursor, limit: 24, publication: publication || undefined }, signal),
        get: (id, signal) => adminCall('getTexture', { textureId: textureId(id) }, signal),
        setPublication: (id, publication, expectedRevision) => adminCall('setPublication', { textureId: textureId(id), publication, expectedRevision: revision(expectedRevision) }),
        importSubjects: (idempotencyKey, sourceLabel, text) => adminCall('importSubjects', { idempotencyKey, sourceLabel, subjects: parseSkinSubjectCsv(text) }),
        subject: (playerUuid, signal) => adminCall('getSubject', { playerUuid }, signal),
        history: (playerUuid, afterCursor = '', signal) => adminCall('listHistory', { playerUuid, afterCursor, limit: 24 }, signal),
        job: (playerUuid, signal) => adminCall('getJob', { playerUuid }, signal),
        setPaused: (playerUuid, paused, expectedRevision) => adminCall('setJobPaused', { playerUuid, paused, expectedRevision: revision(expectedRevision) })
    }
};

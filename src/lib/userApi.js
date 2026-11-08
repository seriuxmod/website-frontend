import { publicUsers, dateValue, identityCall } from './grpc/identityClients.js';

const profile = value => value ? { ...value, memberSince: dateValue(value.memberSince), lastOnline: dateValue(value.lastOnline) } : null;
const canonicalId = value => /^[a-f0-9]{32}$/i.test(value || '')
    ? value.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5') : value;
export const userApi = {
    byId: (playerId, signal) => identityCall(async () => profile((await publicUsers.getPublicUser({ playerId: canonicalId(playerId) }, { signal })).profile)),
    byUsername: (username, signal) => identityCall(async () => profile((await publicUsers.getPublicUserByUsername({ username }, { signal })).profile)),
    search: (query, limit = 8, signal) => identityCall(async () => (await publicUsers.searchPublicUsers({ query, limit }, { signal })).profiles.map(profile)),
    batch: (playerIds, signal) => !playerIds?.length ? Promise.resolve([]) : identityCall(async () =>
        (await publicUsers.batchGetPublicUsers({ playerIds: playerIds.map(canonicalId) }, { signal })).profiles.map(profile))
};

export function playerAvatar(playerId, size = 96) {
    return `https://mc-heads.net/avatar/${encodeURIComponent(playerId || 'Steve')}/${size}`;
}

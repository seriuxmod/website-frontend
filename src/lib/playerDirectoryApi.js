const PLAYER_DIRECTORY_API = (
    import.meta.env.VITE_PLAYER_DIRECTORY_API_URL || 'https://search.players.seriuxmod.net'
).replace(/\/$/, '');

const MINECRAFT_TEXTURE_CDN = 'https://textures.minecraft.net/texture';

const KNOWN_ANIMATIONS = new Set(['idle', 'walk', 'crouch', 'fly']);

function normalizeTextureHash(value) {
    const hash = typeof value === 'string' ? value.trim().toLowerCase() : '';
    return /^[a-f0-9]{32,64}$/.test(hash) ? hash : null;
}

export function minecraftTextureUrl(hash) {
    const normalizedHash = normalizeTextureHash(hash);
    return normalizedHash ? `${MINECRAFT_TEXTURE_CDN}/${normalizedHash}` : null;
}

function normalizePlayer(payload) {
    const source = payload?.rendering || {};
    const skinHash = normalizeTextureHash(payload?.skin?.hash);
    const capeHash = normalizeTextureHash(payload?.cape?.hash);

    const animations = Array.isArray(source.animations)
        ? source.animations.filter((animation) => KNOWN_ANIMATIONS.has(animation))
        : [];

    const model = source.model === 'slim' || payload?.skin?.model === 'slim' ? 'slim' : 'default';

    return {
        ...payload,
        skin: skinHash
            ? {
                  ...payload.skin,
                  hash: skinHash,
                  model: model === 'slim' ? 'slim' : 'wide'
              }
            : null,
        cape: capeHash ? { ...payload.cape, hash: capeHash } : null,
        rendering: {
            schemaVersion: Number(source.schemaVersion) || 1,
            model,
            skinTextureUrl: minecraftTextureUrl(skinHash),
            capeTextureUrl: minecraftTextureUrl(capeHash),
            hasOuterLayer: source.hasOuterLayer !== false,
            animations: animations.length ? animations : ['idle']
        }
    };
}

async function request(path, signal) {
    const response = await fetch(`${PLAYER_DIRECTORY_API}${path}`, {
        signal,
        headers: { Accept: 'application/json' }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(payload.message || 'Die Skin-Daten konnten nicht geladen werden.');
        error.status = response.status;
        throw error;
    }
    return normalizePlayer(payload);
}

export const playerDirectoryApi = {
    byIdentifier: (identifier, signal) => request(`/players/${encodeURIComponent(identifier)}`, signal),
    search: async (query, signal) => {
        try {
            return [await request(`/players/${encodeURIComponent(query)}`, signal)];
        } catch (error) {
            if (error.status === 404) return [];
            throw error;
        }
    }
};

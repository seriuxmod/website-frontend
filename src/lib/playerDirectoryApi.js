const PLAYER_DIRECTORY_API = (
    import.meta.env.VITE_PLAYER_DIRECTORY_API_URL || 'https://search.players.seriuxmod.net'
).replace(/\/$/, '');

const KNOWN_ANIMATIONS = new Set(['idle', 'walk', 'crouch', 'fly']);

function normalizeTextureUrl(value) {
    if (!value) return null;
    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
    } catch {
        return null;
    }
}

function normalizePlayer(payload) {
    const source = payload?.rendering;
    const skinTextureUrl = normalizeTextureUrl(source?.skinTextureUrl);
    if (!skinTextureUrl) {
        throw new Error('Für diesen Spieler ist derzeit keine renderbare Skin-Textur verfügbar.');
    }

    const animations = Array.isArray(source.animations)
        ? source.animations.filter((animation) => KNOWN_ANIMATIONS.has(animation))
        : [];

    return {
        ...payload,
        rendering: {
            schemaVersion: Number(source.schemaVersion) || 1,
            model: source.model === 'slim' ? 'slim' : 'default',
            skinTextureUrl,
            capeTextureUrl: normalizeTextureUrl(source.capeTextureUrl),
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
    byIdentifier: (identifier, signal) => request(`/players/${encodeURIComponent(identifier)}`, signal)
};

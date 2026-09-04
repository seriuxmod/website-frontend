const PLAYER_DIRECTORY_API = (
    import.meta.env.VITE_PLAYER_DIRECTORY_API_URL ||
    (import.meta.env.DEV ? '/player-directory' : 'https://search.players.seriuxmod.net')
).replace(/\/$/, '');

const MINECRAFT_TEXTURE_CDN = 'https://textures.minecraft.net/texture';

const KNOWN_ANIMATIONS = new Set(['idle', 'walk', 'crouch', 'fly']);

const PLAYER_DIRECTORY_ERRORS = {
    invalid_identifier: 'Bitte gib eine gültige Minecraft-UUID oder einen Spielernamen ein.',
    invalid_username: 'Minecraft-Namen dürfen nur Buchstaben, Zahlen und Unterstriche enthalten.',
    unauthorized: 'Die Spielersuche ist derzeit nicht öffentlich erreichbar.',
    origin_not_allowed: 'Die Spielersuche ist für diese Website noch nicht freigegeben.',
    player_not_found: 'Dieses Minecraft-Profil wurde nicht gefunden.',
    player_name_not_found: 'Zu diesem Minecraft-Namen wurde kein Profil gefunden.',
    cape_not_found: 'Dieses Cape wurde nicht gefunden.',
    rate_limited: 'Zu viele Suchanfragen. Bitte versuche es gleich erneut.',
    online_lookup_rate_limited: 'Zu viele neue Spielerabfragen. Bitte versuche es gleich erneut.',
    player_lookup_unavailable: 'Die Minecraft-Profilsuche ist vorübergehend nicht erreichbar.'
};

function normalizeTextureHash(value) {
    const hash = typeof value === 'string' ? value.trim().toLowerCase() : '';
    return /^[a-f0-9]{32,64}$/.test(hash) ? hash : null;
}

function normalizeHistory(payload) {
    const history = payload && typeof payload === 'object' ? payload : {};
    const nameEntries = Array.isArray(history.names) ? history.names : [];
    const namesByUsage = new Map();

    nameEntries.forEach((entry) => {
        if (!entry?.name) return;
        const key = entry.current
            ? `${entry.name.toLowerCase()}:current`
            : entry.sequence == null
              ? `${entry.name.toLowerCase()}:${entry.activeFrom || 'unknown'}:${entry.activeUntil || 'unknown'}`
              : `${entry.name.toLowerCase()}:sequence:${entry.sequence}`;
        const current = namesByUsage.get(key);
        const sources = [...new Set([...(current?.sources || []), ...(entry.sources || [])])];
        const accuracy = ['unknown', 'observed', 'exact'].reduce(
            (best, candidate) => ([current?.timeAccuracy, entry.timeAccuracy].includes(candidate) ? candidate : best),
            'unknown'
        );
        namesByUsage.set(key, {
            ...current,
            ...entry,
            sequence: entry.sequence ?? current?.sequence ?? null,
            activeFrom:
                current?.activeFrom && entry.activeFrom
                    ? current.activeFrom < entry.activeFrom
                        ? current.activeFrom
                        : entry.activeFrom
                    : current?.activeFrom || entry.activeFrom || null,
            firstObserved:
                current?.firstObserved && entry.firstObserved
                    ? current.firstObserved < entry.firstObserved
                        ? current.firstObserved
                        : entry.firstObserved
                    : current?.firstObserved || entry.firstObserved || null,
            lastObserved:
                current?.lastObserved && entry.lastObserved
                    ? current.lastObserved > entry.lastObserved
                        ? current.lastObserved
                        : entry.lastObserved
                    : current?.lastObserved || entry.lastObserved || null,
            timeAccuracy: accuracy,
            confidence: Math.max(Number(current?.confidence) || 0, Number(entry.confidence) || 0),
            sources
        });
    });

    const skins = (Array.isArray(history.skins) ? history.skins : [])
        .map((entry) => {
            const hash = normalizeTextureHash(entry?.hash);
            if (!hash) return null;
            return {
                ...entry,
                hash,
                model: entry.model === 'slim' ? 'slim' : 'wide',
                textureUrl: minecraftTextureUrl(hash),
                sources: Array.isArray(entry.sources) ? [...new Set(entry.sources)] : []
            };
        })
        .filter(Boolean);

    const capes = (Array.isArray(history.capes) ? history.capes : [])
        .map((entry) => {
            const hash = normalizeTextureHash(entry?.hash);
            if (!hash) return null;
            return {
                ...entry,
                hash,
                textureUrl: minecraftTextureUrl(hash),
                sources: Array.isArray(entry.sources) ? [...new Set(entry.sources)] : []
            };
        })
        .filter(Boolean);

    return { names: [...namesByUsage.values()], skins, capes };
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
        history: normalizeHistory(payload?.history),
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

function normalizeNameUsage(entry) {
    return {
        sequence: entry?.sequence ?? null,
        activeFrom: entry?.activeFrom || null,
        activeUntil: entry?.activeUntil || null,
        current: Boolean(entry?.current),
        timeAccuracy: ['exact', 'observed', 'unknown'].includes(entry?.timeAccuracy) ? entry.timeAccuracy : 'unknown',
        source: entry?.source || 'unknown',
        confidence: Number(entry?.confidence) || 0
    };
}

function normalizeNameOwner(owner) {
    if (!owner?.uuid) return null;
    return {
        uuid: owner.uuid,
        username: owner.username || null,
        matchType: owner.matchType === 'historical' ? 'historical' : 'current',
        usages: Array.isArray(owner.usages) ? owner.usages.map(normalizeNameUsage) : []
    };
}

function normalizeNameSearch(payload, fallbackQuery) {
    return {
        query: payload?.query || fallbackQuery,
        currentOwner: normalizeNameOwner(payload?.currentOwner),
        previousOwners: (Array.isArray(payload?.previousOwners) ? payload.previousOwners : [])
            .map(normalizeNameOwner)
            .filter(Boolean)
    };
}

function searchOwners(result) {
    const owners = [result.currentOwner, ...result.previousOwners].filter(Boolean);
    const seen = new Set();
    return owners.filter((owner) => {
        if (seen.has(owner.uuid)) return false;
        seen.add(owner.uuid);
        return true;
    });
}

function normalizeCape(payload) {
    const hash = normalizeTextureHash(payload?.hash);
    if (!hash) return null;
    return {
        ...payload,
        hash,
        textureUrl: minecraftTextureUrl(hash),
        statistics: {
            observedPlayers: Number(payload?.statistics?.observedPlayers) || 0,
            currentlySelectedBy: Number(payload?.statistics?.currentlySelectedBy) || 0,
            confirmedOwners: Number(payload?.statistics?.confirmedOwners) || 0
        }
    };
}

function assertTextureHash(hash) {
    const normalizedHash = normalizeTextureHash(hash);
    if (normalizedHash) return normalizedHash;
    const error = new Error('Der angegebene Cape-Hash ist ungültig.');
    error.status = 400;
    error.code = 'invalid_texture_hash';
    throw error;
}

async function request(path, signal) {
    const response = await fetch(`${PLAYER_DIRECTORY_API}${path}`, {
        signal,
        headers: { Accept: 'application/json' }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const errorCode = payload.error || 'unknown_error';
        const error = new Error(
            PLAYER_DIRECTORY_ERRORS[errorCode] || payload.message || 'Die Spielerdaten konnten nicht geladen werden.'
        );
        error.status = response.status;
        error.code = errorCode;
        error.retryAfter = Number(response.headers.get('retry-after')) || null;
        throw error;
    }
    return payload;
}

export const playerDirectoryApi = {
    byIdentifier: (identifier, signal) =>
        request(`/players/${encodeURIComponent(identifier)}`, signal).then(normalizePlayer),
    searchByName: async (query, signal) => {
        const normalizedQuery = query.trim();
        if (!/^[A-Za-z0-9_]{1,16}$/.test(normalizedQuery)) {
            const error = new Error(PLAYER_DIRECTORY_ERRORS.invalid_username);
            error.status = 400;
            error.code = 'invalid_username';
            throw error;
        }
        try {
            const payload = await request(`/players/search/${encodeURIComponent(normalizedQuery)}`, signal);
            return normalizeNameSearch(payload, normalizedQuery);
        } catch (error) {
            if (error.status === 404 && error.code === 'player_name_not_found') {
                return normalizeNameSearch(null, normalizedQuery);
            }
            throw error;
        }
    },
    search: async (query, signal) => {
        const result = await playerDirectoryApi.searchByName(query, signal);
        return searchOwners(result);
    },
    capeByHash: async (hash, signal) => {
        const normalizedHash = assertTextureHash(hash);
        return normalizeCape(await request(`/capes/${normalizedHash}`, signal));
    },
    capePlayers: async (hash, { limit = 100, offset = 0, signal } = {}) => {
        const normalizedHash = assertTextureHash(hash);
        const normalizedLimit = Math.min(500, Math.max(1, Number(limit) || 100));
        const normalizedOffset = Math.max(0, Number(offset) || 0);
        const payload = await request(
            `/capes/${normalizedHash}/players?limit=${normalizedLimit}&offset=${normalizedOffset}`,
            signal
        );
        return {
            ...payload,
            cape: normalizeCape(payload?.cape),
            limit: Number(payload?.limit) || normalizedLimit,
            offset: Number(payload?.offset) || normalizedOffset,
            players: Array.isArray(payload?.players) ? payload.players : []
        };
    },
    health: (signal) => request('/health', signal),
    ready: (signal) => request('/ready', signal)
};

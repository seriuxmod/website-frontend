const AUTH_URL = 'https://auth.seriuxmod.net';
const USER_PROFILE_URL = 'https://api.seriuxmod.net/api/v1/user/users/me';
const USER_PERMISSIONS_URL = 'https://api.seriuxmod.net/api/v1/user/permissions/me';
const CLIENT_ID = 'seriuxmod-website';
const PROFILE_KEY = 'seriux_user_profile';
const REFRESH_TOKEN_KEY = 'seriux_refresh_token';
const ACCESS_TOKEN_REFRESH_SKEW_MS = 2 * 60 * 1000;
const TERMINAL_REFRESH_ERRORS = new Set(['invalid_grant', 'invalid_client', 'unauthorized_client']);
let refreshRequest = null;

const base64Url = (bytes) =>
    btoa(String.fromCharCode(...new Uint8Array(bytes)))
        .replaceAll('+', '-')
        .replaceAll('/', '_')
        .replaceAll('=', '');

export const getAccessToken = () => sessionStorage.getItem('seriux_access_token');
const getIdentityToken = () => sessionStorage.getItem('seriux_identity_token');

const buildUser = (username, playerId) => ({
    username: username || 'Minecraft Spieler',
    playerId,
    permissions: [],
    groups: [],
    avatarUrl: `https://mc-heads.net/avatar/${encodeURIComponent(playerId || username || 'Steve')}/64`
});

const getCachedProfile = (playerId) => {
    try {
        const profile = JSON.parse(sessionStorage.getItem(PROFILE_KEY) || 'null');
        return profile?.playerId === playerId && profile?.username ? profile : null;
    } catch {
        return null;
    }
};

const decodePayload = (token) => {
    try {
        const value = token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/');
        const padded = value.padEnd(Math.ceil(value.length / 4) * 4, '=');
        return JSON.parse(
            decodeURIComponent(
                Array.from(
                    atob(padded),
                    (character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`
                ).join('')
            )
        );
    } catch {
        return null;
    }
};

const accessTokenExpired = (token, clockSkewMs = 0) => {
    const payload = decodePayload(token || '');
    const expiresAt = Number(payload?.exp) * 1000;
    return !Number.isFinite(expiresAt) || expiresAt <= Date.now() + clockSkewMs;
};

const storeTokens = (payload) => {
    sessionStorage.setItem('seriux_access_token', payload.access_token);
    if (payload.id_token) sessionStorage.setItem('seriux_identity_token', payload.id_token);
    if (payload.refresh_token) sessionStorage.setItem(REFRESH_TOKEN_KEY, payload.refresh_token);
};

const clearLocalSession = () => {
    sessionStorage.removeItem('seriux_access_token');
    sessionStorage.removeItem('seriux_identity_token');
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem('seriux_return_to');
    sessionStorage.removeItem('seriux_pkce_verifier');
    sessionStorage.removeItem('seriux_oauth_state');
    sessionStorage.removeItem(PROFILE_KEY);
};

export const hasStoredSession = () => {
    const accessToken = getAccessToken();
    return Boolean(
        sessionStorage.getItem(REFRESH_TOKEN_KEY) ||
            (accessToken && !accessTokenExpired(accessToken))
    );
};

const notifyExpiredSession = () => {
    window.dispatchEvent(
        new CustomEvent('seriux-auth-changed', {
            detail: { authenticated: false, reason: 'session_expired' }
        })
    );
};

export const getAuthenticatedUser = () => {
    const accessToken = getAccessToken();
    if (!accessToken) return null;
    const accessPayload = decodePayload(accessToken) || {};
    if (accessTokenExpired(accessToken)) return null;
    const identityPayload = decodePayload(getIdentityToken() || '') || {};
    const payload = { ...accessPayload, ...identityPayload };
    const uuidPattern = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
    const username = [
        payload.username,
        payload.preferred_username,
        payload.minecraft_username,
        payload.minecraftName,
        payload.gamertag,
        payload.name
    ].find((value) => typeof value === 'string' && value.trim() && !uuidPattern.test(value.trim()));
    const playerId = payload.uid || payload.uniqueId || payload.playerId || payload.sub;
    return getCachedProfile(playerId) || buildUser(username, playerId);
};

async function refreshAccessToken() {
    if (refreshRequest) return refreshRequest;
    const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;
    const currentAccessToken = getAccessToken();

    refreshRequest = (async () => {
        try {
            const response = await fetch(`${AUTH_URL}/oauth2/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    client_id: CLIENT_ID,
                    refresh_token: refreshToken
                })
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok || !payload.access_token) {
                if (TERMINAL_REFRESH_ERRORS.has(payload.error)) {
                    clearLocalSession();
                    notifyExpiredSession();
                    return null;
                }
                return accessTokenExpired(currentAccessToken) ? null : currentAccessToken;
            }
            storeTokens(payload);
            window.dispatchEvent(new CustomEvent('seriux-auth-changed', { detail: { authenticated: true } }));
            return payload.access_token;
        } catch {
            // Keep the rotating refresh token on transient network or server failures.
            // A later focus/online event can retry without forcing a new login.
            return accessTokenExpired(currentAccessToken) ? null : currentAccessToken;
        } finally {
            refreshRequest = null;
        }
    })();
    return refreshRequest;
}

export async function refreshAuthenticatedSession() {
    let accessToken = getAccessToken();
    if (
        sessionStorage.getItem(REFRESH_TOKEN_KEY) &&
        (!accessToken || accessTokenExpired(accessToken, ACCESS_TOKEN_REFRESH_SKEW_MS))
    ) {
        accessToken = await refreshAccessToken();
    }
    return accessToken && !accessTokenExpired(accessToken) ? getAuthenticatedUser() : null;
}

export async function fetchAuthenticatedUser() {
    await refreshAuthenticatedSession();
    let accessToken = getAccessToken();
    let tokenUser = getAuthenticatedUser();
    if (!tokenUser || !accessToken) return null;

    try {
        let response = await fetch(USER_PROFILE_URL, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (response.status === 401) {
            accessToken = await refreshAccessToken();
            if (!accessToken) return null;
            tokenUser = getAuthenticatedUser();
            response = await fetch(USER_PROFILE_URL, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
        }
        if (!response.ok) return tokenUser;

        const profile = await response.json();
        const username = profile.username || profile.minecraftUsername || profile.minecraftName || profile.name;
        const playerId = profile.playerId || profile.uniqueId || profile.uid || profile.id || tokenUser.playerId;
        const user = buildUser(username, playerId);
        try {
            const permissionResponse = await fetch(USER_PERMISSIONS_URL, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (permissionResponse.ok) {
                const permissionSnapshot = await permissionResponse.json();
                user.permissions = permissionSnapshot.effectivePermissions ?? [];
                user.groups = (permissionSnapshot.assignedGroups ?? [])
                    .filter((assignment) => assignment.active)
                    .map((assignment) => assignment.groupKey);
            }
        } catch {
            // The identity remains usable if the permission service is temporarily unavailable.
        }
        sessionStorage.setItem(PROFILE_KEY, JSON.stringify(user));
        return user;
    } catch {
        return tokenUser;
    }
}

export const isAuthenticated = () => Boolean(getAuthenticatedUser());
export const isForumAdministrator = (user = getAuthenticatedUser()) =>
    Boolean(user?.permissions?.includes('forum.admin'));

export const isStoreAdministrator = (user = getAuthenticatedUser()) =>
    Boolean(user?.permissions?.includes('store.admin'));

export const isUserAdministrator = (user = getAuthenticatedUser()) =>
    Boolean(
        user?.permissions?.some(
            (permission) =>
                permission.startsWith('users.') ||
                permission.startsWith('permissions.') ||
                permission.startsWith('moderation.') ||
                permission.startsWith('audits.')
        )
    );

export const isAdministrator = (user = getAuthenticatedUser()) =>
    isForumAdministrator(user) || isStoreAdministrator(user) || isUserAdministrator(user);

export async function authenticatedFetch(input, init = {}) {
    let accessToken = getAccessToken();
    if (
        sessionStorage.getItem(REFRESH_TOKEN_KEY) &&
        (!accessToken || accessTokenExpired(accessToken, ACCESS_TOKEN_REFRESH_SKEW_MS))
    ) {
        accessToken = await refreshAccessToken();
    }

    const request = (token) =>
        fetch(input, {
            ...init,
            headers: {
                ...(init.headers || {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
        });

    let response = await request(accessToken);
    if (response.status === 401 && sessionStorage.getItem(REFRESH_TOKEN_KEY)) {
        accessToken = await refreshAccessToken();
        if (accessToken) response = await request(accessToken);
    }
    return response;
}

export async function beginLogin(returnTo = window.location.pathname) {
    const verifier = base64Url(crypto.getRandomValues(new Uint8Array(48)));
    const challenge = base64Url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
    const state = crypto.randomUUID();
    sessionStorage.setItem('seriux_pkce_verifier', verifier);
    sessionStorage.setItem('seriux_oauth_state', state);
    sessionStorage.setItem('seriux_return_to', returnTo);
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        redirect_uri: `${window.location.origin}/auth/callback`,
        scope: 'openid profile website',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        state
    });
    window.location.assign(`${AUTH_URL}/oauth2/authorize?${params}`);
}

export async function completeLogin(code, state) {
    if (!code || state !== sessionStorage.getItem('seriux_oauth_state')) throw new Error('Ungültige Login-Antwort.');
    const response = await fetch(`${AUTH_URL}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: CLIENT_ID,
            redirect_uri: `${window.location.origin}/auth/callback`,
            code,
            code_verifier: sessionStorage.getItem('seriux_pkce_verifier') || ''
        })
    });
    const payload = await response.json();
    if (!response.ok || !payload.access_token)
        throw new Error(payload.error_description || 'Anmeldung fehlgeschlagen.');
    storeTokens(payload);
    sessionStorage.removeItem('seriux_pkce_verifier');
    sessionStorage.removeItem('seriux_oauth_state');
    window.dispatchEvent(new CustomEvent('seriux-auth-changed', { detail: { authenticated: true } }));
    return sessionStorage.getItem('seriux_return_to') || '/';
}

export async function logout() {
    const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
    clearLocalSession();

    if (refreshToken) {
        try {
            await fetch(`${AUTH_URL}/oauth2/revoke`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: CLIENT_ID,
                    token: refreshToken,
                    token_type_hint: 'refresh_token'
                })
            });
        } catch {
            // The browser session must still be terminated if token revocation is unavailable.
        }
    }

    let authServerSessionEnded = false;
    try {
        const csrfResponse = await fetch(`${AUTH_URL}/api/session/csrf`, {
            credentials: 'include',
            headers: { Accept: 'application/json' },
            cache: 'no-store'
        });
        if (!csrfResponse.ok) throw new Error('CSRF token unavailable');

        const csrf = await csrfResponse.json();
        const response = await fetch(`${AUTH_URL}/api/session/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({ [csrf.parameterName]: csrf.token })
        });
        authServerSessionEnded = response.status === 204;
    } catch {
        authServerSessionEnded = false;
    }

    window.dispatchEvent(
        new CustomEvent('seriux-auth-changed', {
            detail: { authenticated: false, authServerSessionEnded }
        })
    );
    return authServerSessionEnded;
}

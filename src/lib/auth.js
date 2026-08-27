const AUTH_URL = 'https://auth.seriuxmod.net';
const USER_PROFILE_URL = 'https://api.seriuxmod.net/api/v1/user/users/me';
const CLIENT_ID = 'seriuxmod-website';
const PROFILE_KEY = 'seriux_user_profile';

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

export const getAuthenticatedUser = () => {
    const accessToken = getAccessToken();
    if (!accessToken) return null;
    const accessPayload = decodePayload(accessToken) || {};
    const identityPayload = decodePayload(getIdentityToken() || '') || {};
    const payload = { ...accessPayload, ...identityPayload };
    if (!payload || (payload.exp && payload.exp * 1000 <= Date.now())) return null;
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

export async function fetchAuthenticatedUser() {
    const tokenUser = getAuthenticatedUser();
    const accessToken = getAccessToken();
    if (!tokenUser || !accessToken) return null;

    try {
        const response = await fetch(USER_PROFILE_URL, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!response.ok) return tokenUser;

        const profile = await response.json();
        const username = profile.username || profile.minecraftUsername || profile.minecraftName || profile.name;
        const playerId = profile.playerId || profile.uniqueId || profile.uid || profile.id || tokenUser.playerId;
        const user = buildUser(username, playerId);
        sessionStorage.setItem(PROFILE_KEY, JSON.stringify(user));
        return user;
    } catch {
        return tokenUser;
    }
}

export const isAuthenticated = () => Boolean(getAuthenticatedUser());

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
    sessionStorage.setItem('seriux_access_token', payload.access_token);
    if (payload.id_token) sessionStorage.setItem('seriux_identity_token', payload.id_token);
    sessionStorage.removeItem('seriux_pkce_verifier');
    sessionStorage.removeItem('seriux_oauth_state');
    return sessionStorage.getItem('seriux_return_to') || '/';
}

export function logout() {
    sessionStorage.removeItem('seriux_access_token');
    sessionStorage.removeItem('seriux_identity_token');
    sessionStorage.removeItem('seriux_return_to');
    sessionStorage.removeItem(PROFILE_KEY);
}

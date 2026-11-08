export const PERSONAL_PROFILE_PATH = '/me';
export const SECURITY_SETTINGS_PATH = '/me/settings/security';

export function publicProfilePath(user) {
    const username = typeof user === 'string' ? user : user?.username;
    return /^[A-Za-z0-9_]{3,16}$/.test(username || '') ? `/@${encodeURIComponent(username)}` : PERSONAL_PROFILE_PATH;
}

export function safeLoginReturnPath(value, user) {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')
        || /[\\\r\n]/.test(value) || /^\/auth\/callback(?:[/?#]|$)/.test(value)) {
        return publicProfilePath(user);
    }
    const target = new URL(value, 'https://seriuxmod.net');
    if (target.origin !== 'https://seriuxmod.net') return publicProfilePath(user);
    if (target.pathname === '/profile') return publicProfilePath(user);
    if (target.pathname === '/account/security') return SECURITY_SETTINGS_PATH;
    return `${target.pathname}${target.search}${target.hash}`;
}

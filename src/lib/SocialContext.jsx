import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getAuthenticatedUser, getAccessToken, refreshAuthenticatedSession } from './auth.js';
import { grpcSocial, watchSocial } from './grpc/socialClients.js';
import { userApi } from './userApi.js';
import { SocialSession, emptySocialState } from './socialSession.js';

const SocialContext = createContext(null);
function tokenClaims() {
    try { return JSON.parse(atob(getAccessToken().split('.')[1].replaceAll('-', '+').replaceAll('_', '/'))); }
    catch { return null; }
}
const tokenExpiresAt = () => tokenClaims()?.exp * 1000;

export function SocialProvider({ children }) {
    const [state, setState] = useState(emptySocialState);
    const session = useMemo(() => new SocialSession({ api: grpcSocial, users: userApi, watch: watchSocial,
        ensureSession: refreshAuthenticatedSession, tokenExpiresAt, onState: setState }), []);
    useEffect(() => {
        const changed = () => session.select(getAuthenticatedUser()?.playerId || null, tokenClaims()?.sid);
        changed(); window.addEventListener('seriux-auth-changed', changed);
        return () => { window.removeEventListener('seriux-auth-changed', changed); session.select(null); session.stop(); };
    }, [session]);
    return <SocialContext.Provider value={{ state, session }}>{children}</SocialContext.Provider>;
}
export function useSocial() { return useContext(SocialContext); }

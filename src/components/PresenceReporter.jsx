import { useEffect } from 'react';
import { getAuthenticatedUser } from '../lib/auth';
import { socialApi } from '../lib/socialApi';

export default function PresenceReporter() {
    useEffect(() => {
        const report = () => {
            if (document.visibilityState !== 'visible' || !getAuthenticatedUser()) return;
            socialApi.presence.heartbeat().catch(() => {
                // Presence is supplementary and must never interrupt navigation.
            });
        };

        report();
        const interval = window.setInterval(report, 60_000);
        document.addEventListener('visibilitychange', report);
        window.addEventListener('seriux-auth-changed', report);
        return () => {
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', report);
            window.removeEventListener('seriux-auth-changed', report);
        };
    }, []);

    return null;
}

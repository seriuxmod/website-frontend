import { Suspense, useEffect, useRef, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AdminDashboardSkeleton } from './AdminUi';
import {
    fetchAuthenticatedUser,
    hasStoredSession,
    isForumAdministrator,
    isStoreAdministrator,
    isUserAdministrator
} from '../../lib/auth';

export default function AdminLayout() {
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(() => hasStoredSession());
    const verificationId = useRef(0);

    useEffect(() => {
        const verifyAccess = async () => {
            const requestId = ++verificationId.current;
            setChecking(true);
            const profile = await fetchAuthenticatedUser();
            if (requestId !== verificationId.current) return;
            setUser(profile);
            setChecking(false);
        };

        const handleAuthChange = (event) => {
            if (event.detail?.authenticated === false) {
                verificationId.current += 1;
                setUser(null);
                setChecking(false);
                return;
            }
            verifyAccess();
        };

        if (hasStoredSession()) verifyAccess();
        else setChecking(false);

        window.addEventListener('seriux-auth-changed', handleAuthChange);
        return () => {
            verificationId.current += 1;
            window.removeEventListener('seriux-auth-changed', handleAuthChange);
        };
    }, []);

    const allowed = isUserAdministrator(user) || isForumAdministrator(user) || isStoreAdministrator(user);

    if (checking) return null;
    if (!allowed) return <Navigate to="/" replace />;

    return (
        <main className="min-h-screen bg-[#090a0d] px-4 pb-28 pt-28 text-white sm:px-6 sm:pt-32 lg:px-8 xl:px-10">
            <section className="mx-auto min-w-0 max-w-[1800px]">
                <Suspense fallback={<AdminDashboardSkeleton />}>
                    <Outlet />
                </Suspense>
            </section>
        </main>
    );
}

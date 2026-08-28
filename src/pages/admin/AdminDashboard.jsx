import { useEffect, useState } from 'react';
import { FaArrowRight, FaBagShopping, FaComments, FaGear, FaShieldHalved, FaUsers } from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import {
    fetchAuthenticatedUser,
    getAuthenticatedUser,
    isForumAdministrator,
    isStoreAdministrator
} from '../../lib/auth';
import { forumApi } from '../../lib/forumApi';
import { storeApi } from '../../lib/storeApi';
import { ForumLoading, ForumShell } from '../forum/ForumComponents';

export default function AdminDashboard() {
    const [user, setUser] = useState(() => getAuthenticatedUser());
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({ forumNodes: null, reports: null, products: null, orders: null });

    useEffect(() => {
        fetchAuthenticatedUser().then(async (profile) => {
            setUser(profile);
            if (!profile) return setLoading(false);
            const tasks = [];
            if (isForumAdministrator(profile)) {
                tasks.push(
                    Promise.all([forumApi.admin.nodes(), forumApi.admin.reports(0, 1, 'OPEN')]).then(
                        ([nodes, reports]) => ({
                            forumNodes: nodes?.length ?? 0,
                            reports: reports?.totalElements ?? reports?.content?.length ?? 0
                        })
                    )
                );
            }
            if (isStoreAdministrator(profile)) {
                tasks.push(
                    storeApi.admin
                        .overview()
                        .then((overview) => ({
                            products: overview.products ?? overview.productCount ?? 0,
                            orders: overview.orders ?? overview.orderCount ?? 0
                        }))
                );
            }
            const settled = await Promise.allSettled(tasks);
            setMetrics((current) =>
                settled.reduce(
                    (result, entry) => (entry.status === 'fulfilled' ? { ...result, ...entry.value } : result),
                    current
                )
            );
            setLoading(false);
        });
    }, []);

    const forumAdmin = isForumAdministrator(user);
    const storeAdmin = isStoreAdministrator(user);
    if (loading)
        return (
            <ForumShell title="Administration">
                <ForumLoading label="Team-Berechtigungen werden geprüft …" />
            </ForumShell>
        );
    if (!forumAdmin && !storeAdmin)
        return (
            <ForumShell
                title="Kein Zugriff"
                description="Dieser Bereich ist ausschließlich für das SeriuxMod-Team bestimmt."
            />
        );

    return (
        <ForumShell
            eyebrow="TEAM PORTAL"
            title="Administration"
            description="Die zentrale Arbeitsfläche für Inhalte, Community und Verkauf. Alle Änderungen greifen direkt auf die produktiven Backends zu."
            breadcrumbs={[{ label: 'Administration' }]}
        >
            <section className="forum-panel mb-6 grid gap-5 rounded-3xl p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:p-8">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-orange-500/10 text-xl text-orange-300">
                    <FaShieldHalved />
                </span>
                <div>
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-zinc-600">Angemeldet als</p>
                    <h2 className="mt-1 font-display text-xl font-bold text-white">{user.username}</h2>
                    <p className="mt-2 text-sm text-zinc-500">
                        Freigaben werden aus deinen aktuellen PermissionGroups geladen.
                    </p>
                </div>
            </section>
            <div className="grid gap-6 lg:grid-cols-2">
                {forumAdmin && (
                    <AdminModule
                        icon={FaComments}
                        eyebrow="COMMUNITY"
                        title="Forum verwalten"
                        description="Struktur, Sichtbarkeit, Gruppenrechte, Labels, Meldungen und globale Regeln."
                        href="/admin/forum"
                        stats={[
                            [metrics.forumNodes, 'Bereiche'],
                            [metrics.reports, 'offene Meldungen']
                        ]}
                    />
                )}
                {storeAdmin && (
                    <AdminModule
                        icon={FaBagShopping}
                        eyebrow="COMMERCE"
                        title="Shop verwalten"
                        description="Kategorien, Produkte, Felder, Coupons, Bestellungen, Kunden und Freischaltungen."
                        href="/admin/store"
                        stats={[
                            [metrics.products, 'Produkte'],
                            [metrics.orders, 'Bestellungen']
                        ]}
                    />
                )}
            </div>
            <section className="forum-panel mt-6 rounded-3xl p-6 sm:p-8">
                <div className="flex items-start gap-4">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[.04] text-zinc-500">
                        <FaUsers />
                    </span>
                    <div>
                        <h2 className="font-display text-xl font-bold">Team & Berechtigungen</h2>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
                            Der Zugriff auf dieses Portal kommt aus den PermissionGroups des User-Service. Dadurch
                            existiert keine zweite, widersprüchliche Rollenverwaltung in der Webseite.
                        </p>
                    </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                    {user.groups?.map((group) => (
                        <span
                            key={group}
                            className="rounded-full border border-orange-500/15 bg-orange-500/[.06] px-3 py-1.5 text-xs font-bold text-orange-300"
                        >
                            {group}
                        </span>
                    ))}
                </div>
            </section>
        </ForumShell>
    );
}

function AdminModule({ icon: Icon, eyebrow, title, description, href, stats }) {
    return (
        <article className="forum-panel group rounded-3xl p-6 transition hover:border-orange-500/20 sm:p-8">
            <div className="flex items-start justify-between gap-5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500/10 text-lg text-orange-300">
                    <Icon />
                </span>
                <FaGear className="text-zinc-800" />
            </div>
            <p className="eyebrow mt-7">{eyebrow}</p>
            <h2 className="mt-2 font-display text-3xl font-bold">{title}</h2>
            <p className="mt-3 min-h-12 text-sm leading-6 text-zinc-500">{description}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
                {stats.map(([value, label]) => (
                    <div key={label} className="rounded-2xl border border-white/[.055] bg-black/15 p-4">
                        <b className="block text-2xl text-white">{value ?? '–'}</b>
                        <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                            {label}
                        </span>
                    </div>
                ))}
            </div>
            <Link to={href} className="forum-button-primary mt-6 w-full">
                Modul öffnen <FaArrowRight />
            </Link>
        </article>
    );
}

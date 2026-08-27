import { useCallback, useEffect, useState } from 'react';
import { FaComments, FaHeart, FaMessage, FaPeopleGroup, FaThumbsUp } from 'react-icons/fa6';
import { Link, useParams } from 'react-router-dom';
import { forumApi, getPublicUser } from '../../lib/forumApi';
import { ForumError, ForumLoading, ForumShell, formatDate } from './ForumComponents';

export default function ForumUserProfile() {
    const { userId } = useParams();
    const [state, setState] = useState({ loading: true, user: null, profile: null, error: '' });
    const load = useCallback(async () => {
        setState((current) => ({ ...current, loading: true, error: '' }));
        try {
            const [user, profile] = await Promise.all([getPublicUser(userId), forumApi.userProfile(userId, 10)]);
            setState({ loading: false, user, profile, error: '' });
        } catch (error) {
            setState({ loading: false, user: null, profile: null, error: error.message });
        }
    }, [userId]);
    useEffect(() => {
        load();
    }, [load]);

    if (state.loading)
        return (
            <ForumShell title="Spielerprofil">
                <ForumLoading label="Spielerprofil wird geladen …" />
            </ForumShell>
        );
    if (state.error)
        return (
            <ForumShell title="Spielerprofil">
                <ForumError message={state.error} retry={load} />
            </ForumShell>
        );

    const { user, profile } = state;
    const stats = [
        [FaComments, 'Themen', profile.topicsCreated],
        [FaMessage, 'Beiträge', profile.postsCreated],
        [FaHeart, 'Reaktionen erhalten', profile.reactionsReceived],
        [FaPeopleGroup, 'Spieler reagierten', profile.uniqueUsersReacted],
        [FaThumbsUp, 'Reaktionen vergeben', profile.reactionsGiven]
    ];

    return (
        <ForumShell
            eyebrow="COMMUNITY-PROFIL"
            title={user.username}
            description="Öffentliche Aktivität dieses Minecraft-Spielers im SeriuxMod Forum."
            breadcrumbs={[{ label: user.username }]}
            actions={
                <img
                    className="h-24 w-24 rounded-2xl border border-orange-500/20 bg-black/30 [image-rendering:pixelated]"
                    src={user.avatarUrl}
                    alt={`Minecraft-Kopf von ${user.username}`}
                />
            }
        >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {stats.map(([Icon, label, value]) => (
                    <div className="forum-panel rounded-2xl p-5" key={label}>
                        <Icon className="text-orange-400" />
                        <b className="mt-4 block font-display text-3xl">{value}</b>
                        <span className="mt-1 block text-xs text-zinc-600">{label}</span>
                    </div>
                ))}
            </div>
            <section className="forum-panel mt-7 overflow-hidden rounded-3xl">
                <header className="border-b border-white/[.06] p-6">
                    <h2 className="font-display text-xl font-bold">Letzte Beiträge</h2>
                </header>
                {(profile.recentPosts ?? []).length === 0 ? (
                    <p className="p-8 text-sm text-zinc-500">Noch keine sichtbaren Beiträge.</p>
                ) : (
                    profile.recentPosts.map((post) => (
                        <Link
                            className="block border-b border-white/[.055] p-6 transition last:border-0 hover:bg-white/[.025]"
                            to={`/forum/topic/${post.topicId}#post-${post.postId}`}
                            key={post.postId}
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <b className="font-display text-lg transition hover:text-orange-300">
                                    {post.topicTitle}
                                </b>
                                <span className="text-[11px] text-zinc-600">{formatDate(post.createdAt)}</span>
                            </div>
                            <p className="mt-3 line-clamp-2 text-sm leading-7 text-zinc-500">{post.contentPreview}</p>
                            <span className="mt-3 block text-[11px] text-zinc-700">
                                Beitrag #{post.postNumber} · {post.reactions} Reaktionen
                            </span>
                        </Link>
                    ))
                )}
            </section>
        </ForumShell>
    );
}

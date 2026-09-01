import { useCallback, useEffect, useRef, useState } from 'react';
import { FaBell, FaCheck, FaReply, FaThumbsUp } from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import { forumApi } from '../lib/forumApi';

const notificationTarget = (notification) =>
    `/forum/topic/${notification.topicId}${notification.postId ? `#post-${notification.postId}` : ''}`;

const notificationText = (notification) =>
    notification.type === 'POST_REACTION' ? 'reagierte auf deinen Beitrag' : 'antwortete in einem beobachteten Thema';

function NotificationIcon({ type }) {
    return type === 'POST_REACTION' ? <FaThumbsUp /> : <FaReply />;
}

export default function NavbarNotifications({ user, onUnreadChange }) {
    const [open, setOpen] = useState(false);
    const [state, setState] = useState({ loading: false, items: [], error: '' });
    const [unread, setUnread] = useState(0);
    const rootRef = useRef(null);

    const updateUnread = useCallback(
        (value) => {
            const normalized = Math.max(0, Number(value) || 0);
            setUnread(normalized);
            onUnreadChange?.(normalized);
        },
        [onUnreadChange]
    );

    const refreshCount = useCallback(async () => {
        if (!user) return;
        const result = await forumApi.unreadCount();
        updateUnread(result.unread);
    }, [updateUnread, user]);

    const loadNotifications = useCallback(async () => {
        if (!user) return;
        setState((current) => ({ ...current, loading: true, error: '' }));
        try {
            const data = await forumApi.notifications(0, 6, false);
            setState({ loading: false, items: data.items ?? [], error: '' });
            updateUnread(data.unread);
        } catch (error) {
            setState({ loading: false, items: [], error: error.message });
        }
    }, [updateUnread, user]);

    useEffect(() => {
        if (!user) {
            setOpen(false);
            setState({ loading: false, items: [], error: '' });
            updateUnread(0);
            return undefined;
        }
        refreshCount().catch(() => updateUnread(0));
        const timer = window.setInterval(() => refreshCount().catch(() => {}), 60_000);
        return () => window.clearInterval(timer);
    }, [refreshCount, updateUnread, user]);

    useEffect(() => {
        const close = (event) => {
            if (!rootRef.current?.contains(event.target)) setOpen(false);
        };
        const closeWithKeyboard = (event) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('pointerdown', close);
        document.addEventListener('keydown', closeWithKeyboard);
        return () => {
            document.removeEventListener('pointerdown', close);
            document.removeEventListener('keydown', closeWithKeyboard);
        };
    }, []);

    const toggle = () => {
        const next = !open;
        setOpen(next);
        if (next) loadNotifications();
    };

    const markRead = (notification) => {
        if (notification.read) return;
        setState((current) => ({
            ...current,
            items: current.items.map((item) => (item.id === notification.id ? { ...item, read: true } : item))
        }));
        updateUnread(unread - 1);
        forumApi.markNotificationRead(notification.id).catch(() => {
            loadNotifications();
        });
    };

    const markAllRead = async () => {
        await forumApi.markAllNotificationsRead();
        setState((current) => ({ ...current, items: current.items.map((item) => ({ ...item, read: true })) }));
        updateUnread(0);
    };

    if (!user) return null;

    return (
        <div ref={rootRef} className="relative ml-1 hidden sm:block">
            <button
                type="button"
                className={`notification-trigger relative grid h-12 w-12 place-items-center rounded-2xl ${open ? 'notification-trigger-active' : ''}`}
                onClick={toggle}
                aria-label={unread > 0 ? `${unread} ungelesene Benachrichtigungen` : 'Benachrichtigungen'}
                aria-expanded={open}
                aria-haspopup="dialog"
            >
                <FaBell className="text-base" />
                {unread > 0 && (
                    <span className="absolute right-2 top-2 grid min-h-4 min-w-4 place-items-center rounded-full border-2 border-[#111218] bg-orange-500 px-1 text-[8px] font-black leading-none text-white">
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <section
                    className="liquid-menu absolute right-0 top-full mt-3 w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-2xl"
                    role="dialog"
                    aria-label="Benachrichtigungen"
                >
                    <header className="flex items-center justify-between gap-4 border-b border-white/[.07] px-5 py-4">
                        <div>
                            <b className="block text-sm text-white">Benachrichtigungen</b>
                            <span className="mt-0.5 block text-[10px] text-zinc-600">{unread} ungelesen</span>
                        </div>
                        {unread > 0 && (
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-bold text-zinc-500 transition hover:bg-white/[.05] hover:text-white"
                                onClick={() => markAllRead().catch(() => loadNotifications())}
                            >
                                <FaCheck /> Alle gelesen
                            </button>
                        )}
                    </header>

                    <div className="max-h-[420px] overflow-y-auto">
                        {state.loading ? (
                            <p className="px-5 py-8 text-center text-xs text-zinc-600">
                                Benachrichtigungen werden geladen …
                            </p>
                        ) : state.error ? (
                            <div className="px-5 py-7 text-center">
                                <p className="text-xs text-red-300">Benachrichtigungen konnten nicht geladen werden.</p>
                                <button
                                    className="mt-3 text-[10px] font-bold text-orange-400"
                                    onClick={loadNotifications}
                                >
                                    Erneut versuchen
                                </button>
                            </div>
                        ) : state.items.length === 0 ? (
                            <div className="px-5 py-9 text-center">
                                <FaBell className="mx-auto text-xl text-zinc-700" />
                                <p className="mt-3 text-xs text-zinc-600">Du hast noch keine Benachrichtigungen.</p>
                            </div>
                        ) : (
                            state.items.map((notification) => (
                                <Link
                                    key={notification.id}
                                    to={notificationTarget(notification)}
                                    className={`flex gap-3 border-b border-white/[.055] px-5 py-4 transition last:border-0 hover:bg-white/[.035] ${notification.read ? '' : 'bg-orange-500/[.045]'}`}
                                    onClick={() => {
                                        markRead(notification);
                                        setOpen(false);
                                    }}
                                >
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orange-500/10 text-xs text-orange-300">
                                        <NotificationIcon type={notification.type} />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-xs text-zinc-400">
                                            {notificationText(notification)}
                                        </span>
                                        <b className="mt-1 block truncate text-sm text-white">
                                            {notification.topicTitle}
                                        </b>
                                    </span>
                                    {!notification.read && (
                                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                                    )}
                                </Link>
                            ))
                        )}
                    </div>

                    <Link
                        to="/forum/account?tab=notifications"
                        className="block border-t border-white/[.07] px-5 py-4 text-center text-xs font-bold text-zinc-400 transition hover:bg-white/[.035] hover:text-orange-300"
                        onClick={() => setOpen(false)}
                    >
                        Alle Benachrichtigungen ansehen
                    </Link>
                </section>
            )}
        </div>
    );
}

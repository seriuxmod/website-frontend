import AdminSystemStatusView from '../../components/admin/AdminSystemStatusView';
import AdminForumView from '../../components/admin/forum/AdminForumView';

/**
 * Compatibility dispatcher for the two administration domains that still share
 * this lazy route chunk. Every rendered view is backed by its production API.
 */
export default function AdminModulePreview({ module }) {
    if (module.startsWith('forum-')) return <AdminForumView module={module} />;
    if (module === 'system-status') return <AdminSystemStatusView />;
    return null;
}

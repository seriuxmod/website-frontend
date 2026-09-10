import { Navigate } from 'react-router-dom';
import { getAuthenticatedUser, isForumAdministrator } from '../../../lib/auth';
import ForumAnalyticsView from './ForumAnalyticsView';
import { ForumBlogView, ForumSettingsView } from './ForumContentViews';
import ForumLabelsView from './ForumLabelsView';
import { ForumReportsView, ForumSuggestionsView } from './ForumModerationViews';
import ForumPermissionsView from './ForumPermissionsView';
import ForumStructureView from './ForumStructureView';

const VIEWS = {
    'forum-analytics': ForumAnalyticsView,
    'forum-structure': ForumStructureView,
    'forum-permissions': ForumPermissionsView,
    'forum-labels': ForumLabelsView,
    'forum-reports': ForumReportsView,
    'forum-suggestions': ForumSuggestionsView,
    'forum-blog': ForumBlogView,
    'forum-settings': ForumSettingsView
};

export default function AdminForumView({ module }) {
    if (!isForumAdministrator(getAuthenticatedUser())) return <Navigate replace to="/" />;
    const View = VIEWS[module];
    return View ? <View /> : <Navigate replace to="/admin/forum/analytics" />;
}

import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTopButton from './components/ScrollToTopButton';
import useScrollToTop from './hooks/useScrollToTop';

import Home from './pages/home/Home';

import Disclosure from './pages/legal/Disclosure';
import Privacy from './pages/legal/Privacy';
import Terms from './pages/legal/Terms';
import AuthCallback from './pages/platform/AuthCallback';
import Profile from './pages/platform/Profile';
import PublicPlayerProfile from './pages/platform/PublicPlayerProfile';
import ForumIndex from './pages/forum/ForumIndex';
import ForumBoard from './pages/forum/ForumBoard';
import ForumTopic from './pages/forum/ForumTopic';
import ForumAccount from './pages/forum/ForumAccount';
import LegacyForumProfileRedirect from './pages/forum/LegacyForumProfileRedirect';
import CommunityPage from './pages/community/CommunityPage';
import CommunityBlog from './pages/community/CommunityBlog';
import CommunityFeedback from './pages/community/CommunityFeedback';
import StoreIndex from './pages/store/StoreIndex';
import StoreCheckout from './pages/store/StoreCheckout';
import StoreAccount from './pages/store/StoreAccount';
import Security from './pages/platform/Security';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLayout from './components/admin/AdminLayout';
import VerifyEmail from './pages/platform/VerifyEmail';
import ResetPassword from './pages/platform/ResetPassword';
import ForgotPassword from './pages/platform/ForgotPassword';
import SystemStatus from './pages/status/SystemStatus';
import SocialHub from './pages/social/SocialHub';
import PresenceReporter from './components/PresenceReporter';

const AdminModulePreview = lazy(() => import('./pages/admin/AdminModulePreview'));
const AdminCommerceView = lazy(() => import('./components/admin/commerce/AdminCommerceView'));
const AdminForumView = lazy(() => import('./components/admin/forum/AdminForumView'));
const AdminSystemStatusView = lazy(() => import('./components/admin/AdminSystemStatusView'));
const AdminTeamView = lazy(() => import('./components/admin/team/AdminTeamView'));
const AdminManagementView = lazy(() => import('./components/admin/management/AdminManagementView'));
const AdminSocialView = lazy(() => import('./components/admin/management/AdminSocialView'));
const UserAdministrationView = lazy(() => import('./components/admin/management/UserAdministrationView'));

export default function App() {
    useScrollToTop();
    return (
        <div className="app-shell min-h-screen">
            <PresenceReporter />
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} exact />
                <Route path="/disclosure" element={<Disclosure />} exact />
                <Route path="/privacy" element={<Privacy />} exact />
                <Route path="/terms" element={<Terms />} exact />
                <Route path="/social" element={<Navigate to="/clans" replace />} />
                <Route path="/clans" element={<SocialHub initialTab="clans" />} />
                <Route path="/friends" element={<SocialHub initialTab="friends" />} />
                <Route path="/party" element={<SocialHub initialTab="party" />} />
                <Route path="/forum" element={<ForumIndex />} />
                <Route path="/forum/:forumId" element={<ForumBoard />} />
                <Route path="/forum/topic/:topicId" element={<ForumTopic />} />
                <Route path="/forum/account" element={<ForumAccount />} />
                <Route path="/forum/user/:userId" element={<LegacyForumProfileRedirect />} />
                <Route path="/store" element={<StoreIndex />} />
                <Route path="/store/checkout" element={<StoreCheckout />} />
                <Route path="/store/account" element={<StoreAccount />} />
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="system-status" element={<AdminSystemStatusView />} />
                    <Route path="team" element={<AdminTeamView module="team" />} />
                    <Route path="team/calendar" element={<AdminTeamView module="team-calendar" />} />
                    <Route path="team/activity" element={<AdminTeamView module="team-activity" />} />
                    <Route path="team/todos" element={<AdminTeamView module="team-todos" />} />
                    <Route path="team/notes" element={<AdminTeamView module="team-notes" />} />
                    <Route path="players" element={<UserAdministrationView module="players" />} />
                    <Route path="permissions" element={<UserAdministrationView module="permissions" />} />
                    <Route path="cosmetics" element={<AdminManagementView module="cosmetics" />} />
                    <Route path="friends" element={<AdminSocialView module="friends" />} />
                    <Route path="clans" element={<AdminSocialView module="clans" />} />
                    <Route path="parties" element={<AdminSocialView module="parties" />} />
                    <Route path="public-servers" element={<AdminSocialView module="public-servers" />} />
                    <Route path="translations" element={<AdminManagementView module="translations" />} />
                    <Route path="moderation" element={<UserAdministrationView module="moderation" />} />
                    <Route path="moderation/bans" element={<UserAdministrationView module="bans" />} />
                    <Route path="moderation/mutes" element={<UserAdministrationView module="mutes" />} />
                    <Route
                        path="moderation/settings"
                        element={<UserAdministrationView module="moderation-settings" />}
                    />
                    <Route path="forum/analytics" element={<AdminForumView module="forum-analytics" />} />
                    <Route path="forum/structure" element={<AdminModulePreview module="forum-structure" />} />
                    <Route path="forum/permissions" element={<AdminModulePreview module="forum-permissions" />} />
                    <Route path="forum/labels" element={<AdminModulePreview module="forum-labels" />} />
                    <Route path="forum/reports" element={<AdminModulePreview module="forum-reports" />} />
                    <Route path="forum/suggestions" element={<AdminModulePreview module="forum-suggestions" />} />
                    <Route path="forum/blog" element={<AdminModulePreview module="forum-blog" />} />
                    <Route path="forum/settings" element={<AdminModulePreview module="forum-settings" />} />
                    <Route path="commerce" element={<AdminCommerceView module="commerce" />} />
                    <Route path="commerce/customers" element={<AdminCommerceView module="customers" />} />
                    <Route path="commerce/catalog" element={<AdminCommerceView module="catalog" />} />
                    <Route path="commerce/fields" element={<AdminCommerceView module="fields" />} />
                    <Route path="commerce/coupons" element={<AdminCommerceView module="coupons" />} />
                    <Route path="commerce/orders" element={<AdminCommerceView module="orders" />} />
                    <Route path="commerce/payment-methods" element={<AdminCommerceView module="payment-methods" />} />
                    <Route path="commerce/settings" element={<AdminCommerceView module="commerce-settings" />} />
                    <Route path="users" element={<Navigate to="/admin/players" replace />} />
                    <Route path="forum" element={<Navigate to="/admin/forum/analytics" replace />} />
                    <Route path="store" element={<Navigate to="/admin/commerce" replace />} />
                </Route>
                <Route path="/account/security" element={<Security />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/status" element={<SystemStatus />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/players/:profileSlug" element={<PublicPlayerProfile />} />
                <Route path="/:profileSlug" element={<PublicPlayerProfile />} />
                <Route path="/community/blog" element={<CommunityBlog />} />
                <Route path="/community/blog/:slug" element={<CommunityBlog />} />
                <Route path="/community/feedback" element={<CommunityFeedback />} />
                <Route path="/community/feedback/:suggestionId" element={<CommunityFeedback />} />
                <Route path="/community/:page" element={<CommunityPage />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <Footer />
            <ScrollToTopButton />
        </div>
    );
}

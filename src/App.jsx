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
                    <Route path="system-status" element={<AdminModulePreview module="system-status" />} />
                    <Route path="team" element={<AdminModulePreview module="team" />} />
                    <Route path="team/calendar" element={<AdminModulePreview module="team-calendar" />} />
                    <Route path="team/activity" element={<AdminModulePreview module="team-activity" />} />
                    <Route path="team/todos" element={<AdminModulePreview module="team-todos" />} />
                    <Route path="team/notes" element={<AdminModulePreview module="team-notes" />} />
                    <Route path="players" element={<AdminModulePreview module="players" />} />
                    <Route path="permissions" element={<AdminModulePreview module="permissions" />} />
                    <Route path="cosmetics" element={<AdminModulePreview module="cosmetics" />} />
                    <Route path="friends" element={<AdminModulePreview module="friends" />} />
                    <Route path="clans" element={<AdminModulePreview module="clans" />} />
                    <Route path="parties" element={<AdminModulePreview module="parties" />} />
                    <Route path="public-servers" element={<AdminModulePreview module="public-servers" />} />
                    <Route path="translations" element={<AdminModulePreview module="translations" />} />
                    <Route path="moderation" element={<AdminModulePreview module="moderation" />} />
                    <Route path="moderation/bans" element={<AdminModulePreview module="bans" />} />
                    <Route path="moderation/mutes" element={<AdminModulePreview module="mutes" />} />
                    <Route path="moderation/settings" element={<AdminModulePreview module="moderation-settings" />} />
                    <Route path="forum/analytics" element={<AdminModulePreview module="forum-analytics" />} />
                    <Route path="forum/structure" element={<AdminModulePreview module="forum-structure" />} />
                    <Route path="forum/permissions" element={<AdminModulePreview module="forum-permissions" />} />
                    <Route path="forum/labels" element={<AdminModulePreview module="forum-labels" />} />
                    <Route path="forum/reports" element={<AdminModulePreview module="forum-reports" />} />
                    <Route path="forum/suggestions" element={<AdminModulePreview module="forum-suggestions" />} />
                    <Route path="forum/blog" element={<AdminModulePreview module="forum-blog" />} />
                    <Route path="forum/settings" element={<AdminModulePreview module="forum-settings" />} />
                    <Route path="commerce" element={<AdminModulePreview module="commerce" />} />
                    <Route path="commerce/customers" element={<AdminModulePreview module="customers" />} />
                    <Route path="commerce/catalog" element={<AdminModulePreview module="catalog" />} />
                    <Route path="commerce/fields" element={<AdminModulePreview module="fields" />} />
                    <Route path="commerce/coupons" element={<AdminModulePreview module="coupons" />} />
                    <Route path="commerce/orders" element={<AdminModulePreview module="orders" />} />
                    <Route path="commerce/payment-methods" element={<AdminModulePreview module="payment-methods" />} />
                    <Route path="commerce/settings" element={<AdminModulePreview module="commerce-settings" />} />
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

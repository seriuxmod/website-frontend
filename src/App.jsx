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
import ForumAdmin from './pages/forum/ForumAdmin';
import ForumAccount from './pages/forum/ForumAccount';
import LegacyForumProfileRedirect from './pages/forum/LegacyForumProfileRedirect';
import CommunityPage from './pages/community/CommunityPage';
import CommunityBlog from './pages/community/CommunityBlog';
import CommunityFeedback from './pages/community/CommunityFeedback';
import StoreIndex from './pages/store/StoreIndex';
import StoreCheckout from './pages/store/StoreCheckout';
import StoreAccount from './pages/store/StoreAccount';
import StoreAdmin from './pages/store/StoreAdmin';
import Security from './pages/platform/Security';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserAdmin from './pages/admin/UserAdmin';
import AdminLayout from './components/admin/AdminLayout';
import VerifyEmail from './pages/platform/VerifyEmail';
import ResetPassword from './pages/platform/ResetPassword';
import ForgotPassword from './pages/platform/ForgotPassword';
import SystemStatus from './pages/status/SystemStatus';
import SocialHub from './pages/social/SocialHub';
import PresenceReporter from './components/PresenceReporter';

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
                    <Route path="users" element={<UserAdmin />} />
                    <Route path="forum" element={<ForumAdmin />} />
                    <Route path="store" element={<StoreAdmin />} />
                </Route>
                <Route path="/account/security" element={<Security />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/status" element={<SystemStatus />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/profile" element={<Profile />} />
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

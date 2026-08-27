import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTopButton from './components/ScrollToTopButton';
import useScrollToTop from './hooks/useScrollToTop';

import Home from './pages/home/Home';

import Disclosure from './pages/legal/Disclosure';
import Privacy from './pages/legal/Privacy';
import Terms from './pages/legal/Terms';
import PlatformHub from './pages/platform/PlatformHub';
import AuthCallback from './pages/platform/AuthCallback';
import Profile from './pages/platform/Profile';
import ForumIndex from './pages/forum/ForumIndex';
import ForumBoard from './pages/forum/ForumBoard';
import ForumTopic from './pages/forum/ForumTopic';
import ForumAdmin from './pages/forum/ForumAdmin';
import ForumAccount from './pages/forum/ForumAccount';
import ForumUserProfile from './pages/forum/ForumUserProfile';
import CommunityPage from './pages/community/CommunityPage';
import StoreIndex from './pages/store/StoreIndex';
import StoreCheckout from './pages/store/StoreCheckout';
import StoreAccount from './pages/store/StoreAccount';
import StoreAdmin from './pages/store/StoreAdmin';

export default function App() {
    useScrollToTop();
    return (
        <div className="min-h-screen bg-[#090a0d]">
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} exact />
                <Route path="/disclosure" element={<Disclosure />} exact />
                <Route path="/privacy" element={<Privacy />} exact />
                <Route path="/terms" element={<Terms />} exact />
                <Route path="/clans" element={<PlatformHub type="clans" />} />
                <Route path="/forum" element={<ForumIndex />} />
                <Route path="/forum/:forumId" element={<ForumBoard />} />
                <Route path="/forum/topic/:topicId" element={<ForumTopic />} />
                <Route path="/forum/account" element={<ForumAccount />} />
                <Route path="/forum/user/:userId" element={<ForumUserProfile />} />
                <Route path="/admin/forum" element={<ForumAdmin />} />
                <Route path="/store" element={<StoreIndex />} />
                <Route path="/store/checkout" element={<StoreCheckout />} />
                <Route path="/store/account" element={<StoreAccount />} />
                <Route path="/admin/store" element={<StoreAdmin />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/community/:page" element={<CommunityPage />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <Footer />
            <ScrollToTopButton />
        </div>
    );
}

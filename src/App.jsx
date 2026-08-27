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
                <Route path="/forum" element={<PlatformHub type="forum" />} />
                <Route path="/store" element={<PlatformHub type="store" />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <Footer />
            <ScrollToTopButton />
        </div>
    );
}

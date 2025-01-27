import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTopButton from './components/ScrollToTopButton';
import useScrollToTop from './hooks/useScrollToTop';

import Home from './pages/home/Home';

import Disclosure from './pages/legal/Disclosure';
import Privacy from './pages/legal/Privacy';
import Terms from './pages/legal/Terms';

export default function App() {
    useScrollToTop();
    return (
        <div className="min-h-screen w-screen pt-[var(--navbar-height)]">
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} exact />
                <Route path="/disclosure" element={<Disclosure />} exact />
                <Route path="/privacy" element={<Privacy />} exact />
                <Route path="/terms" element={<Terms />} exact />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <Footer />
            <ScrollToTopButton />
        </div>
    );
}

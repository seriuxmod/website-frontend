import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

import Home from './pages/home/Home';

import Disclosure from './pages/legal/Disclosure';
import Privacy from './pages/legal/Privacy';
import Terms from './pages/legal/Terms';

export default function App() {
    return (
        <div className="min-h-screen w-screen pt-[var(--navbar-height)]">
            <ScrollToTop />
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} exact />
                <Route path="/disclosure" element={<Disclosure />} exact />
                <Route path="/privacy" element={<Privacy />} exact />
                <Route path="/terms" element={<Terms />} exact />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <Footer />
        </div>
    );
}

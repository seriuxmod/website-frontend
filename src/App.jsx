import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/home/Home';

export default function App() {
    return (
        <div className="min-h-screen w-screen">
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <Footer />
        </div>
    );
}

import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiMenu, HiX } from 'react-icons/hi';
import Logo from '../assets/icon_transparent.png';

const activeStyle =
    'after:absolute after:bottom-0 after:left-0 after:w-[30px] after:h-1 after:bg-[var(--accent-color)]';

const inactiveStyle = 'relative p-1 mr-2 rounded-sm border border-transparent hover:border hover:border-[#666666]';

const disabledStyle = 'pointer-events-none cursor-not-allowed text-[#666666]';

export default function Navbar() {
    const loc = useLocation();
    const currentPath = loc.pathname;

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
        touchEndX.current = e.changedTouches[0].clientX;
        const diff = touchStartX.current - touchEndX.current;

        // Swipe left to open menu, swipe right to close menu
        if (Math.abs(diff) > 50) {
            if (diff > 0 && !isMenuOpen) {
                setIsMenuOpen(true);
            } else if (diff < 0 && isMenuOpen) {
                setIsMenuOpen(false);
            }
        }
    };

    return (
        <div className="fixed left-0 top-0 z-[100] flex h-[var(--navbar-height)] w-screen items-center justify-between bg-[var(--background-color-secondary)] px-4 md:justify-start md:px-6">
            <div className="flex items-center">
                <Link to="/" className="flex items-center">
                    <img className="w-[50px] rounded-full" src={Logo} alt="Logo" />
                    <span className="inter-bold ml-2">SeriuxMod</span>
                </Link>
            </div>

            <nav className="hidden flex-grow items-center justify-between md:flex">
                <ul className="flex flex-row items-center justify-around space-x-4 lg:space-x-6">
                    <li className={inactiveStyle + (currentPath === '/' ? ' ' + activeStyle : '')}>
                        <Link to={currentPath === '/' ? '#' : '/'}>Home</Link>
                    </li>

                    <li className={inactiveStyle + disabledStyle + (currentPath === '/team' ? ' ' + activeStyle : '')}>
                        <Link className={disabledStyle} to={currentPath === '/team' ? '#' : '/team'}>
                            Team
                        </Link>
                    </li>

                    <li
                        className={
                            inactiveStyle + disabledStyle + (currentPath === '/players' ? ' ' + activeStyle : '')
                        }
                    >
                        <Link className={disabledStyle} to={currentPath === '/players' ? '#' : '/players'}>
                            Player Search
                        </Link>
                    </li>

                    <li className={inactiveStyle}>
                        <Link target="_blank" to="https://status.seriuxmod.net/">
                            Status
                        </Link>
                    </li>

                    <li className={inactiveStyle}>
                        <Link target="_blank" to="https://docs.seriuxmod.net/">
                            Docs
                        </Link>
                    </li>
                </ul>
            </nav>

            <button
                className="mx-5 text-white md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle navigation menu"
            >
                {isMenuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
            </button>

            <div
                className={`fixed inset-0 transform bg-[var(--background-color-secondary)] transition-transform ${
                    isMenuOpen ? 'translate-x-0' : 'translate-x-full'
                } flex flex-col items-center justify-center p-4 md:hidden`}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <button className="absolute right-4 top-4 text-white" onClick={() => setIsMenuOpen(false)}>
                    <HiX size={24} />
                </button>
                <nav className="mt-16 flex flex-col items-center justify-around space-y-4">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center">
                            <img className="w-[50px] rounded-full" src={Logo} alt="Logo" />
                            <span className="inter-bold ml-2">SeriuxMod</span>
                        </Link>
                    </div>

                    <ul className="flex flex-col items-center space-y-4">
                        <li className={inactiveStyle + (currentPath === '/' ? ' ' + activeStyle : '')}>
                            <Link onClick={() => setIsMenuOpen(false)} to="/">
                                Home
                            </Link>
                        </li>

                        <li
                            className={
                                inactiveStyle + disabledStyle + (currentPath === '/team' ? ' ' + activeStyle : '')
                            }
                        >
                            <Link className={disabledStyle} onClick={() => setIsMenuOpen(false)} to="/team">
                                Team
                            </Link>
                        </li>

                        <li
                            className={
                                inactiveStyle + disabledStyle + (currentPath === '/players' ? ' ' + activeStyle : '')
                            }
                        >
                            <Link className={disabledStyle} onClick={() => setIsMenuOpen(false)} to="/players">
                                Player Search
                            </Link>
                        </li>

                        <li className={inactiveStyle}>
                            <Link
                                target="_blank"
                                onClick={() => setIsMenuOpen(false)}
                                to="https://status.seriuxmod.net/"
                            >
                                Status
                            </Link>
                        </li>

                        <li className={inactiveStyle}>
                            <Link target="_blank" onClick={() => setIsMenuOpen(false)} to="https://docs.seriuxmod.net/">
                                Docs
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    );
}

import { Link } from 'react-router-dom';
import { FaGithub, FaTwitter, FaInstagram, FaYoutube, FaTwitch, FaLinkedin } from 'react-icons/fa';
import { TfiEmail } from 'react-icons/tfi';

export default function Footer() {
    return (
        <footer className="w-full bg-[var(--background-color-secondary)] py-5">
            <div className="flex w-full flex-col items-center justify-start px-3">
                <ul className="mx-auto grid grid-cols-3 items-center justify-center gap-2 text-center sm:grid-cols-6">
                    <li className="m-2">
                        <Link target="_blank" to="https://github.com/Seriuxmod" aria-label="Github">
                            <FaGithub
                                size={35}
                                className="fa-2x md:fa-4x text-[var(--accent-color)] transition-colors duration-300 hover:text-white"
                            />
                        </Link>
                    </li>
                    <li className="m-2">
                        <Link target="_blank" to="https://twitter.com/Seriuxmod" aria-label="Twitter">
                            <FaTwitter
                                size={35}
                                className="fa-2x md:fa-4x text-[var(--accent-color)] transition-colors duration-300 hover:text-white"
                            />
                        </Link>
                    </li>
                    <li className="m-2">
                        <Link target="_blank" to="https://instagram.com/Seriuxmod" aria-label="Instagram">
                            <FaInstagram
                                size={35}
                                className="fa-2x md:fa-4x text-[var(--accent-color)] transition-colors duration-300 hover:text-white"
                            />
                        </Link>
                    </li>
                    <li className="m-2">
                        <Link target="_blank" to="#" aria-label="LinkedIn">
                            <FaLinkedin
                                size={35}
                                className="fa-2x md:fa-4x text-[var(--accent-color)] transition-colors duration-300 hover:text-white"
                            />
                        </Link>
                    </li>
                    <li className="m-2">
                        <Link target="_blank" to="#" aria-label="YouTube">
                            <FaYoutube
                                size={35}
                                className="fa-2x md:fa-4x text-[var(--accent-color)] transition-colors duration-300 hover:text-white"
                            />
                        </Link>
                    </li>
                    <li className="m-2">
                        <Link target="_blank" to="https://twitch.tv/Seriuxmod" aria-label="Twitch">
                            <FaTwitch
                                size={35}
                                className="fa-2x md:fa-4x text-[var(--accent-color)] transition-colors duration-300 hover:text-white"
                            />
                        </Link>
                    </li>
                </ul>

                <div className="mt-5 flex max-w-screen-md flex-col items-center justify-around space-y-4 px-2 text-center">
                    <p className="text-[var(--text-color-secondary)]">
                        Copyright © 2024 | Seriuxmod.net | All rights reserved.
                    </p>
                    <p className="mt-3 px-4 text-[var(--text-color-secondary)]">
                        We have been working on this project for a long time due to its scope. If you would like to
                        support us on our way, then take a look at our social media links or apply at{' '}
                        <Link
                            className="inter-bold text-[var(--accent-color)] transition-colors duration-300 hover:text-white"
                            target="_blank"
                            to="mailto:partners@seriuxmod.net"
                        >
                            partners@seriuxmod.net
                        </Link>{' '}
                        as a server network partnership, community partnership, or promoter partnership.
                    </p>
                </div>

                <ul className="mx-auto mt-5 grid w-full max-w-[350px] grid-cols-1 items-center justify-center gap-2 text-center text-lg uppercase sm:max-w-[500px] md:max-w-[90vw] md:grid-cols-2 lg:grid-cols-4">
                    <li className="flex w-full items-center justify-center transition-colors duration-300 hover:text-[var(--accent-color)]">
                        <Link to="/disclosure">Legal Disclosure</Link>
                    </li>
                    <li className="flex w-full items-center justify-center transition-colors duration-300 hover:text-[var(--accent-color)]">
                        <Link to="/terms">Terms of Service</Link>
                    </li>
                    <li className="flex w-full items-center justify-center transition-colors duration-300 hover:text-[var(--accent-color)]">
                        <Link to="/privacy">Privacy Policy</Link>
                    </li>
                    <li className="flex w-full items-center justify-center transition-colors duration-300 hover:text-[var(--accent-color)]">
                        <Link
                            className="inter-bold flex items-center justify-center text-[var(--accent-color)] transition-colors duration-300 hover:text-white"
                            target="_blank"
                            to="mailto:contact@seriuxmod.net"
                        >
                            <TfiEmail size={18} />
                            <span className="pl-2">Contact Us</span>
                        </Link>
                    </li>
                </ul>
            </div>
        </footer>
    );
}

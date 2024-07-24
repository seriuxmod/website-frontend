import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function PrivacyPolicy() {
    useState(() => {
        document.title = 'SeriuxMod | Privacy Policy';
    }, []);
    return (
        <div className="min-h-screen select-text">
            <div className="container mx-auto px-4 py-8">
                <header className="mb-6 text-center">
                    <h1 className="text-3xl font-bold">Privacy Policy</h1>
                </header>
                <main>
                    <section>
                        <h2 className="mb-4 text-2xl font-semibold">1. Introduction</h2>
                        <p>
                            Welcome to seriuxmod.net ("we," "our," "us"). By accessing or using our Minecraft
                            client/mod/launcher, you agree to these terms. If you do not agree, please do not use our
                            services.
                        </p>

                        <h2 className="mb-4 mt-6 text-2xl font-semibold">2. Data Collection</h2>
                        <p>
                            We collect minimal personal data to improve your experience. Data collected includes usage
                            statistics, contact information, user ids and Minecraft account data e.g skins, capes.
                        </p>

                        <h2 className="mb-4 mt-6 text-2xl font-semibold">3. Google Fonts</h2>
                        <p>
                            We use Google Fonts for styling, and your interaction with them is subject to{' '}
                            <a href="https://policies.google.com/privacy" className="text-blue-500 underline">
                                Google’s Privacy Policy
                            </a>
                            .
                        </p>

                        <h2 className="mb-4 mt-6 text-2xl font-semibold">4. Data Security</h2>
                        <p>
                            We implement reasonable measures to protect your data, but no method of transmission over
                            the internet or electronic storage is 100% secure.
                        </p>

                        <h2 className="mb-4 mt-6 text-2xl font-semibold">5. Changes to Policy</h2>
                        <p>
                            We may update this policy from time to time. Your continued use of our services constitutes
                            acceptance of any changes.
                        </p>

                        <h2 className="mb-4 mt-6 text-2xl font-semibold">6. Contact Us</h2>
                        <p>
                            For any questions or concerns, please contact us at{' '}
                            <Link
                                className="inter-bold text-[var(--accent-color)] transition-colors duration-300 hover:text-white"
                                target="_blank"
                                to="mailto:contact@seriuxmod.net"
                            >
                                contact@seriuxmod.net
                            </Link>{' '}
                            .
                        </p>
                    </section>
                </main>
            </div>
        </div>
    );
}

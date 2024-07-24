import { Link } from 'react-router-dom';

export default function LegalDisclosure() {
    return (
        <div className="min-h-screen select-text">
            <div className="container mx-auto px-4 py-8">
                <header className="mb-6 text-center">
                    <h1 className="text-3xl font-bold">Legal Disclosure</h1>
                </header>
                <main>
                    <section>
                        <h2 className="mb-4 text-2xl font-semibold">1. Introduction</h2>
                        <p>
                            Welcome to seriuxmod.net ("we," "our," "us"). By accessing or using our Minecraft
                            client/mod/launcher, you agree to these terms. If you do not agree, please do not use our
                            services.
                        </p>

                        <h2 className="mb-4 mt-6 text-2xl font-semibold">2. Use of Our Service</h2>
                        <ul className="ml-6 list-disc">
                            <li>
                                Our service is provided "as is." We do not guarantee uninterrupted or error-free access.
                            </li>
                            <li>
                                You may use our client/mod/launcher only for personal, non-commercial purposes and must
                                not distribute it without our permission.
                            </li>
                        </ul>

                        <h2 className="mb-4 mt-6 text-2xl font-semibold">3. Intellectual Property</h2>
                        <p>
                            All content and materials on our site, including code, graphics, and trademarks, are owned
                            by us or licensed to us. You may not use them without our explicit consent.
                        </p>

                        <h2 className="mb-4 mt-6 text-2xl font-semibold">4. Privacy Policy</h2>
                        <p>
                            We collect minimal personal data to improve your experience. Data collected includes usage
                            statistics, contact information, user ids and Minecraft account data e.g skins, capes.
                        </p>

                        <h2 className="mb-4 mt-6 text-2xl font-semibold">5. Disclaimer</h2>
                        <p>
                            We are not affiliated with Mojang Studios or Microsoft. Our software is a third-party
                            creation and is used at your own risk.
                        </p>

                        <h2 className="mb-4 mt-6 text-2xl font-semibold">6. Limitation of Liability</h2>
                        <p>
                            We are not liable for any damages arising from the use or inability to use our services,
                            including data loss or damage to your system.
                        </p>

                        <h2 className="mb-4 mt-6 text-2xl font-semibold">7. Changes to Terms</h2>
                        <p>
                            We may update these terms and policies from time to time. Your continued use of our services
                            constitutes acceptance of any changes.
                        </p>

                        <h2 className="mb-4 mt-6 text-2xl font-semibold">8. Contact Us</h2>
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

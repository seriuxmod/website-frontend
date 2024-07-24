export default function Header() {
    return (
        <header className="relative left-0 top-0 z-0 flex h-screen w-screen items-center justify-center overflow-hidden">
            {/* Overlay with opacity */}
            <div className="absolute inset-0 z-10 bg-black opacity-80"></div>

            {/* Video background */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <video
                    className="h-full w-full object-cover"
                    autoPlay
                    muted
                    loop
                    src="https://cdn.seriuxmod.net/metadata/internal/gameplay.mp4"
                />
            </div>

            {/* Text content */}
            <div className="relative z-20 flex flex-col items-center justify-center px-4 text-center">
                <h2 className="inter-bold mb-4 text-3xl text-[var(--accent-color)] md:text-3xl lg:text-4xl">
                    Currently we're working under high pressure.
                </h2>
                <h3 className="text-xl text-white lg:text-2xl">
                    Please be patient and stay up to date on our discord server.
                </h3>
            </div>
        </header>
    );
}

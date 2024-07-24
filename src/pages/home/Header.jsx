export default function Header() {
  return (
    <header className="relative top-0 left-0 w-screen h-screen z-0 flex items-center justify-center overflow-hidden">
      {/* Overlay with opacity */}
      <div className="absolute inset-0 bg-black opacity-80 z-10"></div>

      {/* Video background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          src="https://cdn.seriuxmod.net/metadata/internal/gameplay.mp4"
        />
      </div>

      {/* Text content */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-[var(--accent-color)] inter-bold text-3xl md:text-3xl lg:text-4xl mb-4">
          Currently we're working under high pressure.
        </h2>
        <h3 className="text-xl lg:text-2xl text-white">
          Please be patient and stay up to date on our discord server.
        </h3>
      </div>
    </header>
  );
}

export default function Header() {
  return (
    <header className="relative top-0 left-0 h-screen w-screen z-0 flex flex-row items-center justify-center">
      <div className="absolute top-0 left-0 h-screen w-screen bg-black opacity-50 -z-1"></div>
      <div className="absolute top-0 left-0 h-screen w-screen -z-2">
        <video
          className="absolute top-0 left-0 w-full h-full -z-0"
          autoPlay={true}
          muted={true}
          loop={true}
          src="https://cdn.seriuxmod.net/metadata/internal/gameplay.mp4"
        ></video>
      </div>

      <div className="flex flex-col items-center justify-center z-10">
        <h2 className="text-[var(--accent-color)] inter-bold text-4xl">
          Currently we're working under high pressure.
        </h2>
        <h3 className="text-2xl">
          Please be patient and stay up to date on our discord server.
        </h3>
      </div>
    </header>
  );
}

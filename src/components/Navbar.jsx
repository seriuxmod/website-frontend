import { Link, useLocation } from "react-router-dom";
import Logo from "../assets/icon_transparent.png";

const activeStyle =
  "after:absolute after:bottom-0 after:left-0 after:ml--1 after:w-[30px] after:h-1 after:bg-[var(--accent-color)]";

const inactiveStyle =
  "relative p-1 mr-2 rounded-sm border border-transparent hover:border hover:border-[#666666]";

const disabledStyle = "pointer-events-none cursor-not-allowed text-[#666666]";

export default function Navbar() {
  const loc = useLocation();
  const currentPath = loc.pathname;

  return (
    <div className="fixed top-0 left-0 w-screen h-[var(--navbar-height)] bg-[var(--background-color-secondary)] z-[100] flex flex-row items-center justify-start">
      <nav className="flex flex-row items-center justify-start">
        <div className="ml-2 flex flex-row justify-center items-center">
          <Link to="/" className="flex flex-row items-center justify-center">
            <img className="rounded-full w-[50px]" src={Logo} alt="Logo" />
            <span className="inter-bold">SeriuxMod</span>
          </Link>
        </div>
        <ul className="ml-4 flex flex-row items-center justify-around">
          <li
            className={
              inactiveStyle + (currentPath == "/" ? " " + activeStyle : "")
            }
          >
            <Link to={currentPath == "/" ? "#" : "/"}>Home</Link>
          </li>

          <li
            className={
              inactiveStyle +
              disabledStyle +
              (currentPath == "/team" ? " " + activeStyle : "")
            }
          >
            <Link
              className={disabledStyle}
              to={currentPath == "/team" ? "#" : "/team"}
            >
              Team
            </Link>
          </li>

          <li
            className={
              inactiveStyle +
              disabledStyle +
              (currentPath == "/players" ? " " + activeStyle : "")
            }
          >
            <Link
              className={disabledStyle}
              to={currentPath == "/players" ? "#" : "/players"}
            >
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
    </div>
  );
}

import { Link } from "react-router-dom";
import {
  FaGithub,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaTwitch,
  FaLinkedin,
} from "react-icons/fa";
import { TfiEmail } from "react-icons/tfi";

export default function Footer() {
  return (
    <footer className="bg-[var(--background-color-secondary)] w-screen py-5">
      <div className="flex flex-col items-center justify-start w-full">
        <div className="flex flex-row items-center justify-center mx-5">
          <ul className="flex flex-row items-center justify-around">
            <li className="m-2">
              <Link target="_blank" to="https://github.com/Seriuxmod">
                <FaGithub
                  className="hover:text-white text-[var(--accent-color)]"
                  size="50px"
                />
              </Link>
            </li>
            <li className="m-2">
              <Link target="_blank" to="https://twitter.com/Seriuxmod">
                <FaTwitter
                  className="hover:text-white text-[var(--accent-color)]"
                  size="50px"
                />
              </Link>
            </li>
            <li className="m-2">
              <Link target="_blank" to="https://instagram.com/Seriuxmod">
                <FaInstagram
                  className="hover:text-white text-[var(--accent-color)]"
                  size="50px"
                />
              </Link>
            </li>
            <li className="m-2">
              <Link target="_blank" to="#">
                <FaLinkedin
                  className="hover:text-white text-[var(--accent-color)]"
                  size="50px"
                />
              </Link>
            </li>
            <li className="m-2">
              <Link target="_blank" to="#">
                <FaYoutube
                  className="hover:text-white text-[var(--accent-color)]"
                  size="50px"
                />
              </Link>
            </li>
            <li className="m-2">
              <Link target="_blank" to="https://twitch.tv/Seriuxmod">
                <FaTwitch
                  className="hover:text-white text-[var(--accent-color)]"
                  size="50px"
                />
              </Link>
            </li>
          </ul>
        </div>
        <div className="flex flex-col items-center justify-around mx-5 mr-8">
          <p className="text-center max-w-[95vw] md:max-w-[80vw] lg:max-w-[60vq]">
            Copyright ¢ 2024 | seriuxmod.net | All rights reserved
          </p>
          <p className="text-[var(--text-color-secondary)] text-center max-w-[95vw] md:max-w-[80vw] lg:max-w-[60vq]">
            We have been working on this project for a long time due to its
            scope. If you would like to support us on our way, then take a look
            at our social media links or apply at{" "}
            <Link
              className="inter-bold hover:text-white text-[var(--accent-color)]"
              target="_blank"
              to="mailto:partners@seriuxmod.net"
            >
              partners@seriuxmod.net
            </Link>{" "}
            as a server network partnership, community partnership or promoter
            partnership
          </p>
          <ul className="flex flex-row items-center justify-start inter-bold text-l uppercase">
            <li className="m-4 hover:text-[var(--accent-color)]">
              <Link to="#">Legal Disclosure</Link>
            </li>
            <li className="m-4 hover:text-[var(--accent-color)]">
              <Link to="#">Terms of Service</Link>
            </li>
            <li className="m-4 hover:text-[var(--accent-color)]">
              <Link to="#">Privacy Policy</Link>
            </li>
            <li className="m-4 hover:text-[var(--accent-color)]">
              <Link
                className="flex flex-row items-center justify-center"
                target="_blank"
                to="#"
              >
                <TfiEmail size="18px" />{" "}
                <span className="pl-2">Contact Us</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

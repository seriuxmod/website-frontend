import { FaKey } from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import { RecoveryShell } from './VerifyEmail';

export default function ForgotPassword() {
    return <RecoveryShell icon={FaKey} title="Zugang wiederherstellen" copy="Nutze einen zuvor unter Sicherheit gesicherten Wiederherstellungscode. Eine Wiederherstellung per E-Mail oder Launcher-Reset wird nicht angeboten.">
        <a className="forum-button-primary mt-6" href="https://auth.seriuxmod.net/login/recovery">Mit gesichertem Code fortfahren</a>
        <p className="mt-5 text-sm leading-6 text-zinc-400">Dabei werden bisherige Passkeys, Authenticator und alte Codes ersetzt und alle alten Sitzungen widerrufen. Mit einem noch verfügbaren Passkey kannst du dich stattdessen normal anmelden.</p>
        <Link className="forum-button-secondary mt-5" to="/me/settings/security">Zur Kontosicherheit</Link>
    </RecoveryShell>;
}

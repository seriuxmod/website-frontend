import { Link } from 'react-router-dom';
import { AdminEmptyState, AdminPendingState, AdminUnavailableState } from './AdminUi.jsx';
import { statusPresentation } from '../../lib/statusPresentation.js';

export default function AdminRegionStatus({ summary, state, onRetry }) {
    return <section className="rounded-[28px] border border-white/[.07] bg-[#111218] p-5 sm:p-7">
        <p className="eyebrow">STATUS-SERVICE</p>
        <h3 className="mt-2 font-display text-2xl font-bold">Gemeldete Regionen</h3>
        <p className="mt-2 text-xs leading-6 text-zinc-500">Konfigurierte Regionen aus dem Backend. Keine abgeleitete Geografie oder geschätzten Anfragezahlen.</p>
        <div className="mt-6">
            {state === 'error' ? <AdminUnavailableState onRetry={onRetry} />
                : state !== 'ready' ? <AdminPendingState title="Regionsstatus wird geladen" />
                    : !summary?.regions?.length ? <AdminEmptyState title="Keine Regionen gemeldet" text="Der Status-Snapshot enthält keine regionalen Zuordnungen." />
                        : <ul className="grid gap-3 sm:grid-cols-2">{summary.regions.map(entry => {
                            const view = statusPresentation(entry.overallStatus);
                            return <li key={entry.region.regionId} className="rounded-2xl border border-white/[.06] bg-black/15 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3"><b className="text-sm">{entry.region.displayName || entry.region.regionId}</b><span className={`text-xs ${view.text}`}>{view.label}</span></div>
                                <p className="mt-2 break-all font-mono text-[10px] text-zinc-500">{entry.region.regionId}</p>
                                <p className="mt-3 text-xs text-zinc-400">{entry.healthyServices}/{entry.monitoredServices} Dienste erreichbar · {entry.incidentCount} Vorfälle</p>
                            </li>;
                        })}</ul>}
        </div>
        <Link className="mt-6 inline-block text-xs font-bold text-orange-300" to="/status">Öffentlichen Systemstatus öffnen →</Link>
    </section>;
}

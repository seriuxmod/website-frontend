// A configured region is an operator identity, never inferred geography.
export function statusPresentation(status) {
    return ({
        UP: { label: 'Online', tone: 'emerald', dot: 'bg-emerald-400', text: 'text-emerald-300' },
        DEGRADED: { label: 'Eingeschränkt', tone: 'orange', dot: 'bg-amber-400', text: 'text-amber-300' },
        CRITICAL: { label: 'Störung', tone: 'red', dot: 'bg-red-400', text: 'text-red-300' }
    })[status] ?? { label: 'Unbekannt', tone: 'sky', dot: 'bg-zinc-500', text: 'text-zinc-400' };
}

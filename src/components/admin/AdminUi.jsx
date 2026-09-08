import { FaCircleExclamation, FaSpinner } from 'react-icons/fa6';

const TONES = {
    orange: {
        card: 'border-orange-400/15 bg-[linear-gradient(145deg,rgba(249,115,22,.14),rgba(17,18,24,.96)_62%)]',
        icon: 'bg-orange-400/12 text-orange-300',
        detail: 'text-orange-200/65'
    },
    emerald: {
        card: 'border-emerald-400/15 bg-[linear-gradient(145deg,rgba(16,185,129,.12),rgba(17,18,24,.96)_62%)]',
        icon: 'bg-emerald-400/10 text-emerald-300',
        detail: 'text-emerald-200/65'
    },
    sky: {
        card: 'border-sky-400/15 bg-[linear-gradient(145deg,rgba(14,165,233,.11),rgba(17,18,24,.96)_62%)]',
        icon: 'bg-sky-400/10 text-sky-300',
        detail: 'text-sky-200/65'
    },
    violet: {
        card: 'border-violet-400/15 bg-[linear-gradient(145deg,rgba(139,92,246,.11),rgba(17,18,24,.96)_62%)]',
        icon: 'bg-violet-400/10 text-violet-300',
        detail: 'text-violet-200/65'
    },
    red: {
        card: 'border-red-400/20 bg-[linear-gradient(145deg,rgba(239,68,68,.13),rgba(17,18,24,.96)_62%)]',
        icon: 'bg-red-400/10 text-red-300',
        detail: 'text-red-200/70'
    }
};

export function AdminMetricCard({
    icon: Icon,
    label,
    value,
    detail,
    tone = 'orange',
    pending = false,
    pendingTitle = 'Daten werden geladen',
    pendingText = 'Quelle wartet auf eine Antwort'
}) {
    const styles = TONES[tone] ?? TONES.orange;

    return (
        <article
            className={`relative min-h-[150px] overflow-hidden rounded-[24px] border p-5 shadow-[0_18px_55px_rgba(0,0,0,.12)] ${styles.card}`}
        >
            <span className="pointer-events-none absolute -right-9 -top-10 h-28 w-28 rounded-full bg-white/[.025] blur-sm" />
            <div className="relative flex h-full flex-col justify-between gap-5">
                <div className="flex items-start justify-between gap-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-[.17em] text-zinc-500">{label}</p>
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm ${styles.icon}`}>
                        <Icon />
                    </span>
                </div>
                {pending ? (
                    <div className="flex min-h-12 items-center gap-3" role="status" aria-live="polite">
                        <span className={`grid h-9 w-9 place-items-center rounded-full ${styles.icon}`}>
                            <FaSpinner className="animate-spin" />
                        </span>
                        <div>
                            <b className="block text-sm text-zinc-200">{pendingTitle}</b>
                            <span className="mt-1 block text-[10px] text-zinc-600">{pendingText}</span>
                        </div>
                    </div>
                ) : (
                    <div>
                        <strong className="block break-words font-display text-[clamp(1.45rem,2vw,2rem)] font-bold leading-none text-white">
                            {value}
                        </strong>
                        <span className={`mt-2 block text-[11px] font-semibold ${styles.detail}`}>{detail}</span>
                    </div>
                )}
            </div>
        </article>
    );
}

export function AdminPendingState({
    title = 'Daten werden geladen',
    text = 'Die angebundene Datenquelle hat noch keine Antwort geliefert.',
    compact = false
}) {
    return (
        <div
            className={`flex items-center justify-center rounded-2xl border border-dashed border-orange-400/15 bg-orange-400/[.025] text-center ${compact ? 'min-h-24 px-4 py-5' : 'min-h-44 px-6 py-10'}`}
            role="status"
            aria-live="polite"
        >
            <div>
                <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-orange-400/10 text-orange-300">
                    <FaSpinner className="animate-spin" />
                </span>
                <b className="mt-4 block text-sm text-zinc-200">{title}</b>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-zinc-600">{text}</p>
            </div>
        </div>
    );
}

export function AdminEmptyState({ title, text }) {
    return (
        <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-white/[.07] bg-black/10 px-5 py-8 text-center">
            <div>
                <FaCircleExclamation className="mx-auto text-zinc-700" />
                <b className="mt-3 block text-sm text-zinc-300">{title}</b>
                {text && <p className="mt-1 text-xs leading-5 text-zinc-600">{text}</p>}
            </div>
        </div>
    );
}

export function AdminDashboardSkeleton() {
    return (
        <div className="animate-pulse" aria-label="Dashboard wird geladen" role="status">
            <div className="h-3 w-28 rounded-full bg-white/[.06]" />
            <div className="mt-4 h-10 w-72 max-w-full rounded-xl bg-white/[.07]" />
            <div className="mt-3 h-4 w-[34rem] max-w-full rounded-lg bg-white/[.045]" />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div className="h-[150px] rounded-[24px] border border-white/[.06] bg-[#111218]" key={index} />
                ))}
            </div>
            <div className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]">
                <div className="h-[430px] rounded-[28px] border border-white/[.06] bg-[#111218]" />
                <div className="h-[430px] rounded-[28px] border border-white/[.06] bg-[#111218]" />
            </div>
        </div>
    );
}

import { FaArrowRight, FaCheck } from 'react-icons/fa6';
import { Link, Navigate, useParams } from 'react-router-dom';
import { communityPageBySlug } from '../../config/community';

export default function CommunityPage() {
    const { page } = useParams();
    const entry = communityPageBySlug[page];
    if (!entry) return <Navigate to="/" replace />;

    const Icon = entry.icon;
    const cta = entry.cta ?? { label: 'Community-Forum öffnen', to: '/forum' };
    const ctaClass = 'button-primary mt-8';
    return (
        <main className="min-h-[80vh] overflow-hidden px-5 pb-24 pt-36 text-white sm:pt-44 lg:px-10">
            <section className="community-page-hero relative mx-auto max-w-7xl overflow-hidden rounded-[34px] border border-white/[.08] px-6 py-14 sm:px-12 sm:py-20 lg:px-20">
                <div className="relative z-10 max-w-3xl">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-xl text-orange-300">
                        <Icon />
                    </div>
                    <p className="eyebrow mt-8">{entry.eyebrow}</p>
                    <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-[-.05em] sm:text-6xl">
                        {entry.title}
                    </h1>
                    <p className="mt-6 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">{entry.copy}</p>
                    {cta.external ? (
                        <a className={ctaClass} href={cta.to} target="_blank" rel="noreferrer">
                            {cta.label} <FaArrowRight />
                        </a>
                    ) : (
                        <Link className={ctaClass} to={cta.to}>
                            {cta.label} <FaArrowRight />
                        </Link>
                    )}
                </div>
            </section>

            <section className="mx-auto mt-8 grid max-w-7xl gap-4 md:grid-cols-3">
                {entry.features.map((feature, index) => (
                    <article className="liquid-panel rounded-3xl p-6 sm:p-8" key={feature}>
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-500/10 text-xs text-orange-300">
                            <FaCheck />
                        </span>
                        <p className="mt-8 text-[10px] font-extrabold tracking-[.18em] text-zinc-700">0{index + 1}</p>
                        <h2 className="mt-2 font-display text-xl font-bold">{feature}</h2>
                    </article>
                ))}
            </section>
        </main>
    );
}

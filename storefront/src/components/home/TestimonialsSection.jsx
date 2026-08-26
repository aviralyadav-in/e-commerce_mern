import { StarIcon } from "../common/Icons";
import { TESTIMONIALS } from "../../data/siteContent";

/**
 * TestimonialsSection — "Loved by Women Everywhere" review cards.
 */
export default function TestimonialsSection() {
  if (!TESTIMONIALS.length) return null;

  return (
    <section
      className="px-4 py-16 sm:px-6 md:py-20"
      style={{ background: "var(--bg-raised)" }}
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <p className="eyebrow mb-2">The Niya Experience</p>
          <h2 className="section-title">Loved by Women Everywhere</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <article key={t.id || t.name} className="card flex flex-col p-6">
              <div className="flex gap-1" style={{ color: "var(--accent)" }}>
                {Array.from({ length: t.rating || 5 }).map((_, i) => (
                  <StarIcon key={i} size={12} filled />
                ))}
              </div>
              <p
                className="font-display mt-5 text-base leading-6"
                style={{ color: "var(--ink)" }}
              >
                “{t.text}”
              </p>
              <div
                className="mt-auto border-t pt-4"
                style={{ borderColor: "var(--border)" }}
              >
                <p className="text-[11px] font-bold" style={{ color: "var(--ink)" }}>
                  {t.name}
                </p>
                <p className="mt-1 text-[10px]" style={{ color: "var(--ink-faint)" }}>
                  {t.location} · Verified Customer
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

import { Link } from "react-router";
import { CRAFTSMANSHIP_HOME } from "../../data/siteContent";

/**
 * CraftsmanshipSection — home ka "The Art of Craftsmanship" block.
 * Stats grid + /craftsmanship page ka CTA.
 */
export default function CraftsmanshipSection() {
  const c = CRAFTSMANSHIP_HOME;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
      <div className="grid items-center gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-20">
        {/* Text — mobile pe image ke neeche */}
        <div className="order-2 md:order-1">
          <p className="eyebrow mb-3">{c.eyebrow}</p>
          <h2
            className="section-title leading-[1.05]"
            style={{ whiteSpace: "pre-line" }}
          >
            {c.title}
          </h2>
          <div
            className="mt-7 space-y-4 text-sm leading-6"
            style={{ color: "var(--ink-muted)" }}
          >
            {c.description?.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {c.stats?.length > 0 && (
            <div
              className="mt-8 grid max-w-md grid-cols-3 gap-5 border-t pt-6"
              style={{ borderColor: "var(--border)" }}
            >
              {c.stats.map((stat) => (
                <div key={stat.label}>
                  <strong
                    className="font-display text-2xl"
                    style={{ color: "var(--ink)" }}
                  >
                    {stat.value}
                  </strong>
                  <p
                    className="mt-1 text-[10px]"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          <Link
            to={c.buttonLink}
            className="mt-8 inline-flex items-center gap-2 border-b pb-2 text-[11px] font-bold uppercase tracking-[0.14em] transition hover:gap-3.5"
            style={{ borderColor: "var(--accent)", color: "var(--ink)" }}
          >
            {c.buttonText} →
          </Link>
        </div>

        {/* Image */}
        <div className="order-1 overflow-hidden md:order-2">
          <img
            src={c.image}
            alt={c.imageAlt || c.title}
            loading="lazy"
            className="h-107.5 w-full object-cover md:h-150"
          />
        </div>
      </div>
    </section>
  );
}

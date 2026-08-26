import InfoPageShell from "../components/common/InfoPageShell";
import { CRAFTSMANSHIP_PAGE } from "../data/siteContent";

/** /craftsmanship — heritage story + gallery grid */
export default function CraftsmanshipPage() {
  return (
    <>
      <InfoPageShell
        eyebrow={CRAFTSMANSHIP_PAGE.eyebrow}
        title={CRAFTSMANSHIP_PAGE.title}
        intro={CRAFTSMANSHIP_PAGE.intro}
      >
        <div className="space-y-10">
          {CRAFTSMANSHIP_PAGE.sections.map((section) => (
            <section key={section.title}>
              <h2
                className="font-display mb-3 text-2xl font-medium"
                style={{ color: "var(--ink)" }}
              >
                {section.title}
              </h2>
              <p
                className="text-sm leading-7"
                style={{ color: "var(--ink-muted)" }}
              >
                {section.content}
              </p>
            </section>
          ))}
        </div>

        {CRAFTSMANSHIP_PAGE.closing && (
          <p
            className="mt-12 border-t pt-8 text-center text-sm leading-7"
            style={{ borderColor: "var(--border)", color: "var(--ink-muted)" }}
          >
            {CRAFTSMANSHIP_PAGE.closing}
          </p>
        )}
      </InfoPageShell>

      {/* Gallery — full-width strip */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {(CRAFTSMANSHIP_PAGE.gallery || []).map((item) => (
            <figure key={item.id} className="group relative overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                className="aspect-4/5 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <figcaption
                className="font-display absolute bottom-3 left-3 right-3 text-sm"
                style={{
                  color: "#fff",
                  textShadow: "0 1px 8px rgba(0,0,0,0.6)",
                }}
              >
                {item.title}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </>
  );
}

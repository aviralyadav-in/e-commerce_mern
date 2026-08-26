import InfoPageShell from "../components/common/InfoPageShell";
import { LEGAL_PAGES } from "../data/siteContent";

/**
 * LegalPage — /privacy-policy aur /terms-of-use dono isi se render hote hain.
 * `slug` prop route se aata hai; sections me id hain (#anchor support).
 */
export default function LegalPage({ slug }) {
  const page = LEGAL_PAGES[slug];

  if (!page) return null;

  return (
    <InfoPageShell eyebrow={page.eyebrow} title={page.title} intro={page.intro}>
      <div className="space-y-4">
        {page.sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="card scroll-mt-24 p-6"
          >
            <h2
              className="font-display mb-3 text-xl font-medium"
              style={{ color: "var(--ink)" }}
            >
              {section.title}
            </h2>
            <p className="text-sm leading-7" style={{ color: "var(--ink-muted)" }}>
              {section.content}
            </p>
          </section>
        ))}
      </div>

      <p className="mt-8 text-center text-xs" style={{ color: "var(--ink-faint)" }}>
        Last updated · {new Date().getFullYear()}
      </p>
    </InfoPageShell>
  );
}

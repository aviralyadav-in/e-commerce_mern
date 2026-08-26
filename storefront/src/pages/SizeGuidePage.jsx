import InfoPageShell from "../components/common/InfoPageShell";
import { SIZE_GUIDE_PAGE } from "../data/siteContent";

/**
 * SizeGuidePage — /size-guide aur /care-guide dono isi ko render karte hain.
 * Sections me id hain toh #size-guide / #care-guide anchors kaam karte hain.
 */
export default function SizeGuidePage() {
  return (
    <InfoPageShell
      eyebrow={SIZE_GUIDE_PAGE.eyebrow}
      title={SIZE_GUIDE_PAGE.title}
      intro={SIZE_GUIDE_PAGE.intro}
    >
      <div className="space-y-4">
        {SIZE_GUIDE_PAGE.sections.map((section) => (
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
    </InfoPageShell>
  );
}

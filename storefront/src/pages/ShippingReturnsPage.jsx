import InfoPageShell from "../components/common/InfoPageShell";
import { SHIPPING_RETURNS_PAGE } from "../data/siteContent";

/**
 * /shipping-returns — sections me id hain (#shipping/#returns/#exchange),
 * footer ke anchor links inhi par scroll karte hain (ScrollToAnchor se).
 */
export default function ShippingReturnsPage() {
  return (
    <InfoPageShell
      eyebrow={SHIPPING_RETURNS_PAGE.eyebrow}
      title={SHIPPING_RETURNS_PAGE.title}
      intro={SHIPPING_RETURNS_PAGE.intro}
    >
      <div className="space-y-4">
        {SHIPPING_RETURNS_PAGE.sections.map((section) => (
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

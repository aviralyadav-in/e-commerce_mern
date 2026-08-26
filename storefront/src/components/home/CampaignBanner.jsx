import { Link } from "react-router";
import { CAMPAIGN_BANNER } from "../../data/siteContent";

/**
 * CampaignBanner — dark editorial split banner (image + text).
 */
export default function CampaignBanner() {
  const c = CAMPAIGN_BANNER;

  return (
    <section style={{ background: "var(--bg-deep)" }}>
      <div className="mx-auto grid max-w-7xl overflow-hidden md:grid-cols-2">
        <div className="relative h-75 sm:h-95 md:h-125">
          <img
            src={c.image}
            alt={c.title.replace("\n", " ")}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div
          className="flex items-center px-6 py-10 sm:px-10 md:min-h-125 md:px-14"
          style={{ background: "var(--bg-raised)" }}
        >
          <div className="max-w-md">
            <p className="eyebrow mb-3">{c.eyebrow}</p>
            <h2
              className="font-display text-4xl font-medium leading-[1.05] md:text-5xl"
              style={{ color: "#f2efe7", whiteSpace: "pre-line" }}
            >
              {c.title}
            </h2>
            <p
              className="mt-5 max-w-sm text-xs leading-6"
              style={{ color: "rgba(242,239,231,0.65)" }}
            >
              {c.description}
            </p>
            <Link
              to={c.buttonLink}
              className="mt-7 inline-flex items-center gap-2 border-b pb-1.5 text-sm font-semibold transition hover:gap-3.5"
              style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
            >
              {c.buttonText} →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

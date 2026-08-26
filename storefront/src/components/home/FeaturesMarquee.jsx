import {
  TruckIcon,
  ShieldIcon,
  RefreshIcon,
  PackageIcon,
} from "../common/Icons";
import { MARQUEE_FEATURES } from "../../data/siteContent";

const ICONS = {
  truck: TruckIcon,
  shield: ShieldIcon,
  refresh: RefreshIcon,
  package: PackageIcon,
};

/**
 * FeaturesMarquee — benefits ki infinite scrolling strip.
 * Niyabags jaisa hover par rukta hai (CSS animation).
 */
export default function FeaturesMarquee() {
  // Seamless loop ke liye list ko 3x repeat karte hain
  const items = [...MARQUEE_FEATURES, ...MARQUEE_FEATURES, ...MARQUEE_FEATURES];

  return (
    <section
      className="w-full overflow-hidden border-y"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="marquee-track flex w-max">
        {items.map((feature, index) => {
          const Icon = ICONS[feature.icon] || TruckIcon;
          return (
            <div
              key={`${feature.title}-${index}`}
              className="flex w-52.5 shrink-0 items-center gap-3 border-r px-5 py-3.5 sm:w-62.5"
              style={{ borderColor: "var(--border)" }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{
                  border: "1px solid var(--accent)",
                  color: "var(--accent)",
                }}
              >
                <Icon size={14} />
              </span>
              <span className="min-w-0">
                <span
                  className="block whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: "var(--ink)" }}
                >
                  {feature.title}
                </span>
                <span
                  className="mt-0.5 block whitespace-nowrap text-[9px]"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {feature.text}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

import React from "react";
import { Award, ShieldCheck, Truck, RotateCcw, Lock } from "lucide-react";
import { useSettingsStore } from "../../stores/settingsStore";
import { cn, formatCurrency } from "../../lib/utils";

/**
 * Trust signals. variant: "grid" (4-up cards) | "row" (inline compact) | "list" (stacked rows, e.g. PDP buy box)
 * tone: "light" (theme surfaces) | "dark" (for onyx sections / footer)
 * items: optional override [{ icon, title, desc }]
 */
export default function TrustStrip({ variant = "grid", tone = "light", items, className }) {
  const settings = useSettingsStore((s) => s.settings);
  const floor = typeof settings?.freeShippingThreshold === "number" ? settings.freeShippingThreshold : 500;

  const DEFAULT_ITEMS = [
    { icon: Award, title: "Full-grain leather", desc: "Uncorrected hides that gain a rich patina with time." },
    { icon: Truck, title: "Complimentary delivery", desc: `Free insured shipping on orders above ${formatCurrency(floor)}.` },
    { icon: RotateCcw, title: "7-day easy returns", desc: "Doorstep pickup and a full refund, no questions asked." },
    { icon: ShieldCheck, title: "3-year stitch guarantee", desc: "Lifetime repair support from our atelier." },
  ];

  const data = Array.isArray(items) && items.length ? items : DEFAULT_ITEMS;
  const dark = tone === "dark";

  if (variant === "row") {
    return (
      <ul
        className={cn(
          "flex flex-wrap items-center gap-x-6 gap-y-2 text-micro",
          dark ? "text-ivory/70" : "text-ink-muted",
          className
        )}
      >
        {data.map(({ icon: Icon, title }) => (
          <li key={title} className="flex items-center gap-2">
            <Icon className={cn("size-3.5", dark ? "text-champagne" : "text-gold-ink")} aria-hidden="true" />
            <span>{title}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (variant === "list") {
    return (
      <ul className={cn("divide-y divide-line rounded-2xl border border-line bg-surface-2/60", className)}>
        {data.map(({ icon: Icon, title, desc }) => (
          <li key={title} className="flex items-start gap-3 px-4 py-3">
            <Icon className="mt-0.5 size-4 shrink-0 text-gold-ink" aria-hidden="true" />
            <div>
              <p className="text-small font-semibold text-foreground">{title}</p>
              {desc && <p className="text-xs text-ink-muted">{desc}</p>}
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {data.map(({ icon: Icon, title, desc }) => (
        <li
          key={title}
          className={cn(
            "flex items-start gap-4 rounded-2xl p-5",
            dark ? "border border-white/10 bg-white/5" : "surface-card shadow-none"
          )}
        >
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl",
              dark ? "bg-white/5 text-champagne ring-1 ring-champagne/30" : "bg-gold-soft text-gold-ink"
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className={cn("text-h4", dark ? "text-ivory" : "text-foreground")}>{title}</p>
            {desc && <p className={cn("mt-1 text-xs leading-relaxed", dark ? "text-ivory/65" : "text-ink-muted")}>{desc}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export { Lock as TrustLockIcon };

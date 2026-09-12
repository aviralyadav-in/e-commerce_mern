import React from "react";
import { cn } from "../../lib/utils";

/** Small inline spinner (use inside buttons: <Spinner className="size-4" />) */
export function Spinner({ className }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block size-5 animate-spin rounded-full border-2 border-champagne/40 border-t-champagne",
        className
      )}
    />
  );
}

/**
 * Branded route-level loader for React.Suspense fallbacks.
 * props: label (string), minHeight (css value)
 */
export default function PageLoader({ label = "Preparing the atelier", minHeight = "60vh" }) {
  return (
    <div
      className="flex w-full flex-col items-center justify-center gap-5 animate-fade-in"
      style={{ minHeight }}
      role="status"
      aria-live="polite"
    >
      <span className="font-serif text-2xl tracking-[0.28em] text-foreground">
        NIYA <span className="gold-gradient-text">BAGS</span>
      </span>
      <span className="divider-gold" aria-hidden="true" />
      <div className="flex items-center gap-3">
        <Spinner className="size-4" />
        <span className="text-micro text-ink-muted">{label}</span>
      </div>
    </div>
  );
}

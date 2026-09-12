import React from "react";
import { cn } from "../../lib/utils";

/**
 * Loading placeholder that mirrors ProductCard's anatomy so the grid does not
 * shift when real cards arrive. `layout="list"` mirrors the horizontal card.
 */
export default function ProductCardSkeleton({ className, layout = "grid" }) {
  if (layout === "list") {
    return (
      <div
        aria-hidden="true"
        className={cn("surface-card flex gap-4 overflow-hidden p-3 sm:p-4", className)}
      >
        <div className="skeleton-shimmer aspect-3/4 w-28 shrink-0 rounded-xl sm:w-40" />
        <div className="flex min-w-0 flex-1 flex-col gap-3 py-1">
          <div className="skeleton-shimmer h-2.5 w-20 rounded-full" />
          <div className="skeleton-shimmer h-4 w-3/4 rounded-full" />
          <div className="skeleton-shimmer h-3 w-full rounded-full" />
          <div className="skeleton-shimmer h-3 w-5/6 rounded-full" />
          <div className="mt-auto flex items-center justify-between gap-3 pt-2">
            <div className="skeleton-shimmer h-4 w-24 rounded-full" />
            <div className="skeleton-shimmer h-9 w-28 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn("surface-card flex flex-col overflow-hidden", className)}
    >
      <div className="skeleton-shimmer aspect-3/4 w-full" />
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="skeleton-shimmer h-2.5 w-16 rounded-full" />
          <div className="skeleton-shimmer h-4 w-10 rounded-full" />
        </div>
        <div className="skeleton-shimmer h-4 w-4/5 rounded-full" />
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton-shimmer size-4 rounded-full" />
          ))}
        </div>
        <div className="hairline pt-3">
          <div className="skeleton-shimmer h-4 w-2/5 rounded-full" />
        </div>
      </div>
    </div>
  );
}

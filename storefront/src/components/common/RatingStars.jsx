import React, { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "../../lib/utils";

const SIZES = { sm: "size-3", md: "size-4", lg: "size-5", xl: "size-7" };

/**
 * Star rating display (or picker when `onChange` is given).
 * props: value (0-5), count (number of reviews), size sm|md|lg|xl, showValue, onChange(n), className
 */
export default function RatingStars({
  value = 0,
  count,
  size = "md",
  showValue = false,
  onChange,
  className,
  label,
}) {
  const [hover, setHover] = useState(0);
  const interactive = typeof onChange === "function";
  const rounded = Math.max(0, Math.min(5, Number(value) || 0));
  const shown = interactive && hover ? hover : rounded;
  const starCls = SIZES[size] || SIZES.md;

  return (
    <div
      className={cn("inline-flex items-center gap-1.5", className)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={label || (interactive ? "Choose a rating" : `Rated ${rounded.toFixed(1)} out of 5`)}
    >
      <div className="flex items-center gap-0.5" onMouseLeave={() => interactive && setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => {
          const fill = Math.min(1, Math.max(0, shown - (n - 1)));
          const star = (
            <span className={cn("relative inline-block", starCls)} aria-hidden="true">
              <Star className={cn("absolute inset-0 text-line-strong", starCls)} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={cn("fill-champagne text-champagne", starCls)} />
              </span>
            </span>
          );
          if (!interactive) return <React.Fragment key={n}>{star}</React.Fragment>;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rounded === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onMouseEnter={() => setHover(n)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(0)}
              onClick={() => onChange(n)}
              className="rounded-sm transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-ring"
            >
              {star}
            </button>
          );
        })}
      </div>
      {showValue && rounded > 0 && (
        <span className="text-small font-semibold text-foreground tabular-nums">{rounded.toFixed(1)}</span>
      )}
      {typeof count === "number" && (
        <span className="text-small text-ink-soft tabular-nums">({count})</span>
      )}
    </div>
  );
}

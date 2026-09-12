import React from "react";
import { cn } from "../../lib/utils";

/**
 * Infinite horizontal ticker. Children are duplicated once so the loop is
 * seamless; the copy is hidden from assistive tech. Pauses on hover and is
 * static under prefers-reduced-motion.
 * props: children, className (outer), innerClassName (track)
 */
export default function Marquee({ children, className, innerClassName }) {
  return (
    <div className={cn("group/marquee relative overflow-hidden", className)}>
      <div
        className={cn(
          "flex w-max items-center gap-10 pr-10 animate-marquee motion-reduce:animate-none group-hover/marquee:paused",
          innerClassName
        )}
      >
        <div className="flex shrink-0 items-center gap-[inherit]">{children}</div>
        <div className="flex shrink-0 items-center gap-[inherit]" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}

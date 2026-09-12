import React, { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function prefersReducedMotion() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Reveal-on-scroll wrapper (fades/slides children in when they enter the viewport).
 * props:
 *  - as: element type (default "div")
 *  - delay: transition delay in ms (stagger)
 *  - once: reveal a single time (default true); false re-hides when scrolled out
 *  - className: extra classes on the wrapper
 * Under prefers-reduced-motion the wrapper is inert: content renders visible
 * immediately and no observer is attached.
 */
export default function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
  once = true,
  ...rest
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(() => prefersReducedMotion());

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return (
    <Tag
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn("reveal", visible && "is-visible", className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

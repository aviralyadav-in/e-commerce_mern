import React, { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "../../lib/utils";

const SHOW_AFTER_PX = 600;

const isPastThreshold = () => typeof window !== "undefined" && window.scrollY > SHOW_AFTER_PX;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function BackToTop() {
  const [visible, setVisible] = useState(isPastThreshold);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setVisible(isPastThreshold());
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, left: 0, behavior: prefersReducedMotion() ? "instant" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={cn(
        "fixed right-5 z-40 flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lift ring-1 ring-ivory/20 print:hidden",
        "bottom-[calc(1.25rem+env(safe-area-inset-bottom))] sm:right-6 sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]",
        "transition-[opacity,transform,background-color,color] duration-300 ease-luxury motion-reduce:transition-none",
        "hover:bg-primary-hover hover:text-onyx active:scale-95",
        visible ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0"
      )}
    >
      <ArrowUp className="size-4" aria-hidden="true" />
    </button>
  );
}

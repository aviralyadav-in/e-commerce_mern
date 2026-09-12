import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets the window scroll position when the route *path* changes.
 * - Uses "instant" so the global `scroll-behavior: smooth` never animates a page swap.
 * - Search-param-only changes (shop filters, sort, pagination) are ignored on purpose.
 * - A hash (#section) scrolls to that anchor instead; lazy routes get a few retries
 *   because the target may not exist until the chunk has rendered.
 */
const ANCHOR_RETRY_MS = [0, 120, 360, 800];

function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}

function scrollToAnchor(hash) {
  if (!hash || hash.length < 2) return false;
  let id = hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    /* keep the raw id */
  }
  const target = document.getElementById(id);
  if (!target) return false;
  target.scrollIntoView({ behavior: "instant", block: "start" });
  return true;
}

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const lastPathname = useRef(pathname);

  useEffect(() => {
    const pathChanged = lastPathname.current !== pathname;
    lastPathname.current = pathname;

    if (!hash) {
      if (pathChanged) scrollToTop();
      return undefined;
    }

    // Hash present: start from the top on a new page, then find the anchor.
    if (pathChanged) scrollToTop();
    if (scrollToAnchor(hash)) return undefined;

    const timers = ANCHOR_RETRY_MS.map((ms) =>
      window.setTimeout(() => {
        if (scrollToAnchor(hash)) timers.forEach((t) => window.clearTimeout(t));
      }, ms)
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [pathname, hash]);

  return null;
}

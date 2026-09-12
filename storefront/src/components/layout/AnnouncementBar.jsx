import React, { useEffect, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ShieldCheck, Sparkles, Tag, Truck, X } from "lucide-react";
import { useSettingsStore } from "../../stores/settingsStore";
import { cn, formatCurrency } from "../../lib/utils";

const DISMISS_KEY = "niya_announcement_dismissed";
const ROTATE_MS = 5000;

/* ---- prefers-reduced-motion as an external store (no setState in effects) ---- */
const reducedMotionQuery = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

function subscribeReducedMotion(callback) {
  const mq = reducedMotionQuery();
  if (!mq) return () => {};
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
const getReducedMotion = () => Boolean(reducedMotionQuery()?.matches);
const getServerReducedMotion = () => false;

function readDismissed() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function buildMessages(settings, threshold) {
  const list = [];
  const custom = typeof settings?.announcementText === "string" ? settings.announcementText.trim() : "";

  // Admin custom announcement has highest priority
  if (custom) list.push({ icon: Sparkles, text: custom, link: "/shop" });

  // Dynamic free-shipping floor from store settings
  list.push({
    icon: Truck,
    text: `Complimentary express delivery on orders above ${formatCurrency(threshold)} across India`,
    link: "/shop",
  });
  list.push({
    icon: Sparkles,
    text: "100% certified full-grain leather, handcrafted by master artisans",
    link: "/shop",
  });
  list.push({
    icon: Tag,
    text: "Use code NIYA10 for 10% off your first atelier order",
    link: "/shop",
  });
  list.push({
    icon: ShieldCheck,
    text: "3-year craftsmanship guarantee and easy 7-day doorstep returns",
    link: "/shop",
  });
  return list;
}

const controlClass =
  "relative inline-flex size-7 shrink-0 items-center justify-center rounded-full text-ivory/60 transition-colors hover:bg-ivory/10 hover:text-ivory focus-visible:text-ivory after:absolute after:-inset-2 after:content-['']";

export default function AnnouncementBar() {
  const { settings } = useSettingsStore();

  const threshold = settings?.freeShippingThreshold ?? 500;
  const isEnabled = settings?.announcementEnabled !== false;
  const messages = buildMessages(settings, threshold);
  const count = messages.length;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dismissed, setDismissed] = useState(readDismissed);
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getServerReducedMotion
  );

  useEffect(() => {
    if (paused || reduceMotion || dismissed || count < 2) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [paused, reduceMotion, dismissed, count]);

  if (!isEnabled || count === 0 || dismissed) return null;

  const safeIndex = index % count;
  const current = messages[safeIndex];
  const Icon = current.icon;

  const step = (delta) => setIndex((prev) => (((prev % count) + delta + count) % count));

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // storage unavailable — dismiss for this render only
    }
  };

  return (
    <div
      role="region"
      aria-label="Announcements"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="border-b border-ivory/10 bg-onyx text-ivory"
    >
      <div className="container-x flex min-h-9 items-center gap-2 py-1 sm:py-0">
        {/* Spacer keeps the message optically centred on mobile (mirrors the dismiss button). */}
        <span className="size-7 shrink-0 sm:hidden" aria-hidden="true" />

        {count > 1 && (
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous announcement"
            className={cn(controlClass, "hidden sm:inline-flex")}
          >
            <ChevronLeft className="size-3.5" aria-hidden="true" />
          </button>
        )}

        <Link
          to={current.link}
          className="group/announce flex min-w-0 flex-1 items-center justify-center rounded-sm text-center"
        >
          <span key={safeIndex} className="flex min-w-0 items-center gap-2.5 animate-fade-in">
            <Icon className="size-3.5 shrink-0 text-champagne" aria-hidden="true" />
            <span className="line-clamp-2 text-[10px] leading-snug tracking-[0.12em] uppercase font-semibold text-ivory/85 transition-colors group-hover/announce:text-ivory sm:truncate sm:text-micro sm:leading-normal">
              {current.text}
            </span>
          </span>
        </Link>

        {count > 1 && (
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next announcement"
            className={cn(controlClass, "hidden sm:inline-flex")}
          >
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcements"
          className={cn(controlClass, "sm:ml-1")}
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

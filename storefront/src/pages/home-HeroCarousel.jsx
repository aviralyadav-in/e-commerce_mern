import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingBag, Sparkles } from "lucide-react";
import ImageWithFallback from "../components/common/ImageWithFallback";
import Marquee from "../components/common/Marquee";
import { cn } from "../lib/utils";

const AUTOPLAY_MS = 6000;
const SWIPE_THRESHOLD_PX = 48;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const MARQUEE_ITEMS = [
  "Full-grain leather",
  "Hand-stitched heritage",
  "Vegetable-dyed hides",
  "Solid brass hardware",
  "Made in small batches",
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const mq = window.matchMedia(REDUCED_MOTION_QUERY);
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Home hero: cross-fading banner slides with numbered progress indicators,
 * prev/next (desktop), autoplay (6 s, paused on hover/focus, off under
 * reduced motion), touch swipe, keyboard arrows and a polite live region.
 * props: banners [{ _id, title, subtitle, image, linkUrl, imageClassName? }], supportingCopy
 */
export default function HomeHeroCarousel({ banners = [], supportingCopy }) {
  const count = banners.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0); // bumps to restart the progress bar after a pause
  const reducedMotion = usePrefersReducedMotion();
  const touchStartX = useRef(null);

  const safeIndex = count > 0 ? Math.min(index, count - 1) : 0;
  const banner = banners[safeIndex];
  const autoplay = count > 1 && !paused && !reducedMotion;

  const goTo = useCallback((i) => setIndex(((i % count) + count) % count), [count]);
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);

  useEffect(() => {
    if (!autoplay) return undefined;
    const timer = setTimeout(next, AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [autoplay, next, safeIndex, cycle]);

  const pause = () => setPaused(true);
  const resume = () => {
    setPaused(false);
    setCycle((c) => c + 1);
  };
  // Hover pause is a mouse affordance only — a tap on touch devices must not freeze autoplay.
  const handlePointerEnter = (e) => {
    if (e.pointerType === "mouse") pause();
  };
  const handlePointerLeave = (e) => {
    if (e.pointerType === "mouse") resume();
  };
  const handleBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) resume();
  };
  const handleKeyDown = (e) => {
    if (count <= 1) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    }
  };
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || count <= 1) return;
    const delta = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    if (delta < 0) next();
    else prev();
  };

  if (!banner) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured collections"
      className="relative isolate h-[72vh] max-h-[720px] min-h-[540px] w-full overflow-hidden bg-onyx text-ivory sm:h-[70vh] sm:max-h-[760px] sm:min-h-[540px]"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocus={pause}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Photo layer (decorative — the headline carries the meaning) */}
      <div className="absolute inset-0" aria-hidden="true">
        {banners.map((b, i) => {
          const active = i === safeIndex;
          return (
            <div
              key={b._id || i}
              className={cn(
                "absolute inset-0 transition-opacity duration-1000 ease-luxury motion-reduce:transition-none",
                active ? "opacity-100" : "opacity-0"
              )}
            >
              <ImageWithFallback
                fill
                src={b.image}
                alt={b.title || "Niya Bags campaign"}
                priority={i === 0}
                imgClassName={cn(b.imageClassName, active && !reducedMotion && "animate-hero-zoom")}
              />
            </div>
          );
        })}
        <div className="overlay-hero absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-onyx/85 via-onyx/40 to-transparent" />
      </div>

      {/* Copy */}
      <div className="container-x relative z-20 flex h-full items-center pb-28 pt-6 sm:pb-36">
        <div key={safeIndex} className="max-w-2xl animate-fade-up motion-reduce:animate-none">
          <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-ivory/20 bg-ivory/10 px-3.5 py-1.5 text-micro text-champagne-light backdrop-blur-md">
            <Sparkles className="size-3.5 shrink-0 text-champagne" aria-hidden="true" />
            <span className="truncate">{banner.subtitle || "Artisanal luxury leather"}</span>
          </span>

          <h1 className="text-display mt-4 text-ivory sm:mt-5">
            {banner.title || "Timeless silhouettes, handcrafted artistry"}
          </h1>

          {supportingCopy && (
            <p className="mt-4 max-w-lg text-body text-ivory/80 max-sm:line-clamp-2 sm:mt-5 sm:text-lead">
              {supportingCopy}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <Link to={banner.linkUrl || "/shop"} className="btn btn-ivory btn-luxury btn-lg max-sm:h-12 max-sm:w-full">
              <ShoppingBag aria-hidden="true" />
              <span>Shop the collection</span>
            </Link>
            <Link to="/shop" className="btn btn-outline-ivory btn-lg max-sm:h-12 max-sm:w-full">
              <span>Explore the atelier</span>
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      {/* Slide controls */}
      {count > 1 && (
        <div className="absolute inset-x-0 bottom-[6.25rem] z-20 sm:bottom-28">
          <div className="container-x flex items-end justify-between gap-6">
            <nav aria-label="Hero slides" className="flex items-center gap-5 sm:gap-7">
              {banners.map((b, i) => {
                const active = i === safeIndex;
                return (
                  <button
                    key={b._id || i}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Go to slide ${i + 1} of ${count}`}
                    aria-current={active ? "true" : undefined}
                    className="-m-2 flex items-center gap-2.5 rounded-full p-2 text-ivory/60 transition-colors hover:text-ivory aria-[current=true]:text-ivory"
                  >
                    <span className="font-serif text-sm tabular-nums leading-none sm:text-base">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "relative h-0.5 overflow-hidden rounded-full bg-ivory/25 transition-[width] duration-500 ease-luxury",
                        active ? "w-10 sm:w-14" : "w-4 sm:w-6"
                      )}
                    >
                      {active && (
                        <span
                          key={`${safeIndex}-${cycle}`}
                          className="absolute inset-y-0 left-full w-[200%] bg-champagne"
                          style={
                            reducedMotion
                              ? { transform: "translateX(-50%)" } // static, fully filled
                              : {
                                  animation: `marquee ${AUTOPLAY_MS}ms linear forwards`,
                                  animationPlayState: paused ? "paused" : "running",
                                }
                          }
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="hidden items-center gap-2 md:flex">
              <button
                type="button"
                onClick={prev}
                aria-label="Previous slide"
                className="icon-btn size-11 border border-ivory/25 bg-ivory/10 text-ivory backdrop-blur-md hover:bg-ivory/20 hover:text-ivory"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next slide"
                className="icon-btn size-11 border border-ivory/25 bg-ivory/10 text-ivory backdrop-blur-md hover:bg-ivory/20 hover:text-ivory"
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Slide {safeIndex + 1} of {count}: {banner.title}
      </p>

      {/* Craft ticker — bottom padding leaves room for the trust card that overlaps the hero */}
      <div className="absolute inset-x-0 bottom-0 z-10 border-t border-ivory/10 bg-onyx/70 pb-14 pt-3 text-ivory backdrop-blur-sm sm:pb-16 sm:pt-3.5">
        <Marquee>
          {MARQUEE_ITEMS.map((item) => (
            <React.Fragment key={item}>
              <span className="text-micro whitespace-nowrap text-ivory/85">{item}</span>
              <span className="text-[8px] text-champagne" aria-hidden="true">
                ◆
              </span>
            </React.Fragment>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

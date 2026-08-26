import { useEffect, useState } from "react";
import { REELS } from "../../data/siteContent";

/**
 * ReelsSection — Niya Reels marquee (hover pause) + click par modal preview.
 * Niyabags jaisa 9:14 cards, play button aur swipe hint.
 */
export default function ReelsSection() {
  const [active, setActive] = useState(null);

  // Modal khula → body scroll lock + Escape se band
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => e.key === "Escape" && setActive(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active]);

  if (!REELS.length) return null;

  // Seamless loop ke liye list double
  const items = [...REELS, ...REELS];

  return (
    <section className="mx-auto max-w-7xl overflow-hidden px-4 py-16 sm:px-6">
      <div className="mb-8 text-center">
        <p className="eyebrow mb-2">Follow the Story</p>
        <h2 className="section-title">Niya Reels</h2>
        <p className="mt-2 text-xs" style={{ color: "var(--ink-muted)" }}>
          A closer look at the world of Niya.
        </p>
      </div>

      <div className="relative overflow-hidden">
        <div className="marquee-track flex w-max gap-3">
          {items.map((reel, index) => (
            <button
              key={`${reel.id}-${index}`}
              type="button"
              onClick={() => setActive(reel)}
              className="group relative aspect-9/14 w-45 shrink-0 overflow-hidden text-left sm:w-55"
            >
              <img
                src={reel.image}
                alt={reel.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(10,19,19,0.72), transparent 45%)",
                }}
              />
              <span className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[11px] shadow">
                ▶
              </span>
              <span
                className="font-display absolute bottom-4 left-4 right-4 text-sm text-white"
                style={{ color: "#fff" }}
              >
                {reel.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      <p
        className="mt-3 text-center text-[9px] uppercase tracking-[0.15em] md:hidden"
        style={{ color: "var(--ink-faint)" }}
      >
        Swipe to explore →
      </p>

      {/* Preview modal */}
      {active && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center px-5 backdrop-blur-sm"
          style={{ background: "rgba(6,12,12,0.8)" }}
          onClick={() => setActive(null)}
        >
          <div
            className="relative h-[78vh] w-full max-w-97.5 overflow-hidden"
            style={{ background: "#000" }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={active.image}
              alt={active.title}
              className="h-full w-full object-cover"
            />
            <span
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.7), transparent 40%)",
              }}
            />
            <button
              type="button"
              aria-label="Close preview"
              onClick={() => setActive(null)}
              className="icon-btn absolute right-4 top-4 h-8! w-8! bg-white/90!"
              style={{ color: "#101d1d" }}
            >
              ✕
            </button>
            <div className="absolute bottom-6 left-5 right-5">
              <p className="font-display text-xl" style={{ color: "#fff" }}>
                {active.title}
              </p>
              <p
                className="mt-1 text-[9px] uppercase tracking-[0.15em]"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Niya Bags
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

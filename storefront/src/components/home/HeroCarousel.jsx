import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { fetchBanners } from "../../features/banners/bannersSlice";
import { HERO_SLIDES } from "../../data/siteContent";
import { getAssetUrl } from "../../utils/assetUrl";

/**
 * HeroCarousel — admin panel ke real banners (GET /api/banners) se chalta hai.
 * Banners na milein ya API fail ho toh static HERO_SLIDES fallback —
 * UI kabhi break nahi hoti. Auto-advance 5.5s + dots.
 */
export default function HeroCarousel() {
  const dispatch = useDispatch();
  const banners = useSelector((s) => s.banners.banners);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    dispatch(fetchBanners());
  }, [dispatch]);

  // Backend banners → slides (sirf active + image wale)
  const bannerSlides = useMemo(
    () =>
      banners
        .filter((b) => b.isActive !== false && b.image)
        .map((b) => ({
          id: b._id,
          image: getAssetUrl(b.image),
          title: b.title,
          subtitle: b.subtitle || "",
          buttonText: "Shop Collection",
          buttonLink: b.linkUrl || "/shop",
        })),
    [banners],
  );

  // Real banners available → wahi, warna static fallback
  const slides = bannerSlides.length ? bannerSlides : HERO_SLIDES;

  // Slides change hone par index clamp (banners late aaye toh crash na ho)
  const safeIndex = Math.min(current, slides.length - 1);

  // Auto-advance — jab tak 1 se zyada slides hon
  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(
      () => setCurrent((i) => (i + 1) % slides.length),
      5500,
    );
    return () => clearInterval(timer);
  }, [slides.length]);

  // Empty fallback — gradient banner
  if (!slides.length) {
    return (
      <section
        className="flex min-h-105 items-center justify-center"
        style={{ background: "var(--bg-deep)" }}
      />
    );
  }

  const slide = slides[safeIndex];

  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: "min(78vh, 640px)" }}
    >
      {/* Slides — crossfade */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === safeIndex ? 1 : 0 }}
          aria-hidden={i !== safeIndex}
        >
          <img
            src={s.image}
            alt={String(s.title).replace("\n", " ")}
            loading={i === 0 ? "eager" : "lazy"}
            className="h-full w-full object-cover"
            style={{ background: "var(--bg-raised)" }}
          />
        </div>
      ))}

      {/* Readability gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(10,19,19,0.92) 0%, rgba(10,19,19,0.62) 45%, rgba(10,19,19,0.12) 100%)",
        }}
      />

      <div
        className="relative mx-auto flex max-w-7xl items-end px-4 pb-14 pt-28 sm:px-6 md:pb-20"
        style={{ minHeight: "min(78vh, 640px)" }}
      >
        <div className="max-w-xl">
          <p className="eyebrow mb-4">The Niya Edit</p>
          <h1
            className="font-display font-medium leading-[1.02]"
            style={{
              fontSize: "clamp(40px, 6vw, 68px)",
              color: "#f2efe7",
              whiteSpace: "pre-line",
            }}
          >
            {slide.title}
          </h1>
          {slide.subtitle && (
            <p
              className="mt-5 max-w-md text-sm leading-relaxed sm:text-base"
              style={{ color: "rgba(242,239,231,0.88)" }}
            >
              {slide.subtitle}
            </p>
          )}
          <Link
            to={slide.buttonLink}
            className="btn btn-accent mt-8 rounded-full!"
          >
            {slide.buttonText} →
          </Link>
        </div>
      </div>

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === safeIndex ? "true" : undefined}
              onClick={() => setCurrent(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === safeIndex ? 32 : 8,
                background:
                  i === safeIndex ? "var(--accent)" : "rgba(255,255,255,0.55)",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

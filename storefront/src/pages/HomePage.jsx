import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../features/products/productsSlice";
import HeroCarousel from "../components/home/HeroCarousel";
import CategorySection from "../components/home/CategorySection";
import ProductSection from "../components/home/ProductSection";
import FeaturesMarquee from "../components/home/FeaturesMarquee";
import CampaignBanner from "../components/home/CampaignBanner";
import ReelsSection from "../components/home/ReelsSection";
import CraftsmanshipSection from "../components/home/CraftsmanshipSection";
import TestimonialsSection from "../components/home/TestimonialsSection";
import NewsletterSection from "../components/home/NewsletterSection";
import { SpinnerIcon } from "../components/common/Icons";


export default function HomePage() {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.products);

  useEffect(() => {
    // Home ke liye ek bada pool — sections isi se derive hote hain
    dispatch(fetchProducts({ limit: 100, page: 1 }));
  }, [dispatch]);

  const featured = useMemo(
    () =>
      products
        .filter(
          (p) =>
            p.discountPrice &&
            p.discountPrice > 0 &&
            p.discountPrice < p.price,
        )
        .sort(
          (a, b) =>
            (b.price - b.discountPrice) / b.price -
            (a.price - a.discountPrice) / a.price,
        )
        .slice(0, 4),
    [products],
  );

  const bestSellers = useMemo(
    () =>
      [...products]
        .sort(
          (a, b) =>
            (b.numOfReviews || 0) - (a.numOfReviews || 0) ||
            (b.averageRating || 0) - (a.averageRating || 0),
        )
        .slice(0, 4),
    [products],
  );

  const newArrivals = useMemo(
    () =>
      [...products]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4),
    [products],
  );

  if (loading && !products.length) {
    return (
      <div className="flex items-center justify-center py-40">
        <SpinnerIcon size={30} style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  return (
    <>
      {/* Niyabags order: Hero → Categories → Product sections → Marquee →
          Campaign → Reels → Craftsmanship → Testimonials → Newsletter */}
      <HeroCarousel />
      <CategorySection />

      <ProductSection
        eyebrow="Curated for You"
        title="Featured Pieces"
        subtitle="Timeless silhouettes crafted with intention, designed to become part of your everyday story."
        products={featured}
        viewAllTo="/shop?collection=featured"
      />

      <ProductSection
        eyebrow="Most Loved"
        title="Best Sellers"
        subtitle="Discover the pieces our customers love most, chosen for their timeless appeal and everyday elegance."
        products={bestSellers}
        viewAllTo="/shop?collection=best"
      />

      <ProductSection
        eyebrow="Just In"
        title="New Arrivals"
        subtitle="Explore the latest silhouettes and refined designs created to bring a fresh touch to your collection."
        products={newArrivals}
        viewAllTo="/shop?collection=new"
      />

      {/* Benefits marquee strip */}
      <div className="mb-10 mt-2">
        <FeaturesMarquee />
      </div>

      {/* Dark editorial campaign banner */}
      <CampaignBanner />

      {/* Reels marquee + preview modal */}
      <ReelsSection />

      {/* The Art of Craftsmanship — stats ke saath */}
      <CraftsmanshipSection />

      {/* Customer reviews */}
      <TestimonialsSection />

      {/* Newsletter capture */}
      <NewsletterSection />
    </>
  );
}

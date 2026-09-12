import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Award, CheckCircle2, ShoppingBag, Sparkles } from "lucide-react";
import { api } from "../lib/api";
import ProductCard from "../components/product/ProductCard";
import QuickViewModal from "../components/product/QuickViewModal";
import ProductCardSkeleton from "../components/product/ProductCardSkeleton";
import SectionHeading from "../components/common/SectionHeading";
import Reveal from "../components/common/Reveal";
import TrustStrip from "../components/common/TrustStrip";
import EmptyState from "../components/common/EmptyState";
import RatingStars from "../components/common/RatingStars";
import ImageWithFallback from "../components/common/ImageWithFallback";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import usePageTitle from "../hooks/usePageTitle";
import { buildShopSearch, clampText, cn } from "../lib/utils";
import HomeHeroCarousel from "./home-HeroCarousel";

/* ------------------------------------------------------------------ */
/* Static content                                                      */
/* ------------------------------------------------------------------ */

// Curated hero fallback (used when no banner is positioned as "hero")
const DEFAULT_HERO_BANNERS = [
  {
    _id: "default-1",
    title: "Handcrafted silhouettes, timeless artistry",
    subtitle: "Atelier Spring / Summer collection",
    image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?q=80&w=1600&auto=format&fit=crop",
    imageClassName: "object-[50%_68%]",
    linkUrl: "/shop",
  },
  {
    _id: "default-2",
    title: "Full-grain Italian leather, cut by hand",
    subtitle: "For discerning individuals",
    image: "https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?q=80&w=1600&auto=format&fit=crop",
    imageClassName: "object-[50%_62%]",
    linkUrl: "/shop?gender=Women",
  },
  {
    _id: "default-3",
    title: "The urban commute & travel edit",
    subtitle: "Reinforced weekenders & laptop folios",
    image: "https://images.unsplash.com/photo-1524498250077-390f9e378fc0?q=80&w=1600&auto=format&fit=crop",
    imageClassName: "object-[50%_40%]",
    linkUrl: "/shop?gender=Men",
  },
];

const HERO_COPY =
  "Full-grain leather bags cut and stitched by hand in small batches — made to move from boardroom to weekend and to age beautifully along the way.";

// Key silhouettes for first-time customers (fallback when categories have no imagery)
const SILHOUETTES = [
  {
    name: "Totes & Shoppers",
    subtitle: "Spacious everyday elegance",
    filterParam: "search=Tote",
    image: "https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?q=80&w=600&auto=format&fit=crop",
  },
  {
    name: "Crossbody & Slings",
    subtitle: "Hands-free metropolitan ease",
    filterParam: "search=Crossbody",
    image: "https://images.unsplash.com/photo-1575032617751-6ddec2089882?q=80&w=600&auto=format&fit=crop",
  },
  {
    name: "Weekenders & Duffels",
    subtitle: "Enduring travel companions",
    filterParam: "search=Duffel",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600&auto=format&fit=crop",
  },
  {
    name: "Laptop Folios",
    subtitle: "Quilted & padded tech luxury",
    filterParam: "search=Sleeve",
    image: "https://images.unsplash.com/photo-1628149455678-16f37bc392f4?q=80&w=600&auto=format&fit=crop",
  },
  {
    name: "Wallets & Small Goods",
    subtitle: "Compact RFID-shielded leather",
    filterParam: "search=Wallet",
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=600&auto=format&fit=crop",
  },
];

const PRODUCT_TABS = [
  { value: "all", label: "All pieces" },
  { value: "bestsellers", label: "Best sellers" },
  { value: "new", label: "New season" },
  { value: "sale", label: "Privilege" },
];

const CRAFT_STATS = [
  { value: "100%", label: "Natural full-grain hide" },
  { value: "72 hrs", label: "Bench crafting time" },
  { value: "Solid brass", label: "Rust-proof cast hardware" },
  { value: "3 years", label: "Artisanal stitch warranty" },
];

const GENDER_TILES = [
  {
    gender: "Women",
    eyebrow: "Fluid elegance",
    title: "Women's atelier",
    copy: "Structured totes, sculptural crescent slings and evening clutches shaped with soft organic curves.",
    cta: "Shop women",
    image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?q=80&w=1000&auto=format&fit=crop",
    imageClassName: "object-[50%_60%]",
  },
  {
    gender: "Men",
    eyebrow: "Purpose & endurance",
    title: "Men's collection",
    copy: "Heavy-duty weekender duffels, padded executive folios and storm-proof crossbody messengers.",
    cta: "Shop men",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "The leather aroma and stitching quality rival European luxury houses at one-third the price. My laptop tote has held up phenomenally through daily flights.",
    author: "Ananya Deshmukh",
    role: "Architect",
    rating: 5,
    product: "Artisanal Carryall Tote",
  },
  {
    quote:
      "Superb attention to brass zipper details and edge finishing. The weekender duffel feels indestructible and looks even better after several months of travel.",
    author: "Rohan Varma",
    role: "Design Director",
    rating: 5,
    product: "Monsoon Proof Weekender",
  },
  {
    quote:
      "Minimalist, sophisticated and functional. Support was extraordinarily prompt when I needed to exchange colour variants. Highly recommended.",
    author: "Priyanka Mehta",
    role: "Creative Strategist",
    rating: 5,
    product: "Saddle Crossbody Sling",
  },
];

// Backend banner positions → home page slots ("after-products" is the legacy name for the mid-page slot)
const BANNER_SLOTS = {
  hero: ["hero"],
  afterHero: ["after-hero"],
  midPage: ["mid-page", "after-products"],
  bottom: ["bottom"],
};

const SECTION = "section-tight lg:py-16";

const bySortOrder = (a, b) => (Number(a?.sortOrder) || 0) - (Number(b?.sortOrder) || 0);

function pickBanners(list, positions) {
  return list.filter((b) => b && positions.includes(b.position)).sort(bySortOrder);
}

/* ------------------------------------------------------------------ */
/* Page-local blocks                                                   */
/* ------------------------------------------------------------------ */

function PromoBand({ banner, tone = "onyx", reverse = false, eyebrow = "Featured edit" }) {
  if (!banner) return null;
  const dark = tone === "onyx";
  return (
    <Reveal as="section" className={SECTION}>
      <div className="container-x">
        <div
          className={cn(
            "grid overflow-hidden rounded-3xl lg:grid-cols-2",
            dark ? "surface-onyx" : "surface-card"
          )}
        >
          <div className={cn("relative aspect-[16/10] lg:aspect-auto lg:min-h-[420px]", reverse && "lg:order-2")}>
            <ImageWithFallback fill src={banner.image} alt={banner.title || "Featured banner"} />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-onyx/60 to-transparent lg:hidden" aria-hidden="true" />
          </div>
          <div className="flex flex-col justify-center gap-5 p-7 sm:p-12 lg:p-16">
            <span className={cn("flex items-center gap-3 text-micro", dark ? "text-champagne" : "text-gold-ink")}>
              <span className="inline-block h-px w-7 bg-champagne" aria-hidden="true" />
              {eyebrow}
            </span>
            <h2 className={cn("text-h2", dark ? "text-ivory" : "text-foreground")}>{banner.title}</h2>
            {banner.subtitle && (
              <p className={cn("max-w-prose text-body", dark ? "text-ivory/75" : "text-ink-muted")}>{banner.subtitle}</p>
            )}
            <div className="pt-1">
              <Link
                to={banner.linkUrl || "/shop"}
                className={cn("btn btn-luxury", dark ? "btn-ivory" : "btn-primary")}
              >
                <span>Discover the edit</span>
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function CategoryTile({ tile, className }) {
  return (
    <Link
      to={tile.to}
      className={cn(
        "group relative block overflow-hidden rounded-2xl bg-surface-2 shadow-soft transition-shadow duration-500 hover:shadow-lift focus-visible:outline-offset-4",
        className
      )}
    >
      <ImageWithFallback
        src={tile.image}
        alt={tile.name}
        ratio="4/5"
        imgClassName="transition-transform duration-700 ease-luxury group-hover:scale-105 motion-reduce:transition-none"
      />
      <div className="overlay-photo absolute inset-0" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-ivory sm:p-5">
        <div className="min-w-0">
          <span className="text-micro text-champagne-light">Atelier shape</span>
          <h3 className="mt-1 text-h4 text-ivory sm:text-h3">{tile.name}</h3>
          {tile.subtitle && <p className="mt-1 line-clamp-1 text-small text-ivory/70">{tile.subtitle}</p>}
        </div>
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-ivory/25 bg-ivory/10 text-ivory backdrop-blur-md transition-colors duration-300 group-hover:bg-champagne group-hover:text-onyx"
          aria-hidden="true"
        >
          <ArrowRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}

function CollectionTile({ collection, large = false }) {
  return (
    <Link
      to={buildShopSearch({ collections: collection._id })}
      className={cn(
        "group relative block overflow-hidden rounded-3xl bg-surface-2 shadow-soft transition-shadow duration-500 hover:shadow-lift focus-visible:outline-offset-4",
        large ? "aspect-[4/3] lg:row-span-2 lg:aspect-auto lg:h-full" : "aspect-[16/10] sm:aspect-[16/9]"
      )}
    >
      <ImageWithFallback
        fill
        src={collection.image}
        alt={collection.name}
        imgClassName="transition-transform duration-700 ease-luxury group-hover:scale-105 motion-reduce:transition-none"
      />
      <div className="overlay-photo absolute inset-0" aria-hidden="true" />
      <div className={cn("absolute inset-x-0 bottom-0 text-ivory", large ? "p-6 sm:p-8 lg:p-10" : "p-5 sm:p-7")}>
        <span className="text-micro text-champagne-light">Collection</span>
        <h3 className={cn("mt-1.5 text-ivory", large ? "text-h2" : "text-h3")}>{collection.name}</h3>
        {collection.description && (
          <p className={cn("mt-2 max-w-md text-small text-ivory/75", !large && "hidden sm:block")}>
            {clampText(collection.description, large ? 140 : 90)}
          </p>
        )}
        <span className="link-underline mt-4 inline-flex items-center gap-1.5 text-micro text-ivory">
          <span>Explore the collection</span>
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  usePageTitle(null);

  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);

  // Quick view modal state
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const [bannersRes, collectionsRes, productsRes, categoriesRes] = await Promise.all([
          api.get("/banners", { params: { page: "home" } }).catch(() => ({ data: { banners: [] } })),
          api.get("/collections").catch(() => ({ data: { collections: [] } })),
          api.get("/products", { params: { limit: 16, isActive: "true" } }).catch(() => ({ data: { products: [] } })),
          api.get("/categories").catch(() => ({ data: { categories: [] } })),
        ]);

        setBanners(bannersRes.data?.banners || []);

        const allCols = collectionsRes.data?.collections || [];
        const homeCols = allCols.filter((c) => c.showOnHomePage);
        setCollections(homeCols.length > 0 ? homeCols : allCols.slice(0, 3));

        setAllProducts(productsRes.data?.products || []);
        setCategories(categoriesRes.data?.categories || []);
      } catch (err) {
        console.error("Home page data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Banner slots — only "hero" banners drive the carousel; other positions get their own band.
  const heroBanners = useMemo(() => {
    const hero = pickBanners(banners, BANNER_SLOTS.hero);
    return hero.length > 0 ? hero : DEFAULT_HERO_BANNERS;
  }, [banners]);
  const promo = useMemo(
    () => ({
      afterHero: pickBanners(banners, BANNER_SLOTS.afterHero)[0] || null,
      midPage: pickBanners(banners, BANNER_SLOTS.midPage)[0] || null,
      bottom: pickBanners(banners, BANNER_SLOTS.bottom)[0] || null,
    }),
    [banners]
  );

  // Shop-by-category tiles: active root categories with imagery, else the curated silhouettes.
  const categoryTiles = useMemo(() => {
    const roots = categories
      .filter((c) => c && c.isActive !== false && Number(c.level ?? (c.parentId ? 1 : 0)) === 0)
      .sort(bySortOrder);
    if (roots.some((c) => c.image)) {
      return roots.slice(0, 5).map((c) => ({
        id: c._id,
        name: c.name,
        subtitle: c.description,
        image: c.image,
        to: buildShopSearch({ categoryId: c._id }),
      }));
    }
    return SILHOUETTES.map((s) => ({
      id: s.name,
      name: s.name,
      subtitle: s.subtitle,
      image: s.image,
      to: `/shop?${s.filterParam}`,
    }));
  }, [categories]);
  const showViewAllTile = categoryTiles.length < 5;

  const handleOpenQuickView = (product) => {
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  };

  // Filter products by active tab
  const filteredProducts = useMemo(() => {
    if (activeTab === "bestsellers") {
      return [...allProducts].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)).slice(0, 8);
    }
    if (activeTab === "new") {
      return [...allProducts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
    }
    if (activeTab === "sale") {
      return allProducts.filter((p) => p.discountPrice && p.discountPrice < p.price).slice(0, 8);
    }
    return allProducts.slice(0, 8);
  }, [allProducts, activeTab]);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) return;
    const subEmail = newsletterEmail;
    setNewsletterSubscribed(true);
    setNewsletterEmail("");

    try {
      await api.post("/inquiries", {
        name: "VIP Connoisseur Subscriber",
        email: subEmail.trim().toLowerCase(),
        subject: "VIP Newsletter Subscription",
        message: "Customer joined the Niya Bags VIP Connoisseur Circle from the home page.",
      });
    } catch (err) {
      console.warn("VIP newsletter inquiry submission error:", err);
    }
  };

  return (
    <div className="pb-4 sm:pb-8">
      {/* 1. HERO */}
      <HomeHeroCarousel banners={heroBanners} supportingCopy={HERO_COPY} />

      {/* 2. TRUST STRIP — overlaps the hero */}
      <div className="container-x relative z-20 -mt-10">
        <Reveal className="surface-card p-4 sm:p-6">
          <TrustStrip variant="grid" />
        </Reveal>
      </div>

      {/* 3. AFTER-HERO PROMO */}
      <PromoBand banner={promo.afterHero} tone="onyx" eyebrow="Just landed" />

      {/* 4. SHOP BY CATEGORY */}
      <Reveal as="section" className={SECTION}>
        <div className="container-x">
          <SectionHeading
            align="left"
            eyebrow="Find your shape"
            title="Shop by silhouette"
            description="Timeless shapes, crafted for every rhythm of your day — from boardroom to boarding gate."
            actionLabel="View all silhouettes"
            actionTo="/shop"
          />
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 no-scrollbar sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-5">
            {categoryTiles.map((tile, i) => (
              <Reveal key={tile.id} delay={i * 60} className="basis-[68%] shrink-0 snap-start sm:basis-[44%] md:basis-auto">
                <CategoryTile tile={tile} />
              </Reveal>
            ))}
            {showViewAllTile && (
              <Reveal delay={categoryTiles.length * 60} className="basis-[68%] shrink-0 snap-start sm:basis-[44%] md:basis-auto">
                <Link
                  to="/shop"
                  className="group flex aspect-[4/5] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-line-strong bg-surface-2 p-6 text-center transition-colors duration-300 hover:border-champagne hover:bg-gold-soft"
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight className="size-5" aria-hidden="true" />
                  </span>
                  <span className="text-h4 text-foreground">View all bags</span>
                  <span className="text-small text-ink-muted">Every silhouette in the atelier</span>
                </Link>
              </Reveal>
            )}
          </div>
        </div>
      </Reveal>

      {/* 5. COLLECTIONS */}
      {collections.length > 0 && (
        <Reveal as="section" className={SECTION}>
          <div className="container-x">
            <SectionHeading
              align="left"
              eyebrow="Curated edits"
              title="Collections of the season"
              description="Thoughtfully grouped pieces — from bestsellers to new arrivals — so you can find the right bag faster."
              actionLabel="Browse the atelier"
              actionTo="/shop"
            />
            <div className="grid gap-4 sm:gap-5 lg:grid-cols-[1.35fr_1fr] lg:grid-rows-2">
              {collections.slice(0, 3).map((col, i) => (
                <CollectionTile key={col._id || col.slug || i} collection={col} large={i === 0} />
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* 6. SIGNATURE PIECES */}
      <Reveal as="section" className={SECTION}>
        <div className="container-x">
          <div className="mb-8 flex flex-col gap-6 sm:mb-10 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              align="left"
              eyebrow="Signature pieces"
              title="The atelier edit"
              description="Handpicked from the current collection — the pieces our customers keep coming back for."
              className="mb-0"
            />
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full shrink-0 md:w-auto">
              <div className="-mx-4 overflow-x-auto px-4 no-scrollbar sm:-mx-6 sm:px-6 md:mx-0 md:overflow-visible md:px-0">
                <TabsList
                  aria-label="Filter signature pieces"
                  className="h-auto w-max gap-1 rounded-full border border-line bg-surface-2 p-1 group-data-horizontal/tabs:h-auto"
                >
                  {PRODUCT_TABS.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="h-9 flex-none rounded-full border-transparent px-4 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-muted shadow-none transition-colors hover:text-foreground data-active:bg-primary data-active:text-primary-foreground data-active:shadow-none group-data-[variant=default]/tabs-list:data-active:shadow-none dark:data-active:border-transparent dark:data-active:bg-primary dark:data-active:text-primary-foreground"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Loading signature pieces">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="This edit is being prepared"
              description="Our next pieces are on the bench. In the meantime, discover every silhouette in the main shop."
              action={{ label: "Browse all bags", to: "/shop" }}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product._id} product={product} onQuickView={handleOpenQuickView} />
              ))}
            </div>
          )}

          <div className="mt-10 text-center sm:mt-12">
            <Link to="/shop" className="btn btn-primary btn-luxury btn-lg">
              <span>View the full catalogue</span>
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Reveal>

      {/* 7. MID-PAGE PROMO */}
      <PromoBand banner={promo.midPage} tone="ivory" reverse eyebrow="Featured edit" />

      {/* 8. CRAFT STORY */}
      <Reveal as="section" className={SECTION}>
        <div className="container-x">
          <div className="surface-onyx grid overflow-hidden rounded-3xl lg:grid-cols-2">
            <div className="relative min-h-[300px] sm:min-h-[380px] lg:min-h-[560px]">
              <ImageWithFallback
                fill
                src="https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1200&auto=format&fit=crop"
                alt="Artisan hand-stitching a leather bag at the Niya workbench"
                imgClassName="opacity-90"
              />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-onyx to-transparent lg:hidden" aria-hidden="true" />
            </div>
            <div className="flex flex-col justify-center p-7 sm:p-12 lg:p-16">
              <span className="flex items-center gap-2 text-micro text-champagne">
                <Award className="size-4" aria-hidden="true" />
                The Niya standard
              </span>
              <h2 className="text-h2 mt-4 text-ivory">Slow-crafted in limited small batches</h2>
              <p className="mt-5 max-w-prose text-body text-ivory/75">
                Unlike mass factory production, every Niya bag is cut from vegetable-tanned full-grain hides. Our craftsmen bevel, burnish and paint each raw edge by hand, then lock every stress point with solid cast-brass hardware.
              </p>
              <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-ivory/15 pt-7">
                {CRAFT_STATS.map((stat) => (
                  <div key={stat.label} className="flex flex-col">
                    <dt className="order-2 mt-1 text-small text-ivory/65">{stat.label}</dt>
                    <dd className="font-serif text-2xl font-semibold text-champagne sm:text-3xl">{stat.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-8">
                <Link to="/shop" className="btn btn-ivory btn-luxury">
                  <span>Experience the craft</span>
                  <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* 9. WOMEN / MEN */}
      <Reveal as="section" className={SECTION}>
        <div className="container-x">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {GENDER_TILES.map((tile) => (
              <Link
                key={tile.gender}
                to={buildShopSearch({ gender: tile.gender })}
                className="group relative block overflow-hidden rounded-3xl bg-surface-2 shadow-soft transition-shadow duration-500 hover:shadow-lift focus-visible:outline-offset-4"
              >
                <div className="relative aspect-[16/10] sm:aspect-[4/3]">
                  <ImageWithFallback
                    fill
                    src={tile.image}
                    alt={`${tile.title} — Niya Bags`}
                    imgClassName={cn(
                      "transition-transform duration-700 ease-luxury group-hover:scale-105 motion-reduce:transition-none",
                      tile.imageClassName
                    )}
                  />
                </div>
                <div className="overlay-photo absolute inset-0" aria-hidden="true" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-ivory sm:p-8">
                  <span className="text-micro text-champagne-light">{tile.eyebrow}</span>
                  <h3 className="mt-2 font-serif text-2xl font-semibold text-ivory transition-colors duration-300 group-hover:text-champagne-light sm:text-3xl">
                    {tile.title}
                  </h3>
                  <p className="mt-2 max-w-sm text-small text-ivory/75">{tile.copy}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-micro text-ivory transition-transform duration-300 group-hover:translate-x-1">
                    <span>{tile.cta}</span>
                    <ArrowRight className="size-3.5 text-champagne" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Reveal>

      {/* 10. TESTIMONIALS */}
      <Reveal as="section" className={SECTION}>
        <div className="container-x">
          <SectionHeading
            eyebrow="Enduring impressions"
            title="Loved by connoisseurs"
            description="Authentic experiences from owners carrying Niya bags across 20+ countries."
          />
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.author} delay={i * 80} className="h-full">
                <figure className="surface-card flex h-full flex-col p-6 sm:p-8">
                  <RatingStars value={t.rating} size="sm" label={`Rated ${t.rating} out of 5`} />
                  <blockquote className="mt-4 flex-1 font-serif text-lg leading-relaxed text-foreground">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-6 border-t border-line pt-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-small font-semibold text-foreground">{t.author}</p>
                        <p className="text-small text-ink-muted">{t.role}</p>
                      </div>
                      <span className="pill pill-gold shrink-0">
                        <CheckCircle2 className="size-3" aria-hidden="true" />
                        Verified buyer
                      </span>
                    </div>
                    <p className="mt-3 text-micro text-ink-soft">Purchased · {t.product}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </Reveal>

      {/* 11. BOTTOM PROMO */}
      <PromoBand banner={promo.bottom} tone="onyx" eyebrow="Before you go" />

      {/* 12. NEWSLETTER */}
      <Reveal as="section" className={SECTION}>
        <div className="container-x">
          <div className="surface-card mx-auto max-w-3xl p-7 text-center sm:p-12 lg:p-16">
            <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-gold-soft text-gold-ink">
              <Sparkles className="size-5" aria-hidden="true" />
            </div>
            <span className="eyebrow mb-3 block">Private circle</span>
            <h2 className="text-h2 text-foreground">Join the Niya Connoisseur Circle</h2>
            <p className="mx-auto mt-3 max-w-md text-body text-ink-muted">
              Private invitations to limited capsule drops and showroom events, plus a 10% welcome privilege on your first handcrafted piece.
            </p>

            {newsletterSubscribed ? (
              <div
                role="status"
                className="mx-auto mt-8 inline-flex max-w-full items-center gap-2 rounded-full bg-success-soft px-5 py-3 text-small font-semibold text-success"
              >
                <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                <span>Welcome to the Circle. Use code NIYA10 at checkout!</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="mx-auto mt-8 max-w-md">
                <label htmlFor="home-newsletter-email" className="sr-only">
                  Email address
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="home-newsletter-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="input-luxury flex-1"
                  />
                  <button type="submit" className="btn btn-primary btn-luxury shrink-0">
                    Join the circle
                  </button>
                </div>
                <p className="field-hint mt-3">No noise — a few considered letters a season. Unsubscribe anytime.</p>
              </form>
            )}
          </div>
        </div>
      </Reveal>

      {/* Quick view modal */}
      <QuickViewModal product={quickViewProduct} isOpen={isQuickViewOpen} onClose={() => setIsQuickViewOpen(false)} />
    </div>
  );
}

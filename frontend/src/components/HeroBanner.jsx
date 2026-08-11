import { Link } from "react-router-dom";

function HeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 shadow-2xl">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-20 right-20 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[64px_64px]" />

      <div className="relative z-10 px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left Content */}
          <div>
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-indigo-300 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Premium Drops • Fresh Stock • Fast Delivery
            </div>

            {/* Heading */}
            <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              Shop Vibrant
              <span className="block bg-linear-to-r from-indigo-400 via-violet-400 to-amber-400 bg-clip-text text-transparent">
                Modern Essentials
              </span>
              Built for You.
            </h1>

            {/* Description */}
            <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg">
              Discover a polished shopping experience with featured products,
              smooth checkout, and a bold design built for everyone.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/signup"
                className="rounded-full bg-linear-to-r from-indigo-600 via-violet-600 to-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-105 hover:shadow-indigo-500/50"
              >
                Start Shopping →
              </Link>
              <a
                href="#featured-products"
                className="rounded-full border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Explore Products
              </a>
            </div>

            {/* Tags */}
            <div className="mt-8 flex flex-wrap gap-2">
              {[
                "✅ Secure Login",
                "📱 Responsive UI",
                "🛒 Cart Ready",
                "⚡ Fast Checkout",
              ].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right Content - Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Card 1 */}
            <div className="group rounded-2xl border border-white/10 bg-linear-to-br from-indigo-600/20 to-violet-600/20 p-6 backdrop-blur-sm transition hover:border-indigo-400/30 hover:from-indigo-600/30 hover:to-violet-600/30">
              <div className="mb-3 text-3xl">🎯</div>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                Trending Category
              </p>
              <h3 className="mt-2 text-xl font-black text-white">
                Smart Accessories
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Minimal design, strong product focus, and a premium feel for
                modern living.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-indigo-400">
                Shop Now
                <span className="transition group-hover:translate-x-1">→</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group rounded-2xl border border-amber-200/20 bg-linear-to-br from-amber-500/10 to-orange-500/10 p-6 backdrop-blur-sm transition hover:border-amber-400/30 hover:from-amber-500/20 hover:to-orange-500/20">
              <div className="mb-3 text-3xl">🏆</div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Popular Picks
              </p>
              <h3 className="mt-2 text-xl font-black text-white">
                Best Sellers
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Top-rated products loved by thousands of happy customers
                worldwide.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-amber-400">
                View All
                <span className="transition group-hover:translate-x-1">→</span>
              </div>
            </div>

            {/* Card 3 - Full width */}
            <div className="group rounded-2xl border border-emerald-200/20 bg-linear-to-br from-emerald-500/10 to-teal-500/10 p-6 backdrop-blur-sm transition hover:border-emerald-400/30 hover:from-emerald-500/20 hover:to-teal-500/20 sm:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                    Limited Time Offer
                  </p>
                  <h3 className="mt-1 text-xl font-black text-white">
                    New Arrivals This Week 🎉
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Fresh products added daily — don't miss out!
                  </p>
                </div>
                <div className="shrink-0 rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-bold text-emerald-400">
                  New ✨
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroBanner;

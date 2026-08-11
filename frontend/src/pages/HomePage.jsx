import Navbar from "../components/Navbar";
import HeroBanner from "../components/HeroBanner";
import FeaturedProductsGrid from "../components/FeaturedProductsGrid";

function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/30 to-slate-50">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <HeroBanner />
        <FeaturedProductsGrid />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-2xl font-black">
              <span className="bg-linear-to-r from-indigo-600 via-violet-600 to-amber-500 bg-clip-text text-transparent">
                ShopSphere
              </span>
            </p>
            <p className="text-sm text-slate-500">
              © 2025 ShopSphere. All rights reserved.
            </p>
            <div className="flex gap-6">
              {["Privacy", "Terms", "Support"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-sm text-slate-500 transition hover:text-slate-900"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;

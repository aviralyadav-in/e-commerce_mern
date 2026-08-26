import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { getAssetUrl } from "../../utils/assetUrl";

/**
 * Shop by Category — Women/Men toggle (screenshot ke mutabik).
 * Category me subCategories array hota hai ["Men","Women"];
 * product counts current products list se derive hote hain.
 */
export default function CategorySection() {
  const navigate = useNavigate();
  const [gender, setGender] = useState("Women");
  const categories = useSelector((state) => state.categories.categories);
  const products = useSelector((state) => state.products.products);

  const visibleCategories = useMemo(
    () =>
      categories.filter(
        (c) => !c.subCategories?.length || c.subCategories.includes(gender),
      ),
    [categories, gender],
  );

  const countFor = (categoryId) =>
    products.filter(
      (p) =>
        p.categoryId?._id === categoryId &&
        (p.subCategory === gender || p.subCategory === "Unisex"),
    ).length;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Explore the Collection</p>
          <h2 className="section-title">Shop by Category</h2>
        </div>
        {/* Women / Men toggle */}
        <div
          className="inline-flex rounded-full p-1"
          style={{ border: "1px solid var(--border-strong)" }}
        >
          {["Women", "Men"].map((g) => (
            <button
              key={g}
              className={`chip border-transparent! ${gender === g ? "chip-active" : ""}`}
              onClick={() => setGender(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visibleCategories.map((category) => (
          <div
            key={category._id}
            className="category-tile"
            onClick={() => navigate(`/shop?category=${category.slug}`)}
          >
            {category.image ? (
              <img
                src={getAssetUrl(category.image)}
                alt={category.name}
                loading="lazy"
              />
            ) : (
              <div
                className="h-full w-full"
                style={{ background: "var(--bg-raised)" }}
              />
            )}
            <div className="absolute inset-x-0 bottom-0 z-10 p-6 text-center">
              <h3 className="font-display text-2xl font-medium text-white">
                {category.name}
              </h3>
              <p className="mt-1 text-sm text-white/70">
                {countFor(category._id)} Products
              </p>
            </div>
          </div>
        ))}
        {!visibleCategories.length && (
          <p style={{ color: "var(--ink-muted)" }}>
            No categories for {gender} yet.
          </p>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link to="/shop" className="btn btn-outline">
          View All Products
        </Link>
      </div>
    </section>
  );
}

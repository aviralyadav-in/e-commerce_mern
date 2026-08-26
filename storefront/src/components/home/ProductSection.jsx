import { Link } from "react-router";
import ProductCard from "../product/ProductCard";
import { ArrowRightIcon } from "../common/Icons";

/** Featured Pieces / Best Sellers / New Arrivals jaisa section */
export default function ProductSection({ eyebrow, title, subtitle, products, viewAllTo }) {
  if (!products?.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <p className="eyebrow mb-2">{eyebrow}</p>
          <h2 className="section-title">{title}</h2>
          {subtitle && (
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--ink-muted)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {viewAllTo && (
          <Link
            to={viewAllTo}
            className="inline-flex items-center gap-2 text-sm font-semibold"
            style={{ color: "var(--ink)" }}
          >
            View All <ArrowRightIcon size={15} style={{ color: "var(--accent)" }} />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}

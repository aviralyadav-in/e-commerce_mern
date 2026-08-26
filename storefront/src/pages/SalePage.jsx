import { useEffect } from "react";
import { Link } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../features/products/productsSlice";
import ProductCard from "../components/product/ProductCard";
import { SpinnerIcon } from "../components/common/Icons";

/**
 * SalePage — /sale dedicated discounts page (niyabags jaisa).
 * Server se onSale products, client par bhi discount verify karte hain.
 */
export default function SalePage() {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((s) => s.products);

  useEffect(() => {
    dispatch(fetchProducts({ page: 1, limit: 100, onSale: true, isActive: true }));
  }, [dispatch]);

  const saleProducts = products.filter((p) => {
    const d = Number(p.discountPrice) || 0;
    return d > 0 && d < Number(p.price);
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <header className="mb-10 text-center">
        <p className="eyebrow mb-3">On Discount</p>
        <h1 className="section-title">The Niya Sale</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm" style={{ color: "var(--ink-muted)" }}>
          Signature silhouettes at special prices — jab tak stock hai.
        </p>
      </header>

      {loading && !products.length ? (
        <div className="flex items-center justify-center py-32">
          <SpinnerIcon size={28} style={{ color: "var(--accent)" }} />
        </div>
      ) : saleProducts.length ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {saleProducts.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center">
          <p className="font-display text-2xl" style={{ color: "var(--ink-muted)" }}>
            No sale pieces right now
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--ink-faint)" }}>
            Check back soon — ya poora collection explore karo.
          </p>
          <Link to="/shop" className="btn btn-accent mt-8">
            Shop All
          </Link>
        </div>
      )}
    </div>
  );
}

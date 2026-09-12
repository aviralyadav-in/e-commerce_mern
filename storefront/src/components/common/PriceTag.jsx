import React from "react";
import { calculateDiscount, cn, formatCurrency, getSellingPrice } from "../../lib/utils";

const SIZES = {
  sm: { price: "text-sm", compare: "text-xs" },
  md: { price: "text-base", compare: "text-xs" },
  lg: { price: "text-2xl", compare: "text-sm" },
  xl: { price: "text-3xl sm:text-4xl", compare: "text-base" },
};

/**
 * Price with optional compare-at price and discount pill.
 * Pass either `product` or explicit `price` / `comparePrice`.
 */
export default function PriceTag({
  product,
  price,
  comparePrice,
  size = "md",
  showDiscount = true,
  className,
}) {
  const selling = product ? getSellingPrice(product) : Number(price) || 0;
  const compare = product ? Number(product.price) || 0 : Number(comparePrice) || 0;
  const discount = calculateDiscount(compare, selling);
  const s = SIZES[size] || SIZES.md;

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span className={cn("price text-foreground", s.price)}>{formatCurrency(selling)}</span>
      {discount > 0 && (
        <>
          <span className={cn("text-ink-soft line-through tabular-nums", s.compare)}>
            {formatCurrency(compare)}
          </span>
          {showDiscount && (
            <span className="pill pill-gold" aria-label={`${discount}% off`}>
              {discount}% off
            </span>
          )}
        </>
      )}
    </div>
  );
}

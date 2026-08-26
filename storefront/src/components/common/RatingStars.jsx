import { StarIcon } from "./Icons";

/** 5-star rating row. value: 0–5, size in px */
export default function RatingStars({ value = 0, size = 14, showValue = false }) {
  const rounded = Math.round(Number(value) || 0);
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <StarIcon
            key={i}
            size={size}
            filled={i <= rounded}
            className={i <= rounded ? "star" : "star-empty"}
          />
        ))}
      </span>
      {showValue && (
        <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
          {Number(value || 0).toFixed(1)}
        </span>
      )}
    </span>
  );
}

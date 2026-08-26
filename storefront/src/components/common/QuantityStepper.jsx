import { MinusIcon, PlusIcon } from "./Icons";

/** +/− quantity stepper with min 1, max = stock */
export default function QuantityStepper({
  value,
  onChange,
  max = 99,
  small = false,
}) {
  const btn = small ? "w-7 h-7" : "w-9 h-9";
  const clamp = (next) => Math.min(Math.max(1, next), max);
  return (
    <div
      className="inline-flex items-center rounded-full"
      style={{ border: "1px solid var(--border-strong)" }}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        className={`${btn} flex items-center justify-center rounded-full disabled:opacity-40`}
        style={{ color: "var(--ink)" }}
        disabled={value <= 1}
        onClick={() => onChange(clamp(value - 1))}
      >
        <MinusIcon size={small ? 13 : 15} />
      </button>
      <span
        className={`${small ? "w-6 text-xs" : "w-8 text-sm"} text-center font-semibold`}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        className={`${btn} flex items-center justify-center rounded-full disabled:opacity-40`}
        style={{ color: "var(--ink)" }}
        disabled={value >= max}
        onClick={() => onChange(clamp(value + 1))}
      >
        <PlusIcon size={small ? 13 : 15} />
      </button>
    </div>
  );
}

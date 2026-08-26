import React from "react";

/**
 * Segmented status filter. Options: [{ value, label, count }].
 * `value === null` is the "all" option.
 */
const SegmentedFilter = ({ options, value, onChange, className = "" }) => (
  <div className={`segmented ${className}`} role="tablist">
    {options.map((opt) => {
      const active = value === opt.value;
      return (
        <button
          key={String(opt.value)}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(opt.value)}
          className={`segmented-btn ${active ? "segmented-btn-active" : ""}`}
        >
          {opt.label}
          {typeof opt.count === "number" && (
            <span className="segmented-count">{opt.count}</span>
          )}
        </button>
      );
    })}
  </div>
);

export default SegmentedFilter;

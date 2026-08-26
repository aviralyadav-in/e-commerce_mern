import React, { useMemo, useState } from "react";
import { formatCurrency } from "../../utils/format";

/** SVG coordinate space — the chart is stretched to fit its container. */
const VB_W = 100;
const VB_H = 40;
const PAD_TOP = 3;
const PAD_BOTTOM = 3;

/**
 * Dependency-free area chart for a short daily series.
 *
 * The SVG is drawn in a fixed 100×40 view box and stretched with
 * `preserveAspectRatio="none"`; strokes use `vector-effect` so they stay an
 * even weight instead of smearing with the scale.
 */
const RevenueChart = ({ data = [], title = "Revenue", subtitle }) => {
  const [hover, setHover] = useState(null);

  const { linePath, areaPath, points, peak, total } = useMemo(() => {
    const values = data.map((d) => Number(d.value) || 0);
    const max = Math.max(...values, 1);
    const span = VB_H - PAD_TOP - PAD_BOTTOM;

    const pts = values.map((v, i) => ({
      x: data.length > 1 ? (i / (data.length - 1)) * VB_W : VB_W / 2,
      y: VB_H - PAD_BOTTOM - (v / max) * span,
      value: v,
      label: data[i]?.label,
    }));

    const line = pts
      .map(
        (p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`,
      )
      .join(" ");

    return {
      linePath: line,
      areaPath: pts.length ? `${line} L${VB_W} ${VB_H} L0 ${VB_H} Z` : "",
      points: pts,
      peak: max,
      total: values.reduce((sum, v) => sum + v, 0),
    };
  }, [data]);

  const active = hover === null ? null : points[hover];

  return (
    <div className="admin-card p-4 h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="admin-card-title">{title}</h2>
          <p className="text-[11.5px] text-(--ink-muted) mt-0.5">
            {subtitle || `Last ${data.length} days`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[17px] font-bold text-(--ink) tracking-[-0.02em] leading-none tabular-nums">
            {formatCurrency(total, { compact: true })}
          </p>
          <p className="text-[11px] text-(--ink-faint) mt-1">
            peak {formatCurrency(peak, { compact: true })}/day
          </p>
        </div>
      </div>

      <div className="relative flex-1 min-h-37.5">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1="0"
              x2={VB_W}
              y1={VB_H * f}
              y2={VB_H * f}
              stroke="var(--border)"
              strokeWidth="1"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {areaPath && <path d={areaPath} fill="url(#revenueFill)" />}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--brand)"
              strokeWidth="1.8"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {active && (
            <line
              x1={active.x}
              x2={active.x}
              y1="0"
              y2={VB_H}
              stroke="var(--brand)"
              strokeWidth="1"
              strokeOpacity="0.35"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {/* Hover targets sit above the SVG so the tooltip tracks whole days. */}
        <div
          className="absolute inset-0 flex"
          onMouseLeave={() => setHover(null)}
        >
          {points.map((p, i) => (
            <button
              key={i}
              type="button"
              className="flex-1 h-full cursor-default"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              aria-label={`${p.label}: ${formatCurrency(p.value)}`}
            />
          ))}
        </div>

        {active && (
          <>
            <span
              className="absolute w-2.5 h-2.5 rounded-full bg-(--brand) ring-2 ring-white pointer-events-none"
              style={{
                left: `${active.x}%`,
                top: `${(active.y / VB_H) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
            <div
              className="absolute z-10 px-2.5 py-1.5 rounded-sm bg-(--ink) text-white text-[11px] whitespace-nowrap pointer-events-none shadow-lg"
              style={{
                left: `${active.x}%`,
                top: 0,
                transform: `translate(${
                  active.x > 75 ? "-90%" : active.x < 25 ? "-10%" : "-50%"
                }, -4px)`,
              }}
            >
              <span className="font-semibold">
                {formatCurrency(active.value)}
              </span>
              <span className="opacity-60 ml-1.5">{active.label}</span>
            </div>
          </>
        )}
      </div>

      {points.length > 1 && (
        <div className="flex justify-between text-[10.5px] text-(--ink-faint) mt-2">
          <span>{points[0].label}</span>
          <span>{points[points.length - 1].label}</span>
        </div>
      )}
    </div>
  );
};

export default RevenueChart;

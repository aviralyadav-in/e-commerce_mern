import { useMemo, useState } from "react";
import { formatCurrency } from "../../utils/format";

/** SVG coordinate space */
const VB_W = 100;
const VB_H = 40;
const PAD_TOP = 5;
const PAD_BOTTOM = 4;

/**
 * Generate a smooth cubic Bezier spline for organic data curves.
 */
function getSmoothSpline(pts) {
  if (!pts || pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  if (pts.length === 2) {
    return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} L ${pts[1].x.toFixed(2)} ${pts[1].y.toFixed(2)}`;
  }

  let path = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? i : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 5.5;
    const cp1y = Math.min(VB_H - PAD_BOTTOM, Math.max(PAD_TOP, p1.y + (p2.y - p0.y) / 5.5));
    const cp2x = p2.x - (p3.x - p1.x) / 5.5;
    const cp2y = Math.min(VB_H - PAD_BOTTOM, Math.max(PAD_TOP, p2.y - (p3.y - p1.y) / 5.5));

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return path;
}

const RevenueChart = ({ data = [], title = "Revenue Analytics", subtitle }) => {
  const [hover, setHover] = useState(null);

  const { linePath, areaPath, points, peak, total, avg } = useMemo(() => {
    const values = data.map((d) => Number(d.value) || 0);
    const max = Math.max(...values, 100);
    const span = VB_H - PAD_TOP - PAD_BOTTOM;

    const pts = values.map((v, i) => ({
      x: data.length > 1 ? (i / (data.length - 1)) * VB_W : VB_W / 2,
      y: VB_H - PAD_BOTTOM - (v / max) * span,
      value: v,
      label: data[i]?.label,
    }));

    const smoothLine = getSmoothSpline(pts);
    const smoothArea = pts.length
      ? `${smoothLine} L ${VB_W} ${VB_H} L 0 ${VB_H} Z`
      : "";

    const sum = values.reduce((s, v) => s + v, 0);

    return {
      linePath: smoothLine,
      areaPath: smoothArea,
      points: pts,
      peak: Math.max(...values, 0),
      total: sum,
      avg: values.length ? sum / values.length : 0,
    };
  }, [data]);

  const active = hover === null ? null : points[hover];

  return (
    <div className="admin-card p-5 h-full flex flex-col justify-between">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="admin-card-title text-[15px]">{title}</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/90 dark:border-emerald-800/60 text-[10.5px] font-bold flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Performance
            </span>
          </div>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-1">
            {subtitle || `Daily sales performance (Trailing ${data.length} days)`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[22px] sm:text-[26px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-none tabular-nums">
            {formatCurrency(total, { compact: true })}
          </p>
          <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium mt-1.5">
            Avg <b className="text-slate-800 dark:text-slate-200">{formatCurrency(avg, { compact: true })}</b>/day · Peak <b className="text-indigo-600 dark:text-indigo-400 font-bold">{formatCurrency(peak, { compact: true })}</b>
          </p>
        </div>
      </div>

      <div className="relative flex-1 min-h-[175px] w-full mt-2">
        <svg
          className="absolute inset-0 w-full h-full overflow-visible"
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="revenueFillModern" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="65%" stopColor="#818cf8" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
            <filter id="smoothGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="1.2" floodColor="#6366f1" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Theme-aware soft grid lines */}
          {[0.25, 0.55, 0.85].map((f) => (
            <line
              key={f}
              x1="0"
              x2={VB_W}
              y1={VB_H * f}
              y2={VB_H * f}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800/80"
              strokeWidth="0.8"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {areaPath && <path d={areaPath} fill="url(#revenueFillModern)" />}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              className="stroke-indigo-600 dark:stroke-indigo-400"
              strokeWidth="2.4"
              strokeLinejoin="round"
              strokeLinecap="round"
              filter="url(#smoothGlow)"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {active && (
            <line
              x1={active.x}
              x2={active.x}
              y1="0"
              y2={VB_H}
              className="stroke-indigo-400 dark:stroke-indigo-300"
              strokeWidth="1.2"
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {/* Hover detection overlay */}
        <div
          className="absolute inset-0 flex z-10"
          onMouseLeave={() => setHover(null)}
        >
          {points.map((p, i) => (
            <button
              key={i}
              type="button"
              className="flex-1 h-full cursor-pointer focus:outline-none"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              aria-label={`${p.label}: ${formatCurrency(p.value)}`}
            />
          ))}
        </div>

        {/* Active Tooltip & Glowing point */}
        {active && (
          <>
            <span
              className="absolute w-3 h-3 rounded-full bg-indigo-600 dark:bg-indigo-400 ring-4 ring-indigo-300/50 dark:ring-indigo-500/40 pointer-events-none z-20 shadow-md transition-all duration-75"
              style={{
                left: `${active.x}%`,
                top: `${(active.y / VB_H) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
            <div
              className="absolute z-30 px-3 py-2 rounded-xl bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white text-[12px] whitespace-nowrap pointer-events-none shadow-xl border border-slate-700/60 dark:border-white/10"
              style={{
                left: `${active.x}%`,
                top: 0,
                transform: `translate(${
                  active.x > 75 ? "-90%" : active.x < 25 ? "-10%" : "-50%"
                }, -12px)`,
              }}
            >
              <p className="font-bold text-indigo-300 dark:text-indigo-200">
                {formatCurrency(active.value)}
              </p>
              <p className="text-[10.5px] text-slate-300 mt-0.5 font-medium">{active.label}</p>
            </div>
          </>
        )}
      </div>

      {points.length > 1 && (
        <div className="flex justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-800/60">
          <span>{points[0].label}</span>
          <span>{points[Math.floor(points.length / 2)].label}</span>
          <span>{points[points.length - 1].label}</span>
        </div>
      )}
    </div>
  );
};

export default RevenueChart;

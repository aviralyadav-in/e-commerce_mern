import React from "react";
import { TrendUpIcon, TrendDownIcon } from "./Icon";

const ACCENTS = {
  orange: "bg-orange-50 text-orange-700",
  green: "bg-emerald-50 text-emerald-700",
  blue: "bg-blue-50 text-blue-700",
  slate: "bg-gray-100 text-gray-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  purple: "bg-violet-50 text-violet-700",
};

const StatCard = ({
  title,
  count,
  icon,
  accent = "orange",
  hint,
  trend, // { value: "+12%", direction: "up" | "down" }
}) => (
  <div className="admin-card p-3.5 flex items-start gap-3">
    <div
      className={`w-9 h-9 rounded-(--radius) flex items-center justify-center shrink-0 ${
        ACCENTS[accent] || ACCENTS.orange
      }`}
    >
      <span className="[&>svg]:w-4.5 [&>svg]:h-4.5">{icon}</span>
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11.5px] font-medium text-(--ink-muted) truncate">
        {title}
      </p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className="text-[21px] font-bold text-(--ink) tracking-[-0.02em] leading-none truncate">
          {count ?? 0}
        </p>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-semibold shrink-0 ${
              trend.direction === "down" ? "stat-trend-down" : "stat-trend-up"
            }`}
          >
            {trend.direction === "down" ? (
              <TrendDownIcon className="w-3 h-3" />
            ) : (
              <TrendUpIcon className="w-3 h-3" />
            )}
            {trend.value}
          </span>
        )}
      </div>
      {hint && (
        <p className="text-[11px] text-(--ink-faint) mt-1.5 truncate">{hint}</p>
      )}
    </div>
  </div>
);

export default StatCard;

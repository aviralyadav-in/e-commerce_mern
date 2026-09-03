import { TrendUpIcon, TrendDownIcon } from "./Icon";

const ACCENTS = {
  indigo: {
    bg: "bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white shadow-indigo-500/25",
    pill: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
  },
  green: {
    bg: "bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-emerald-500/25",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  },
  blue: {
    bg: "bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-sky-500/25",
    pill: "bg-sky-50 text-sky-700 border-sky-200/80",
  },
  purple: {
    bg: "bg-gradient-to-tr from-violet-500 to-purple-600 text-white shadow-purple-500/25",
    pill: "bg-purple-50 text-purple-700 border-purple-200/80",
  },
  amber: {
    bg: "bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-amber-500/25",
    pill: "bg-amber-50 text-amber-700 border-amber-200/80",
  },
  red: {
    bg: "bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-rose-500/25",
    pill: "bg-rose-50 text-rose-700 border-rose-200/80",
  },
  orange: {
    bg: "bg-gradient-to-tr from-orange-500 to-amber-600 text-white shadow-orange-500/25",
    pill: "bg-orange-50 text-orange-700 border-orange-200/80",
  },
};

const StatCard = ({
  title,
  count,
  icon,
  accent = "indigo",
  hint,
  trend, // { value: "+12%", direction: "up" | "down" }
}) => {
  const scheme = ACCENTS[accent] || ACCENTS.indigo;

  return (
    <div className="admin-card p-4 sm:p-5 flex items-start gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover group">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md ${scheme.bg} transition-transform group-hover:scale-105`}
      >
        <span className="[&>svg]:w-5 [&>svg]:h-5">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold text-slate-500 dark:text-slate-400 tracking-tight truncate">
          {title}
        </p>
        <div className="flex items-baseline gap-2.5 mt-1.5 flex-wrap">
          <p className="text-[24px] font-extrabold text-(--ink) tracking-tight leading-none truncate">
            {count ?? 0}
          </p>
          {trend && (
            <span
              className={`inline-flex items-center gap-1 text-[11.5px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                trend.direction === "down"
                  ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-900/60"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900/60"
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
          <p className="text-[11.5px] text-slate-400 dark:text-slate-500 font-medium mt-2 truncate">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;

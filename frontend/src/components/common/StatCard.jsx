import { TrendUpIcon, TrendDownIcon } from "./Icon";

const ACCENTS = {
  indigo: {
    bg: "bg-linear-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/25 ring-1 ring-indigo-400/20",
    pill: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
  },
  green: {
    bg: "bg-linear-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/25 ring-1 ring-emerald-400/20",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  },
  blue: {
    bg: "bg-linear-to-tr from-sky-600 to-blue-500 text-white shadow-md shadow-sky-500/25 ring-1 ring-sky-400/20",
    pill: "bg-sky-50 text-sky-700 border-sky-200/80",
  },
  purple: {
    bg: "bg-linear-to-tr from-violet-600 to-purple-500 text-white shadow-md shadow-purple-500/25 ring-1 ring-violet-400/20",
    pill: "bg-purple-50 text-purple-700 border-purple-200/80",
  },
  amber: {
    bg: "bg-linear-to-tr from-amber-600 to-orange-500 text-white shadow-md shadow-amber-500/25 ring-1 ring-amber-400/20",
    pill: "bg-amber-50 text-amber-700 border-amber-200/80",
  },
  red: {
    bg: "bg-linear-to-tr from-rose-600 to-red-500 text-white shadow-md shadow-rose-500/25 ring-1 ring-rose-400/20",
    pill: "bg-rose-50 text-rose-700 border-rose-200/80",
  },
  orange: {
    bg: "bg-linear-to-tr from-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/25 ring-1 ring-orange-400/20",
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
    <div className="admin-card p-4 sm:p-5 flex items-start gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover hover:border-indigo-200/80 dark:hover:border-slate-700 group">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${scheme.bg} transition-transform group-hover:scale-105`}
      >
        <span className="[&>svg]:w-5 [&>svg]:h-5">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold text-slate-500 dark:text-slate-400 tracking-tight truncate">
          {title}
        </p>
        <div className="flex items-baseline gap-2.5 mt-1.5 flex-wrap">
          <p className="text-[24px] sm:text-[26px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-none truncate">
            {count ?? 0}
          </p>
          {trend && (
            <span
              className={`inline-flex items-center gap-1 text-[11.5px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                trend.direction === "down"
                  ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200/90 dark:border-rose-900/60"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/90 dark:border-emerald-900/60"
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
          <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium mt-2 truncate">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;

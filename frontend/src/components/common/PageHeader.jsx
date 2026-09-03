
/**
 * Shared page header for admin list/detail pages.
 * `meta` renders small chips under the title (counts, filters in effect).
 */
const PageHeader = ({ title, subtitle, actions, meta }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div className="min-w-0">
      <h1 className="text-[22px] sm:text-[24px] font-extrabold text-slate-900 tracking-tight leading-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-[13px] text-slate-500 font-medium mt-1 leading-snug">
          {subtitle}
        </p>
      )}
      {meta && (
        <div className="flex flex-wrap items-center gap-2 mt-2.5">{meta}</div>
      )}
    </div>
    {actions && (
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        {actions}
      </div>
    )}
  </div>
);

export default PageHeader;

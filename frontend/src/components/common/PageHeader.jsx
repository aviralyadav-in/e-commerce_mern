import React from "react";

/**
 * Shared page header for admin list/detail pages.
 * `meta` renders small chips under the title (counts, filters in effect).
 */
const PageHeader = ({ title, subtitle, actions, meta }) => (
  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
    <div className="min-w-0">
      <h1 className="text-[21px] font-bold text-(--ink) tracking-[-0.015em] leading-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-[12.5px] text-(--ink-muted) mt-1 leading-snug">
          {subtitle}
        </p>
      )}
      {meta && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2">{meta}</div>
      )}
    </div>
    {actions && (
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {actions}
      </div>
    )}
  </div>
);

export default PageHeader;

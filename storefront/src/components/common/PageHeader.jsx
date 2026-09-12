import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Consistent page intro block.
 * props:
 *  - eyebrow: string
 *  - title: string | node (rendered as h1)
 *  - description: string | node
 *  - breadcrumbs: [{ label, to? }]  (last item is the current page)
 *  - action: node rendered to the right on desktop
 *  - align: "left" | "center"
 *  - size: "default" | "compact"
 */
export default function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  action,
  align = "left",
  size = "default",
  className,
  children,
}) {
  const centered = align === "center";
  return (
    <header
      className={cn(
        size === "compact" ? "mb-6 sm:mb-8" : "mb-8 sm:mb-12",
        className
      )}
    >
      {Array.isArray(breadcrumbs) && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className={cn("mb-4", centered && "flex justify-center")}>
          <ol className="flex flex-wrap items-center gap-1.5 text-micro text-ink-soft">
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <li key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
                  {crumb.to && !isLast ? (
                    <Link to={crumb.to} className="transition-colors hover:text-foreground">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current={isLast ? "page" : undefined} className={cn(isLast && "text-foreground")}>
                      {crumb.label}
                    </span>
                  )}
                  {!isLast && <ChevronRight className="size-3 opacity-60" aria-hidden="true" />}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      <div
        className={cn(
          "flex flex-col gap-5",
          !centered && "md:flex-row md:items-end md:justify-between",
          centered && "items-center text-center"
        )}
      >
        <div className={cn("max-w-2xl", centered && "mx-auto")}>
          {eyebrow && (
            <span className={cn("eyebrow mb-3 flex items-center gap-3", centered && "justify-center")}>
              <span className="inline-block h-px w-7 bg-champagne" aria-hidden="true" />
              <span>{eyebrow}</span>
              {centered && <span className="inline-block h-px w-7 bg-champagne" aria-hidden="true" />}
            </span>
          )}
          <h1 className={size === "compact" ? "text-h2 text-foreground" : "text-h1 text-foreground"}>{title}</h1>
          {description && (
            <p className="mt-3 max-w-xl text-body text-ink-muted">{description}</p>
          )}
          {children}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}

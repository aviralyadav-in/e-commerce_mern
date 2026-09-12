import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Empty / zero-result state with a clear CTA.
 * props:
 *  - icon: lucide icon component
 *  - title, description
 *  - action: { label, to?, onClick? }
 *  - secondaryAction: { label, to?, onClick? }
 *  - compact: boolean (smaller padding)
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  className,
  children,
}) {
  const renderAction = (a, primary) => {
    if (!a) return null;
    const cls = cn("btn", primary ? "btn-primary btn-luxury" : "btn-secondary", compact && "btn-sm");
    const content = (
      <>
        <span>{a.label}</span>
        {primary && <ArrowRight aria-hidden="true" />}
      </>
    );
    if (a.to) {
      return (
        <Link to={a.to} className={cls}>
          {content}
        </Link>
      );
    }
    return (
      <button type="button" onClick={a.onClick} className={cls}>
        {content}
      </button>
    );
  };

  return (
    <div
      role="status"
      className={cn(
        "surface-card flex flex-col items-center text-center",
        compact ? "px-6 py-10" : "px-6 py-16 sm:py-20",
        className
      )}
    >
      {Icon && (
        <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-gold-soft text-gold-ink">
          <Icon className="size-6" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-h3 text-foreground">{title}</h3>
      {description && <p className="mt-2 max-w-md text-small text-ink-muted">{description}</p>}
      {children}
      {(action || secondaryAction) && (
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {renderAction(action, true)}
          {renderAction(secondaryAction, false)}
        </div>
      )}
    </div>
  );
}

import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Section intro block (renders the section's h2).
 * props: eyebrow, title, description, actionLabel, actionTo, align "center" | "left", className
 */
export default function SectionHeading({
  eyebrow,
  title,
  description,
  actionLabel,
  actionTo,
  align = "center",
  className,
}) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "mb-8 sm:mb-10",
        centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl text-left",
        className
      )}
    >
      {eyebrow && (
        <span
          className={cn(
            "eyebrow mb-3 flex items-center gap-3",
            centered ? "justify-center" : "justify-start"
          )}
        >
          <span className="inline-block h-px w-7 bg-champagne" aria-hidden="true" />
          <span>{eyebrow}</span>
          {centered && <span className="inline-block h-px w-7 bg-champagne" aria-hidden="true" />}
        </span>
      )}
      <h2 className="text-h2 text-foreground">{title}</h2>
      {description && <p className="mt-3 text-body text-ink-muted">{description}</p>}
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="link-underline mt-5 inline-flex items-center gap-1.5 text-micro text-foreground transition-colors hover:text-gold-ink"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

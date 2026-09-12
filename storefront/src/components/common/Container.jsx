import React from "react";
import { cn } from "../../lib/utils";

/**
 * Page gutter wrapper. size: "default" (max-w-7xl) | "narrow" (max-w-3xl) | "wide" (max-w-[90rem])
 */
export default function Container({ as: Tag = "div", size = "default", className, children, ...props }) {
  const sizeClass =
    size === "narrow" ? "container-narrow" : size === "wide" ? "container-wide" : "container-x";
  return (
    <Tag className={cn(sizeClass, className)} {...props}>
      {children}
    </Tag>
  );
}

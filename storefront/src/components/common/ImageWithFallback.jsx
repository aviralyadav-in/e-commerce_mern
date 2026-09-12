import React, { useState } from "react";
import { cn, getImageUrl, handleImageError } from "../../lib/utils";

/**
 * Aspect-locked image with placeholder fallback, lazy loading and fade-in.
 * props:
 *  - src: raw image path (passed through getImageUrl)
 *  - alt
 *  - ratio: "3/4" | "4/5" | "1/1" | "16/9" | "4/3" | "auto"   (default "3/4")
 *  - priority: boolean -> eager loading (hero / above the fold)
 *  - className: wrapper classes (background, radius…)
 *  - imgClassName: extra classes on the <img>
 *  - fill: when true wrapper is absolute inset-0 (parent must be relative)
 */
export default function ImageWithFallback({
  src,
  alt = "",
  ratio = "3/4",
  priority = false,
  className,
  imgClassName,
  fill = false,
  onLoad,
  ...props
}) {
  const [loaded, setLoaded] = useState(false);

  const ratioStyle = ratio && ratio !== "auto" && !fill ? { aspectRatio: ratio.replace("/", " / ") } : undefined;

  return (
    <div
      className={cn(
        "overflow-hidden bg-surface-2",
        fill ? "absolute inset-0" : "relative w-full",
        className
      )}
      style={ratioStyle}
    >
      <img
        src={getImageUrl(src)}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onLoad={(e) => {
          setLoaded(true);
          if (onLoad) onLoad(e);
        }}
        onError={(e) => {
          handleImageError(e);
          setLoaded(true);
        }}
        data-loaded={loaded ? "true" : "false"}
        className={cn("img-cover img-fade absolute inset-0", imgClassName)}
        {...props}
      />
    </div>
  );
}

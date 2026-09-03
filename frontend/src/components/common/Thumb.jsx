import { useState } from "react";
import { getAssetUrl } from "../../utils/assetUrl";
import { ImageIcon } from "./Icon";

/**
 * Image cell with a local fallback.
 *
 * Renders a neutral icon tile when the record has no image or the file 404s,
 * rather than a broken-image glyph.
 */
const Thumb = ({
  src,
  alt = "",
  className = "w-9 h-9",
  rounded = "rounded-[var(--radius)]",
  icon,
  objectFit = "object-cover",
}) => {
  const url = getAssetUrl(src);
  const [failed, setFailed] = useState(false);
  // Reset the error flag whenever the image target changes — done during
  // render (React's adjust-state-on-prop-change pattern) instead of an effect.
  const [prevUrl, setPrevUrl] = useState(url);
  if (prevUrl !== url) {
    setPrevUrl(url);
    setFailed(false);
  }

  const frame = `${className} ${rounded} shrink-0 border border-[var(--border)] overflow-hidden bg-[var(--surface-sunken)]`;

  if (!url || failed) {
    return (
      <div
        className={`${frame} flex items-center justify-center text-(--ink-faint)`}
        aria-label={alt || "No image"}
      >
        {icon || <ImageIcon className="w-4 h-4" />}
      </div>
    );
  }

  return (
    <div className={frame}>
      <img
        src={url}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`w-full h-full ${objectFit}`}
      />
    </div>
  );
};

export default Thumb;

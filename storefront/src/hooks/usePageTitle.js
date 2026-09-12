import { useEffect } from "react";

const BRAND = "Niya Bags";

/**
 * Sets document.title for the current route. Pass null/undefined to show only the brand.
 *   usePageTitle("Shop all bags")  -> "Shop all bags | Niya Bags"
 */
export default function usePageTitle(title, description) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} | ${BRAND}` : `${BRAND} | Handcrafted Luxury Leather Bags`;
    let meta = null;
    let previousDesc = null;
    if (description) {
      meta = document.querySelector('meta[name="description"]');
      if (meta) {
        previousDesc = meta.getAttribute("content");
        meta.setAttribute("content", description);
      }
    }
    return () => {
      document.title = previous;
      if (meta && previousDesc !== null) meta.setAttribute("content", previousDesc);
    };
  }, [title, description]);
}

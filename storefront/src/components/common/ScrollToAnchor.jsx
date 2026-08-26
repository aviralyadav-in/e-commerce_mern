import { useEffect } from "react";
import { useLocation } from "react-router";

/**
 * ScrollToAnchor — location.hash (#shipping, #exchange…) par smooth scroll.
 * App me ek baar mount hota hai; App.jsx already pathname par top scroll karta hai.
 */
export default function ScrollToAnchor() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    // Thoda delay — page render hone do, phir section par scroll karo
    const timer = setTimeout(() => {
      const el = document.getElementById(location.hash.slice(1));
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => clearTimeout(timer);
  }, [location]);

  return null;
}

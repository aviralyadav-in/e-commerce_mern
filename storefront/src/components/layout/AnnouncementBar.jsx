import { useEffect, useState } from "react";
import { ANNOUNCEMENTS } from "../../data/siteContent";

/**
 * AnnouncementBar — header ke upar rotating messages.
 * Niyabags jaisa: har 3.5s me message fade hota hai.
 */
export default function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (ANNOUNCEMENTS.length < 2) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % ANNOUNCEMENTS.length),
      3500,
    );
    return () => clearInterval(timer);
  }, []);

  if (!ANNOUNCEMENTS.length) return null;

  return (
    <div
      className="relative z-40 h-7 overflow-hidden"
      style={{ background: "var(--bg-deep)" }}
    >
      {ANNOUNCEMENTS.map((a, i) => (
        <p
          key={a.id}
          className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold uppercase tracking-[0.22em] transition-all duration-500"
          style={{
            color: i === index ? "var(--accent)" : "transparent",
            transform: `translateY(${(i - index) * 100}%)`,
          }}
        >
          {a.text}
        </p>
      ))}
    </div>
  );
}

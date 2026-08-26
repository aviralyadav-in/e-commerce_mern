/** Contact page ke liye chhote self-contained inline icons */

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const MailIconFallback = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" {...base} style={{ color: "var(--accent)", flexShrink: 0 }}>
    <rect x="3" y="5.5" width="18" height="13" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

export const ClockIconFallback = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" {...base} style={{ color: "var(--accent)", flexShrink: 0 }}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);


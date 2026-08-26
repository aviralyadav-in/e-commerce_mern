import { Link } from "react-router";
import { SUPPORT_EMAIL } from "../../data/siteContent";

/* Social icons â€” chhote inline SVGs (koi external library nahi) */
const socialBase = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const InstagramIcon = () => (
  <svg width={17} height={17} viewBox="0 0 24 24" {...socialBase}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

const FacebookIcon = () => (
  <svg width={17} height={17} viewBox="0 0 24 24" {...socialBase}>
    <path d="M14 8h2.5V4.5H14A3.9 3.9 0 0 0 10 8.4V11H7.5v3.5H10v6h3.5v-6h2.7l.5-3.5h-3.2V8.8c0-.5.2-.8.5-.8Z" />
  </svg>
);

const YouTubeIcon = () => (
  <svg width={17} height={17} viewBox="0 0 24 24" {...socialBase}>
    <rect x="2.5" y="6" width="19" height="12.5" rx="4" />
    <path d="m10.5 9.7 4.6 2.55-4.6 2.55V9.7Z" fill="currentColor" stroke="none" />
  </svg>
);

const MailIcon = () => (
  <svg width={17} height={17} viewBox="0 0 24 24" {...socialBase}>
    <rect x="3" y="5.5" width="18" height="13" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const SOCIAL_LINKS = [
  { id: 1, label: "Instagram", Icon: InstagramIcon, href: "#" },
  { id: 2, label: "Facebook", Icon: FacebookIcon, href: "#" },
  { id: 3, label: "YouTube", Icon: YouTubeIcon, href: "#" },
  { id: 4, label: "Email", Icon: MailIcon, href: `mailto:${SUPPORT_EMAIL}` },
];

const ABOUT_LINKS = [
  { label: "Our Story", to: "/our-story" },
  { label: "About Niya", to: "/about" },
];

const CARE_LINKS = [
  { label: "Contact Us", to: "/contact" },
  { label: "Shipping & Returns", to: "/shipping-returns#shipping" },
  { label: "Exchange Policy", to: "/shipping-returns#exchange" },
  { label: "Size Guide", to: "/size-guide#size-guide" },
  { label: "Care Guide", to: "/size-guide#care-guide" },
  { label: "FAQs", to: "/faq" },
];

/** Footer â€” brand, socials, about/customer-care columns, legal links */
export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--bg-deep)",
        borderTop: "1px solid var(--border)",
      }}
    >
      {/* Customer service strip */}
      <div className="border-b px-4 py-6 sm:px-6" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <p className="eyebrow">Need help with your order?</p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-sm font-semibold transition hover:opacity-80"
            style={{ color: "var(--ink-soft)" }}
          >
            {SUPPORT_EMAIL}
          </a>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        {/* Brand + socials */}
        <div className="md:col-span-2">
          <p className="font-display text-2xl font-semibold">Niya Bags</p>
          <p
            className="mt-3 max-w-sm text-sm"
            style={{ color: "var(--ink-muted)" }}
          >
            Timeless silhouettes crafted with intention â€” designed to become
            part of your everyday story. Minibags, slings, totes &amp; wallets.
          </p>
          <div className="mt-6 flex items-center gap-3">
            {SOCIAL_LINKS.map(({ id, label, Icon, href }) => (
              <a
                key={id}
                href={href}
                aria-label={label}
                title={label}
                className="flex h-9 w-9 items-center justify-center rounded-full transition hover:scale-105"
                style={{
                  border: "1px solid var(--border-strong)",
                  color: "var(--ink-muted)",
                }}
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>

        {/* About column */}
        <div>
          <p className="eyebrow mb-4">About</p>
          <ul
            className="space-y-2.5 text-sm"
            style={{ color: "var(--ink-muted)" }}
          >
            {ABOUT_LINKS.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="hover:text-(--accent)">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Customer care column */}
        <div>
          <p className="eyebrow mb-4">Customer Care</p>
          <ul
            className="space-y-2.5 text-sm"
            style={{ color: "var(--ink-muted)" }}
          >
            {CARE_LINKS.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="hover:text-(--accent)">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar â€” copyright + legal */}
      <div className="border-t px-4 py-6 sm:px-6" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <p className="text-xs" style={{ color: "var(--ink-faint)" }}>
            Â© {new Date().getFullYear()} Niya Bags. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/privacy-policy" className="hover:text-(--accent)">
              Privacy Policy
            </Link>
            <Link to="/terms-of-use" className="hover:text-(--accent)">
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

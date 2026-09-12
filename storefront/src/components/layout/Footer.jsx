import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import TrustStrip from "../common/TrustStrip";
import { useSettingsStore } from "../../stores/settingsStore";
import { api } from "../../lib/api";

/* Brand glyphs (lucide v1 no longer ships brand icons). */
const InstagramGlyph = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);
const FacebookGlyph = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);
const XGlyph = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const YoutubeGlyph = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const SHOP_LINKS = [
  { label: "All bags", to: "/shop" },
  { label: "Women", to: "/shop?gender=Women" },
  { label: "Men", to: "/shop?gender=Men" },
  { label: "New arrivals", to: "/shop?sort=createdAt&order=desc" },
  { label: "Sale", to: "/shop?onSale=true" },
];

const CARE_LINKS = [
  { label: "Contact & concierge", to: "/contact" },
  { label: "Track your order", to: "/account/orders" },
  { label: "Shipping & addresses", to: "/account/addresses" },
  { label: "Saved wishlist", to: "/account/wishlist" },
];

const LEGAL_LINKS = [
  { label: "Privacy", to: "/contact" },
  { label: "Terms", to: "/contact" },
  { label: "Shipping", to: "/contact" },
  { label: "Refunds", to: "/contact" },
];

const PAYMENT_METHODS = ["UPI", "Visa", "Mastercard", "COD"];

const footerLinkClass =
  "inline-flex min-h-11 items-center text-small text-ivory/70 transition-colors duration-300 hover:text-champagne md:min-h-9";

const socialClass =
  "flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-champagne-light transition-colors duration-300 hover:border-champagne hover:bg-champagne hover:text-onyx";

export default function Footer() {
  const { settings } = useSettingsStore();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const supportEmail = settings?.supportEmail || "care@niyabags.com";
  const supportPhone = settings?.supportPhone || "+91 98190 12345";
  const storeAddress =
    settings?.storeAddress ||
    "Plot 14, Commercial Complex, Bandra Kurla Complex (BKC), Mumbai, Maharashtra 400051";
  const socials = settings?.socialLinks || {};
  const storeName = settings?.storeName || "Niya Bags";
  const year = new Date().getFullYear();

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    const subEmail = email;
    setSubscribed(true);
    setEmail("");

    try {
      await api.post("/inquiries", {
        name: "Newsletter Subscriber",
        email: subEmail.trim().toLowerCase(),
        subject: "VIP Newsletter Subscription",
        message: "Customer subscribed to the newsletter from the website footer.",
      });
    } catch (err) {
      console.warn("Newsletter background inquiry capture error:", err);
    }
  };

  const socialItems = [
    socials.instagram && { key: "instagram", label: "Instagram", href: socials.instagram, Icon: InstagramGlyph },
    socials.facebook && { key: "facebook", label: "Facebook", href: socials.facebook, Icon: FacebookGlyph },
    socials.twitter && { key: "twitter", label: "X (Twitter)", href: socials.twitter, Icon: XGlyph },
    socials.youtube && { key: "youtube", label: "YouTube", href: socials.youtube, Icon: YoutubeGlyph },
    socials.whatsapp && {
      key: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/${socials.whatsapp.replace(/\D/g, "")}`,
      Icon: MessageCircle,
    },
  ].filter(Boolean);

  return (
    <footer className="surface-onyx mt-auto border-x-0 border-b-0 text-ivory">
      <h2 className="sr-only">Footer</h2>

      <div className="container-x">
        {/* Trust row */}
        <div className="border-b border-white/10 py-10 sm:py-12">
          <TrustStrip variant="grid" tone="dark" />
        </div>

        {/* Main columns */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 py-14 sm:grid-cols-2 sm:py-16 lg:grid-cols-12 lg:gap-x-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-3">
            <Link
              to="/"
              className="inline-block font-serif text-2xl font-bold tracking-[0.22em] text-ivory transition-opacity hover:opacity-80"
            >
              NIYA <span className="text-champagne">BAGS</span>
            </Link>
            <p className="mt-5 max-w-sm text-small leading-relaxed text-ivory/70">
              Quiet luxury in full-grain leather. Architectural silhouettes, hand-finished edges and hardware
              made to be carried for decades, not seasons.
            </p>

            {socialItems.length > 0 && (
              <ul className="mt-6 flex flex-wrap items-center gap-2.5" aria-label="Follow Niya Bags">
                {socialItems.map(({ key, label, href, Icon }) => (
                  <li key={key}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className={socialClass}
                    >
                      <Icon className="size-4" />
                    </a>
                  </li>
                ))}
              </ul>
            )}

            <address className="mt-7 flex items-start gap-3 not-italic">
              <MapPin className="mt-0.5 size-4 shrink-0 text-champagne" aria-hidden="true" />
              <div className="text-small leading-relaxed text-ivory/60">
                <span className="block font-semibold text-ivory/85">Flagship studio</span>
                <span className="block max-w-xs">{storeAddress}</span>
                {settings?.gstin && (
                  <span className="mt-1.5 block text-micro tracking-[0.12em] text-ivory/45">
                    GSTIN {settings.gstin}
                  </span>
                )}
              </div>
            </address>
          </div>

          {/* Shop */}
          <nav aria-label="Shop" className="lg:col-span-2">
            <h3 className="text-micro font-sans text-champagne">Shop</h3>
            <ul className="mt-4 flex flex-col">
              {SHOP_LINKS.map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className={footerLinkClass}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Client care */}
          <nav aria-label="Client care" className="lg:col-span-3">
            <h3 className="text-micro font-sans text-champagne">Client care</h3>
            <ul className="mt-4 flex flex-col">
              {CARE_LINKS.map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className={footerLinkClass}>
                    {label}
                  </Link>
                </li>
              ))}
              <li className="mt-2 border-t border-white/10 pt-2">
                <a href={`mailto:${supportEmail}`} className={`${footerLinkClass} gap-2.5 break-all`}>
                  <Mail className="size-4 shrink-0 text-champagne" aria-hidden="true" />
                  <span>{supportEmail}</span>
                </a>
              </li>
              <li>
                <a href={`tel:${supportPhone}`} className={`${footerLinkClass} gap-2.5`}>
                  <Phone className="size-4 shrink-0 text-champagne" aria-hidden="true" />
                  <span>{supportPhone}</span>
                </a>
              </li>
            </ul>
          </nav>

          {/* Newsletter */}
          <div className="sm:col-span-2 lg:col-span-4">
            <h3 className="text-micro font-sans text-champagne">The inner circle</h3>
            <p className="mt-4 text-small leading-relaxed text-ivory/70">
              New arrivals, atelier stories and private previews. One note a month, nothing more.
            </p>

            {subscribed ? (
              <p
                role="status"
                className="mt-5 flex items-start gap-3 rounded-xl border border-champagne/30 bg-white/5 px-4 py-3.5 text-small text-ivory"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-champagne" aria-hidden="true" />
                <span>You&rsquo;re on the list. Welcome to the Niya Bags inner circle.</span>
              </p>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="mt-5 flex flex-col gap-2.5 sm:flex-row">
                <label htmlFor="footer-newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-newsletter-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="input-luxury min-w-0 flex-1 border-white/15 bg-white/5 text-ivory placeholder:text-ivory/40 hover:border-white/30 focus:border-champagne"
                />
                <button type="submit" className="btn btn-gold btn-sm h-12 shrink-0 sm:px-5">
                  <span>Subscribe</span>
                  <ArrowRight aria-hidden="true" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-5 border-t border-white/10 py-7 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-small text-ivory/50">
            &copy; {year} {storeName}. All rights reserved.
            <span className="mx-2 text-ivory/30" aria-hidden="true">
              &middot;
            </span>
            <span className="text-ivory/60">Handcrafted in India</span>
          </p>

          <nav aria-label="Legal">
            <ul className="flex flex-wrap gap-x-6 gap-y-0">
              {LEGAL_LINKS.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className={`${footerLinkClass} text-ivory/60`}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <ul className="flex flex-wrap items-center gap-2" aria-label="Accepted payment methods">
            {PAYMENT_METHODS.map((method) => (
              <li
                key={method}
                className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-micro tracking-[0.12em] text-ivory/70"
              >
                {method}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

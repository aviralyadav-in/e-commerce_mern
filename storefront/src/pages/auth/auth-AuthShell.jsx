import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, ShieldCheck, Sparkles, Truck } from "lucide-react";
import ImageWithFallback from "../../components/common/ImageWithFallback";
import RatingStars from "../../components/common/RatingStars";
import { useSettingsStore } from "../../stores/settingsStore";
import { cn, formatCurrency } from "../../lib/utils";

const PANEL_IMAGE =
  "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1400&auto=format&fit=crop";

const DEFAULT_QUOTE = {
  text: "The tote arrived in a linen dust bag with a handwritten note. Two years on, the leather has only grown more beautiful.",
  author: "Ananya R.",
  meta: "Client since 2024 · Bengaluru",
};

/** Server / form-level error banner (role="alert" so it is announced on mount). */
export function AuthErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="surface-panel mb-6 flex items-start gap-3 border-danger/40 bg-danger-soft px-4 py-3 text-small text-danger"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

/**
 * Password input with an in-field show/hide toggle.
 * Forwards id / aria-* from <FormField> straight to the <input>.
 */
export function PasswordInput({ className, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={cn("input-luxury pr-14", className)} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="icon-btn absolute right-0.5 top-1/2 size-11 -translate-y-1/2 text-ink-muted"
      >
        {visible ? <EyeOff className="size-4.5" aria-hidden="true" /> : <Eye className="size-4.5" aria-hidden="true" />}
      </button>
    </div>
  );
}

/**
 * Split auth layout: editorial onyx panel (lg+) + form card.
 * props: eyebrow, title, description, children (form), footer (links), quote, image
 */
export default function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
  quote = DEFAULT_QUOTE,
  image = PANEL_IMAGE,
}) {
  const settings = useSettingsStore((s) => s.settings);
  const floor = typeof settings?.freeShippingThreshold === "number" ? settings.freeShippingThreshold : 500;

  const bullets = [
    { icon: Sparkles, text: "Full-grain leather, handmade in our Mumbai atelier" },
    { icon: Truck, text: `Complimentary insured delivery above ${formatCurrency(floor)}` },
    { icon: ShieldCheck, text: "7-day returns and a 3-year stitch guarantee" },
  ];

  return (
    <div className="container-x page-top pb-12 sm:pb-16 lg:pb-20">
      <div className="grid items-stretch gap-8 lg:min-h-[41rem] lg:grid-cols-2 lg:gap-12 xl:gap-16">
        {/* Editorial panel — desktop only */}
        <aside
          aria-label="Why clients trust Niya Bags"
          className="relative hidden overflow-hidden rounded-[1.75rem] surface-onyx lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-12"
        >
          <ImageWithFallback fill src={image} alt="" priority className="bg-onyx" imgClassName="scale-105" />
          <div className="absolute inset-0 bg-onyx/30" aria-hidden="true" />
          <div className="absolute inset-0 overlay-photo" aria-hidden="true" />
          <div className="absolute inset-x-0 top-0 h-48 bg-linear-to-b from-onyx/75 to-transparent" aria-hidden="true" />

          <div className="relative z-10">
            <Link to="/" className="inline-flex flex-col gap-1 rounded-md">
              <span className="font-serif text-2xl tracking-[0.28em] text-ivory">
                NIYA <span className="text-champagne">BAGS</span>
              </span>
              <span className="text-micro text-ivory/60">Artisanal leather · Mumbai</span>
            </Link>
          </div>

          <div className="relative z-10 space-y-8">
            <figure className="space-y-4">
              <RatingStars value={5} size="sm" label="Rated 5 out of 5 by clients" />
              <blockquote className="max-w-md font-serif text-2xl leading-snug text-ivory xl:text-[1.75rem]">
                “{quote.text}”
              </blockquote>
              <figcaption className="text-small text-ivory/70">
                <span className="font-semibold text-ivory">{quote.author}</span> · {quote.meta}
              </figcaption>
            </figure>
            <span className="divider-gold block" aria-hidden="true" />
            <ul className="space-y-3">
              {bullets.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-small text-ivory/80">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-champagne/40 bg-white/5 text-champagne">
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Form column */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-[32rem]">
            <div className="mb-6 flex flex-col items-center gap-2 text-center lg:hidden">
              <span className="text-micro text-ink-soft">Niya Bags · Handcrafted in Mumbai</span>
              <span className="divider-gold" aria-hidden="true" />
            </div>

            <section className="surface-card p-6 sm:p-10">
              <header className="mb-8">
                {eyebrow && (
                  <span className="eyebrow mb-3 flex items-center gap-3">
                    <span className="inline-block h-px w-7 bg-champagne" aria-hidden="true" />
                    <span>{eyebrow}</span>
                  </span>
                )}
                <h1 className="text-h2 text-foreground">{title}</h1>
                {description && <p className="mt-2 text-body text-ink-muted">{description}</p>}
              </header>
              {children}
            </section>

            {footer && <div className="mt-6 text-center text-small text-ink-muted">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

# Niya Bags Storefront — Design System Contract (v1)

Everything here is implemented in `src/index.css` (Tailwind v4 `@theme` tokens + `@utility` recipes), `src/lib/utils.js` and `src/components/common/*`. Page implementers use these and **do not edit** those files. All recipes are real Tailwind utilities, so variants work (`hover:luxury-shadow-hover`, `md:section`, `dark:…`) and single-property utilities placed on the same element override recipe properties (`btn btn-primary h-14 rounded-full` works).

## 1. Colour tokens

### Semantic (theme-aware — default choice for surfaces, text, borders)
| Utility | Light | Dark | Use |
|---|---|---|---|
| `bg-background` | #FAF7F2 | #121110 | page canvas |
| `bg-surface` / `bg-card` | #FFFFFF | #1A1916 | cards, panels, inputs |
| `bg-surface-2` | #F4F1EA | #211F1B | subtle fills: chips, icon tiles, image frames, table headers |
| `bg-surface-3` | #ECE7DD | #2A2723 | hover fills |
| `border-line` / `border-border` | #E8E4DC | #2C2A26 | hairlines |
| `border-line-strong` | #D9D2C5 | #3B3833 | emphasised borders (outline buttons, inputs hover) |
| `text-foreground` / `text-ink` | #141414 | #F3EEE6 | primary text |
| `text-ink-muted` / `text-muted-foreground` | #6B6661 | #B3ABA1 | secondary text |
| `text-ink-soft` | #8F8981 | #8C857C | meta, placeholders, breadcrumbs |
| `text-gold-ink` | #9E7E52 | #D8BF97 | gold text that must stay readable (eyebrows, links, icons on surfaces) |
| `bg-gold-soft` | #F9F1E7 | #2A2419 | gold-tinted fills (icon tiles, highlights) |
| `bg-primary` / `text-primary-foreground` | onyx / ivory | cream #EADBC3 / onyx | primary buttons, active chips |
| `bg-primary-hover` | #9E7E52 | #C5A880 | primary hover |
| `text-success` `bg-success-soft` | green | mint | in-stock, paid, delivered |
| `text-warning` `bg-warning-soft` | amber | amber | pending |
| `text-danger` `bg-danger-soft` / `text-destructive` | #B33A3A | #E06C6C | errors, cancel, remove |
| `ring-ring` / `border-ring` | champagne | champagne | focus |

### Brand (fixed in both themes — use deliberately)
`ivory #FAF7F2`, `cream #FFFDF8`, `onyx #141414`, `onyx-soft #1F1E1B`, `taupe #6B6661`, `champagne #C5A880` (alias `gold`), `champagne-light #DFCDAF`, `champagne-dark #9E7E52`, `sand #E8E4DC`, `sand-light #F4F1EA`, `blush #F9F1E7`.
Use them for: onyx editorial sections (`surface-onyx`), text on photos (`text-ivory`, `text-ivory/70`), gold accents/dividers (`bg-champagne`), hero CTAs (`btn-ivory`, `btn-outline-ivory`).

### Migration table (replace every hard-coded hex in your files)
| Old | New |
|---|---|
| `text-[#141414]`, `dark:text-white` | `text-foreground` (drop the dark: pair) |
| `text-[#6B6661]`, `dark:text-white/65` | `text-ink-muted` |
| `text-[#9E7E52]`, `text-[#84663B]` | `text-gold-ink` |
| `text-[#C5A880]` on light surfaces | `text-gold-ink` (on photos/onyx keep `text-champagne`) |
| `text-[#EADBC3]` on dark backgrounds | `text-champagne-light` |
| `text-[#FAF7F2]` on photos/onyx | `text-ivory` |
| `bg-white`, `dark:bg-[#1C1B19]` | `bg-surface` (or `surface-card` recipe) |
| `bg-[#FAF7F2]`, `dark:bg-[#121110]` | `bg-background` |
| `bg-[#F4F1EA]`, `bg-[#F9F1E7]`, `dark:bg-white/5` | `bg-surface-2` / `bg-gold-soft` |
| `bg-[#141414]` for buttons | `btn btn-primary` |
| `bg-[#141414]` for sections | `surface-onyx` |
| `border-[#E8E4DC]`, `dark:border-white/10` | `border-line` |
| `hover:bg-[#9E7E52]` on primary buttons | (built into `btn-primary`) |
| `hover:text-[#9E7E52]` | `hover:text-gold-ink` |
| `ring-[#C5A880]`, `focus:border-[#C5A880]` | `ring-ring` / `focus:border-ring` (or use `input-luxury`) |
| `bg-[#C5A880]` badges | `pill pill-stock` |
| `text-rose-600`, `text-red-*`, `text-emerald-*`, `text-indigo-*` | `text-danger`, `text-success`, `text-gold-ink` |
| `bg-gradient-to-t from-black/85 …` on photos | `overlay-photo` (bottom-up) / `overlay-hero` (left-right) |

## 2. Typography
Fonts: `font-serif` (Playfair Display) for headings/prices-display, `font-sans` (Plus Jakarta Sans) for everything else. Body is 15px/1.6 by default.

| Utility | Purpose |
|---|---|
| `text-display` | hero headline (clamp 40→76px, serif) |
| `text-h1` | page title (clamp 32→52px) |
| `text-h2` | section title (28→40px) |
| `text-h3` | card / block title (22px) |
| `text-h4` | small heading (18px) |
| `text-lead` | intro paragraph (17px) |
| `text-body` | 15px/1.6 |
| `text-small` | 13px |
| `text-micro` | 11px uppercase tracked semi-bold (labels, breadcrumbs, meta) |
| `eyebrow` | 11px uppercase gold tracked (section eyebrow) — pair with `<span class="h-px w-7 bg-champagne" />` rule |
| `price` | tabular-nums bold — combine with a size (`price text-2xl`) |

Rules: one `h1` per page (PageHeader renders it); section titles are `h2`; card titles `h3`. Max measure for paragraphs: `max-w-prose`/`max-w-xl`. Never set `dark:text-white` on headings — tokens handle it.

## 3. Layout & rhythm
- Gutter wrapper: `container-x` (max-w 80rem, px 16/24/32) — or `<Container>`; `container-narrow` (48rem) for forms/auth/contact; `container-wide` (90rem) for shop grids if needed.
- Section spacing: `section` (py 64/88/104) for home/editorial sections, `section-tight` (py 40/56) for utility pages, `page-top` (pt 32/48) below the header on inner pages.
- Home page rhythm: sections separated by `section`, no extra `space-y-20` wrappers.
- Grids: product grids `grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4`; shop with sidebar: `lg:grid-cols-[260px_1fr] gap-8 xl:gap-12`; account: `lg:grid-cols-[280px_1fr]`; checkout/PDP: `lg:grid-cols-[1fr_420px]` with `lg:sticky lg:top-28` rail.
- Sticky offsets: header is ~72px + announcement bar 36px → use `top-28` for sticky rails, `scroll-mt-32` for anchors.
- Radii: cards `rounded-2xl`/`surface-card` (20px), controls `rounded-xl` (14px), pills/chips `rounded-full`, images inside cards `rounded-xl`.
- Shadows: `shadow-soft` (resting), `shadow-lift` (hover), `gold-glow` (focus/feature). `luxury-shadow` / `hover:luxury-shadow-hover` are aliases and now work as utilities.
- Motion: `ease-luxury`, durations 300–700ms; `reveal` + `.is-visible` (via `<Reveal>`), `animate-fade-up`, `animate-fade-in`, `luxury-card-hover` (lift on hover), `img-fade` (with `data-loaded`), `animate-hero-zoom`, `animate-marquee`. All disabled under reduced motion.

## 4. Surfaces
| Utility | What |
|---|---|
| `surface-card` | card: surface bg, hairline, 20px radius, soft shadow. Add `p-5 sm:p-6`. |
| `surface-panel` | subtle inset panel (surface-2 bg, hairline, 16px radius) — summaries, notes |
| `surface-glass` | translucent blurred bar (sticky header, mobile sticky CTA) — theme-aware |
| `surface-onyx` | fixed dark editorial block (craft story, footer, newsletter) — pair with `text-ivory` |
| `hairline` | top border line |
| `divider-gold` | 48px gold gradient rule (use `<span class="divider-gold" />`) |
| `media-frame` | relative overflow-hidden surface-2 rounded-2xl (image wrappers) |
| `overlay-photo` / `overlay-hero` | gradient overlays for text on photos (`absolute inset-0`) |

## 5. Buttons — compose classes: `btn` + one colour + optional size
Colours: `btn-primary` (onyx→champagne-dark hover; cream in dark), `btn-secondary` (outline), `btn-ghost`, `btn-gold` (champagne), `btn-ivory` (on photos/onyx), `btn-outline-ivory` (glass outline on photos), `btn-danger`.
Sizes: default 48px; `btn-sm` 40px; `btn-lg` 56px; `btn-icon` 44px round (icon only, add `aria-label`); `btn-block` full width.
Extras: `btn-luxury` (shine sweep on hover) — use on primary CTAs only. Loading: keep the label, prefix `<Spinner className="size-4" />`, set `disabled` and `aria-busy`.
Icon-only header/toolbar buttons: `icon-btn` (40px round, hover tint) + `aria-label`.
Examples:
```jsx
<Link to="/shop" className="btn btn-primary btn-luxury"><ShoppingBag /><span>Shop the collection</span></Link>
<button className="btn btn-secondary btn-sm">View details</button>
<button className="icon-btn" aria-label="Open bag"><ShoppingBag className="size-5" /></button>
```
The shadcn `<Button>` still exists for Radix `asChild` needs; prefer the recipes for consistency.

## 6. Forms
`label-luxury` (uppercase micro label), `input-luxury` (48px, surface bg, champagne focus ring, `aria-invalid` red ring), `textarea-luxury`, `field-hint`, `field-error`. Use `<FormField label hint error required>` around a single control (it wires id/aria). Selects: `<select className="input-luxury pr-10 appearance-none">` with a chevron icon absolutely positioned, or the shadcn `<Select>`. Checkboxes/radios: shadcn `<Checkbox>` or native with `accent-champagne size-4`. Quantity steppers: `inline-flex h-12 items-center rounded-xl border border-line` with `icon-btn` buttons and a `w-10 text-center price` value.

Additions (v1.1): `input-onyx` (input on dark/onyx blocks: white/6 fill, champagne focus), `icon-btn-onyx` (icon-btn colours for onyx blocks, combine `icon-btn icon-btn-onyx`), `icon-btn-lg` (44px), `field-counter` (right-aligned tabular character counter).

## 7. Chips, pills, badges
- Filter/category chips: `chip` + `chip-active` when selected (`aria-pressed`).
- Status/product pills: `pill` + `pill-sale` (onyx), `pill-stock` (gold "Only 2 left"), `pill-out` (taupe), `pill-new` (surface outline), `pill-gold` (soft gold, discount %), `pill-success`, `pill-warning`, `pill-danger`, `pill-muted`.
- `<StatusBadge status="Shipped" type="order" />` and `type="payment"` for order pages.

## 8. Links & navigation
`nav-link` (uppercase tracked with animated gold underline; add `aria-current="page"` on active), `link-underline` (animated underline on any text link), `link-gold` (gold underlined inline link), `skip-link` (place `<a href="#main" className="skip-link">Skip to content</a>` as the first element in Layout; `<main id="main">`).

## 9. Images
- Always `<ImageWithFallback src={raw} alt ratio="3/4" />` (handles getImageUrl, placeholder on error, lazy, fade-in, fixed aspect). `fill` for absolutely-filled parents; `priority` for above-the-fold hero/PDP main image. `imgClassName="transition-transform duration-700 group-hover:scale-105"` for zoom-on-hover.
- Product image lists: `getProductImages(product, variantName)` returns a non-empty raw array (variant images first).
- Card ratio 3/4 for products, 4/5 for categories, 16/9 or 4/3 for editorial, 1/1 for thumbnails/avatars.

## 10. Shared components (`src/components/common/`)
| Component | Props | Notes |
|---|---|---|
| `Container` (default) | `as`, `size` default/narrow/wide, `className` | gutter wrapper |
| `PageHeader` (default) | `eyebrow, title, description, breadcrumbs:[{label,to}], action, align left/center, size default/compact, children` | renders the page `h1` + breadcrumb nav |
| `EmptyState` (default) | `icon, title, description, action:{label,to|onClick}, secondaryAction, compact, children` | role=status, surface-card |
| `RatingStars` (default) | `value, count, size sm/md/lg/xl, showValue, onChange (makes it a picker), label` | fractional fill |
| `PriceTag` (default) | `product` OR `price, comparePrice`; `size sm/md/lg/xl`, `showDiscount` | strike-through + `pill-gold` discount |
| `StatusBadge` (default) | `status, type order/payment, withDot` | consistent colours |
| `ImageWithFallback` (default) | `src, alt, ratio, priority, fill, className, imgClassName, onLoad` | see §9 |
| `PageLoader` (default), `Spinner` (named) | `label, minHeight` / `className` | Suspense fallback / inline spinner |
| `FormField` (default) | `label, hint, error, required, optionalLabel, id, className` + one child control | wires aria |
| `TrustStrip` (default) | `variant grid/row/list, tone light/dark, items` | free-shipping floor from settings store |
Existing shared: `SectionHeading` (owned by the home agent, keep its API: eyebrow,title,description,actionLabel,actionTo,align,className), `Reveal`, `Marquee`, `BackToTop`, `MegaMenu`, `SearchModal`.

## 11. Utils (`src/lib/utils.js`)
`cn, formatCurrency, calculateDiscount, getSellingPrice, getImageUrl, handleImageError, FALLBACK_BAG_IMAGE` (unchanged) + `getProductImages(product, variantName)`, `getStockLabel(product) -> {status:'in'|'low'|'out', label, tone}`, `formatDate(value, 'short'|'long'|'datetime')`, `pluralize(n, 'item')`, `clampText(text, max)`, `buildShopSearch({gender, categoryId, collections, search, onSale, inStock, color, minPrice, maxPrice, sort, order, page})`, `getVariantColor(variant)`.

## 12. Dark mode rules
- Never pair `dark:` overrides with hex; use tokens. `dark:` is only for genuinely different treatments (e.g. `dark:bg-white/5` inside `surface-onyx` blocks, or `dark:opacity-90` on photos).
- Fixed-dark blocks (`surface-onyx`, footer, hero) look the same in both themes — that is intended.
- Glass/translucent bars use `surface-glass`.
- Check every page in dark mode: toggle via the header moon icon or add class `dark` on `<html>` (screenshot helper: set env `THEME=dark`, which appends `?theme=dark`; not supported yet — instead temporarily test by adding `document.documentElement.classList.add('dark')` in devtools, or trust tokens).

## 13. Accessibility rules
Landmarks (`header`, `nav aria-label`, `main id="main"`, `footer`), one `h1`, icon buttons with `aria-label`, `focus-visible` rings are global (do not `outline-none` without replacement), dialogs/sheets via Radix (shadcn) only, `aria-pressed` on toggles/chips, `aria-current="page"` on active nav, `aria-live="polite"` region for cart/wishlist toasts (sonner handles), form errors via `FormField`, tap targets ≥ 40px on mobile, contrast: `text-ink-soft` only for non-essential meta.

## 14. Do / Don't
- DO use recipes + tokens; DO keep copy premium but plain; DO keep behaviour identical.
- DON'T add hex colours, DON'T use `container mx-auto` (use `container-x`), DON'T use `space-y-20` page wrappers, DON'T stack three shadows, DON'T use `text-[10px]` for anything a user must read (min 11px via `text-micro`), DON'T `outline-none` on focusable elements, DON'T introduce new npm packages.

# Niya Bags — Storefront

Customer-facing store for the Niya Bags MERN project (React 19 + Vite 8 + Tailwind v4 + shadcn/Radix primitives + zustand + react-router v7). Talks to the Express API in `../backend` (port 5000).

## Run

```bash
cd backend && npm run dev        # API on http://localhost:5000
cd storefront && npm run dev     # storefront on http://localhost:5173
```

`.env` keys: `VITE_API_BASE_URL` (default `http://localhost:5000/api`), `VITE_ADMIN_URL` (admin panel link shown to admins).

```bash
npm run build     # production build (route-level code splitting)
npm run lint      # oxlint
```

## Design system

The UI is built on a small token + recipe layer, documented in [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md):

- **Tokens** (`src/index.css`, Tailwind v4 `@theme`): semantic, theme-aware colours (`bg-surface`, `text-ink-muted`, `border-line`, `text-gold-ink`, …) plus fixed brand colours (`ivory`, `onyx`, `champagne`, `sand`). Light and dark palettes live in `:root` / `.dark`.
- **Recipes** (`@utility`): type scale (`text-display` … `text-micro`, `eyebrow`), layout rhythm (`container-x`, `section`, `page-top`), surfaces (`surface-card`, `surface-panel`, `surface-glass`, `surface-onyx`), buttons (`btn btn-primary|secondary|ghost|gold|ivory|danger`, sizes `btn-sm|lg|icon|block`), forms (`input-luxury`, `textarea-luxury`, `label-luxury`), chips/pills (`chip`, `pill pill-sale|stock|out|new|gold|success|warning|danger`), links (`nav-link`, `link-underline`, `link-gold`), media and motion helpers.
- **Shared components** (`src/components/common/`): `Container`, `PageHeader`, `EmptyState`, `RatingStars`, `PriceTag`, `StatusBadge`, `ImageWithFallback`, `FormField`, `TrustStrip`, `PageLoader`/`Spinner`, `SectionHeading`, `Reveal`, `Marquee`, `ScrollToTop`, `BackToTop`, `MegaMenu`, `SearchModal`.
- **Helpers** (`src/lib/utils.js`): `formatCurrency`, `getSellingPrice`, `calculateDiscount`, `getImageUrl`, `getProductImages`, `getStockLabel`, `formatDate`, `pluralize`, `clampText`, `buildShopSearch`, `getVariantColor`. `src/hooks/usePageTitle.js` sets the document title per route.

Rules of thumb: no hard-coded hex in JSX (use tokens), one `h1` per page (rendered by `PageHeader` or the hero), every icon-only button has an `aria-label`, every image goes through `ImageWithFallback`.

## Structure

```
src/
  App.jsx                 routes (lazy pages) + app bootstrap
  components/
    layout/               Header, AnnouncementBar, Footer, Layout, nav-data
    common/               shared UI building blocks (see above)
    product/              ProductCard, ProductCardSkeleton, QuickViewModal
    cart/                 CartDrawer
    ui/                   shadcn/Radix primitives (token-aligned)
  pages/                  Home, Shop, ProductDetail, Checkout, Contact, NotFound, auth/, account/
  stores/                 zustand stores (auth, cart, wishlist, settings)
  lib/                    api client + utils
  hooks/                  usePageTitle
```

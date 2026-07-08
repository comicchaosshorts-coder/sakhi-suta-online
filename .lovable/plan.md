# Sakhi Suta — Build Plan

A dark-luxury saree e-commerce site with a real backend, admin CMS, clickable India map (from the SVG you'll upload), faux-3D product experience, and Razorpay checkout.

## 1. Foundation

- Enable **Lovable Cloud** (Postgres, auth, storage).
- Install fonts via `@fontsource` (Cormorant Garamond for headings, Inter for body).
- Design tokens in `src/styles.css`:
  - `--background` #0B0B0B, `--foreground` warm ivory
  - `--primary` gold #D4AF37 (+ `--primary-glow`)
  - `--accent` deep maroon #5C0A1A
  - Gradients, gold shadows, glass surfaces, tilt/glow utilities
- Update `__root.tsx` head with real title/description/OG (“Sakhi Suta — Elegance Woven in Every Thread”).

## 2. Database schema (migration)

Tables in `public` (all with GRANTs + RLS):
- `site_settings` — brand name, logo url, primary/accent hex, map SVG url (singleton).
- `states` — id, name, slug, saree_types text[], display_order.
- `products` — id, name, slug, price, description, fabric, occasion, origin, work, images text[], state_id, saree_type, in_stock.
- `orders` — id, user_id, items jsonb, subtotal, shipping_address jsonb, status, razorpay_order_id, razorpay_payment_id, created_at.
- `wishlist` — user_id, product_id.
- `reviews` — id, product_id, user_id, rating, body, created_at.
- `user_roles` + `app_role` enum (`admin`, `customer`) + `has_role()` SECURITY DEFINER (per user-roles rules — never store role on profile).
- `profiles` — id (FK auth.users), full_name, phone.

RLS:
- Public SELECT on `site_settings`, `states`, `products` (in stock), `reviews`.
- Owner-scoped SELECT/INSERT on `orders`, `wishlist`, own `reviews`, own `profile`.
- Admin (via `has_role`) full CRUD on catalog tables, all orders read.

Storage buckets (public): `product-images`, `brand-assets` (logo + map SVG).

Seed all **29 states** with saree-type mapping (Odisha→Sambalpuri/Bomkai, WB→Baluchari/Tant, TN→Kanchipuram, Gujarat→Bandhani/Patola, UP→Banarasi, Assam→Muga Silk, etc.). A handful of demo products.

## 3. Routes

Public:
- `/` — Home: hero with tilt/parallax saree card, tagline, CTAs, featured collections (from DB), mini India map preview.
- `/shop` — All products with filters.
- `/regions` — Full interactive India map.
- `/state/$slug` — State collection with saree-type subcategories + filters (price, fabric, occasion).
- `/product/$slug` — Image zoom + 360° spin viewer, fabric detail images, add to cart / buy now / wishlist, reviews.
- `/cart`, `/checkout` — Cart → address → Razorpay → confirmation.
- `/auth` — Login / signup (email+password + Google via broker).
- `/search` — auto-suggest results.

Authenticated (`_authenticated/`):
- `/account`, `/account/orders`, `/account/wishlist`.

Admin (`_authenticated/admin/`, gated by `has_role('admin')`):
- Dashboard (orders, customers count).
- Branding (logo, brand name, colors, upload/replace India map SVG).
- Products CRUD (with image upload).
- States & saree types manager.
- Orders list.

## 4. Interactive India map (the critical piece)

- You upload your India SVG; I store it in the `brand-assets` bucket and reference from `site_settings.map_svg_url`.
- A `<IndiaMap>` component fetches the SVG, inlines it via `dangerouslySetInnerHTML` (sanitized), then attaches listeners to each `<path>` by matching its `id` / `data-name` to a slug in `states`.
- Interaction:
  - Hover → gold glow filter + tooltip (state name, saree types).
  - Click → `navigate({ to: '/state/$slug', params })`.
- Admin can re-upload SVG anytime; mapping is by path id/name so ALL 29 states stay clickable as long as the SVG paths carry state names.
- Note: I need your SVG to have each state as its own `<path>` with `id` or `data-name` equal to the state name (e.g. `id="odisha"`). If yours doesn't, I'll add an admin “map calibration” screen that lets you click each state and assign it.

## 5. Faux-3D & luxury feel

- Product cards: CSS 3D tilt on hover (mouse-tracked), gold rim glow, glassmorphism.
- Product page: image zoom on hover + 360° spin (cycles through provided angle images on drag).
- Motion for React: fade/slide page transitions, staggered grid entrances.
- All animations respect `prefers-reduced-motion`.

## 6. Cart, checkout, Razorpay

- Cart persisted in `localStorage` for guests, synced to DB on login.
- Checkout flow: cart → address form (zod validated) → payment.
- Server function creates a Razorpay order (`POST /orders` via Razorpay REST) and returns `order_id`.
- Client loads Razorpay Checkout script, opens with `order_id`.
- Server function verifies `razorpay_signature` (HMAC-SHA256 with key secret) before marking order paid.
- Needs secrets from you: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`. Public key id is used client-side.

## 7. Extras

- Wishlist (DB-backed for signed-in users).
- Search with debounced auto-suggest querying `products.name` + state names.
- Reviews & 5-star ratings on product page.
- Fully responsive (mobile-first); sticky mobile bottom CTA on product page.
- SEO: per-route `head()` with title/description/OG; product OG uses first product image.

## 8. Technical notes

- Server logic via `createServerFn` (`.functions.ts` in `src/lib/`). Razorpay signature verify + admin mutations use `requireSupabaseAuth` + `has_role` check.
- Public read-only routes (home, state, product) use a server publishable client in loaders — never `supabaseAdmin` at module scope.
- Admin routes live under `_authenticated/admin/` with a `beforeLoad` role check.
- Google OAuth via `lovable.auth.signInWithOAuth` (also enable Google provider via `configure_social_auth`).

## Order of build (first pass)

1. Enable Cloud → migration + seed 29 states → storage buckets.
2. Design system + fonts + root head + layout shell (header, footer, cart drawer).
3. Home + product listing + product page (with demo data).
4. India map component wired to your uploaded SVG.
5. Cart + auth + wishlist + reviews.
6. Admin CMS.
7. Razorpay integration (after you provide keys).

## What I need from you next

1. Upload your **India SVG** (ideally each state as a `<path>` with `id="state-name"`; I'll build the calibrator if not).
2. Confirm you can provide **Razorpay Key ID + Secret** when we reach step 7 (test-mode keys are fine).
3. Optional: your logo image; otherwise I'll typeset a gold serif wordmark for “Sakhi Suta”.

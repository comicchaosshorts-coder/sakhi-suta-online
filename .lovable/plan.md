## Goal

Rebuild the Sakhi Suta storefront to look and behave like craftyle.com — a bright, clean, conversion-focused Indian ethnic-wear shop — while keeping the Sakhi Suta brand name, logo, "about" copy, India map, 3D coverflow, testimonials and partner CTA exactly as they are.

## 1. Design system swap (dark → light)

Rework `src/styles.css` tokens:

- Background: warm white `#FFFFFF` / soft blush section band `#FFF6F3`
- Foreground: near-black `#1A1A1A`, muted grey for meta text
- Primary (brand/CTA): deep maroon `#8B1E3F` — keeps the Sakhi Suta identity in a light context
- Accent/offer strip: Craftyle-style yellow `#F7D117` with black text
- Sale/discount badge: red
- Borders: hairline warm grey; cards get white surfaces, subtle shadow, small radius — no glass, no gold glow, no dark gradients
- Keep Cormorant Garamond for headings, Inter for body

The `glass`, `gold-text`, `gold-border`, `shadow-gold` utilities get redefined as their light equivalents so no component breaks.

## 2. Header / navigation (Craftyle pattern)

- **Rotating announcement bar** at very top with arrows, cycling short lines ("Free shipping across India", "Prepaid orders only", etc.)
- **Sticky white header**: search icon left, nav (Sarees · Regions · About · Track Order · Contact) around a centered Sakhi Suta logo + wordmark, account & cart icons right. Logo and wordmark unchanged.
- **Yellow offer marquee** below the header — continuously scrolling offer lines
- **Mobile sticky bottom bar**: Home · Menu · Search · Cart · Account

## 3. Homepage section order

1. Hero slide carousel (existing admin slides, now full-bleed edge-to-edge like Craftyle)
2. Promo strip banner (admin image, e.g. "Prepaid Orders Save More")
3. **New Arrivals** — horizontal product rail with "View all"
4. 3D coverflow catalogue (kept, restyled light)
5. Category feature band: eyebrow "SAKHI SUTA" + heading + description + SHOP NOW over a background image
6. **Shop by region** — the India map section, kept, restyled for light background
7. **The Catalogue** — product grid with "View all"
8. Existing brand/about copy block (unchanged wording — brand name, atelier paragraph, "Our goal…", "connect with us" partner link)
9. **Let Customers Speak For Us** — testimonials, restyled as Craftyle's review wall
10. **Why Choose Sakhi Suta** — 4 icon USPs (Handloom by artisans / Assured quality / Free shipping in India / Secure prepaid checkout)
11. Footer: link columns, contact, payment icons, social

## 4. Product card restyle

Match Craftyle's card: image with hover swap to second image, product title, sale price + struck MRP, red `–XX%` badge corner, star rating placeholder, "Add to cart" button appearing on hover. Existing 9:16/auto-frame image behaviour and pricing logic stay.

## 5. Admin-editable promo content

New table `promo_content`:

- `id`, `kind` (`announcement` | `marquee` | `usp`), `text`, `link_url`, `display_order`, `active`, timestamps
- Public read of active rows for anon; admin full access; explicit GRANTs
- Seeded with sensible starter lines

New admin tab **Promos** at `/admin/promos` to add, edit, reorder, activate/deactivate announcement lines, marquee offer lines, and the four USP items.

Also add a `promo_banner_url` field to site branding so the promo strip image is uploadable.

## 6. Pages touched

- `src/styles.css` — new light token set
- `src/components/site/Header.tsx`, `Footer.tsx` — new structure + announcement bar, marquee, mobile bar
- New: `AnnouncementBar.tsx`, `OfferMarquee.tsx`, `ProductRail.tsx`, `UspStrip.tsx`, `MobileTabBar.tsx`
- `ProductCard.tsx`, `Coverflow3D.tsx`, `HeroCarousel.tsx`, `IndiaMap.tsx`, `TestimonialsSection.tsx` — light restyle only
- `src/routes/index.tsx` — new section order (copy unchanged)
- `shop.tsx`, `product.$slug.tsx`, `cart.tsx`, `checkout.tsx`, `regions.tsx`, `state.$slug.tsx`, `join.tsx`, `auth.tsx`, `search.tsx` — light theme pass so nothing looks broken
- Admin routes — light theme pass + new Promos tab

## Notes

- No content, product, pricing, payment or map logic changes — this is a visual + structural rebuild plus the promo CMS.
- Prepaid-only checkout stays as-is (no COD, despite Craftyle offering it).
- Craftyle's imagery is not copied; your own slides and product photos fill every banner slot.

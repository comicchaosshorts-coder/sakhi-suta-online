# Admin-managed categories and benefits

## What will change
- Replace only the homepage category row’s data with four admin-managed main categories: Sarees, Salwar, Middy, and Lehenga, preserving the existing circular styling and placement.
- Add a public Saree Categories page with exactly two circular tiles per row. Only enabled categories render, so disabled entries leave no gaps.
- Add public category product pages: Sarees can browse all sarees or a selected saree category; Salwar, Middy, and Lehenga open their product listings directly.
- Add category controls to the existing admin area for main categories and saree categories: name, image, enabled state, display order, add, edit, and remove.
- Extend product create/edit with main-category and conditional saree-category selection.
- Add bulk assignment in the product admin so selected existing products can receive a main category and, where applicable, a saree category without changing any other product data.
- Add an admin-managed benefits area and render it immediately above the existing footer across customer pages. It will use the supplied Sakhi Suta logo unchanged in the center, show only enabled benefits, balance two enabled benefits without blanks, and switch to a 2×2 arrangement when four are enabled.
- Seed 24 Hour Dispatch and Free Shipping as enabled; seed COD Available and 7 Days Easy Returns & Exchange as disabled.

## Existing product preservation and initial mapping
- Add nullable category references to existing product rows; do not recreate, duplicate, or delete products.
- Seed the 37 requested saree categories, including Paithani.
- Map existing products conservatively from exact or clear product-name matches, including Banarasi, Jamdani, Katan Silk, Kalamkari, Baluchari, Sambalpuri Silk, Digital Print, and Paithani where those names occur.
- Leave ambiguous products available for bulk assignment rather than guessing incorrectly.
- Use an existing matching product cover as a category image where available; otherwise show the current elegant initial fallback until an admin uploads an image.

## Technical details
- Create relational `main_categories`, `saree_categories`, and `benefits` tables with public enabled-only reads, admin-only writes, explicit grants, ordering, timestamps, and safe deletion behavior.
- Add nullable `main_category_id` and `saree_category_id` fields to `products`, plus indexes and a validation trigger that prevents a saree subcategory being paired with a non-saree main category.
- Keep the existing `category_tiles` table intact for compatibility, but switch the homepage row to the new category source.
- Add public server functions and cached queries for categories, benefits, and filtered product listings; add authenticated admin functions for CRUD, image changes, ordering, and bulk assignment.
- Reuse the existing secure image upload flow and the supplied logo asset.
- Add unique route metadata for the new customer pages.
- Preserve customer access to catalogue and brand images while replacing the two broad storage read policies with server-side signed delivery, resolving the active security findings without changing visible behavior.

## Validation
- Verify homepage order and visuals remain unchanged except for the four category tiles and the new pre-footer benefits section.
- Verify category routing, exact two-column saree grid, enabled/disabled reflow, direct Salwar/Middy/Lehenga listings, all-sarees browsing, and filtered saree listings.
- Verify admin category/benefit CRUD, image changes, ordering, per-product assignment, and multi-product bulk assignment.
- Confirm initial benefit visibility and four-benefit 2×2 behavior.
- Confirm existing product/order/customer counts and identifiers remain unchanged, then check mobile and desktop rendering and a clean build.

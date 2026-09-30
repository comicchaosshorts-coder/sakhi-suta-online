# Editorial Saree Category Cards

## What will change
- Replace only the customer-facing `/sarees` circular grid with a vertically stacked editorial card list.
- Keep the existing page heading, “Browse all sarees” link, category records, enabled-only filtering, display order, and category destinations unchanged.
- Render each category’s existing admin-managed image edge-to-edge as that card’s background, with a restrained readability overlay and large category title.
- Show a polished textile-inspired fallback when a category has no image, without hiding or disabling the link.
- Make cards wide and cinematic on desktop, compact and properly cropped on mobile, with accessible focus states and reduced-motion support.

## Existing admin controls
- Reuse the current Saree category editor and existing category image field; no new media system or duplicate database field.
- Clarify the image control as the category card background and update its preview to match the horizontal customer card shape.
- Preserve name, enabled state, display order, upload/change/remove, add, and delete behavior exactly as implemented.

## Validation
- Confirm disabled categories remain absent and enabled categories stay in configured order.
- Test homepage SAREES → category list → multiple category pages → correct product cards, including an empty category message.
- Test image and fallback cards at mobile and desktop sizes, plus the admin image controls and a clean build.

## Goal

Replace only the map geometry inside the "Every state, its own loom" section with a geographically accurate, up-to-date India administrative-boundary map. Keep the section's design, container, colours, hover/click behaviour, markers, tooltip and surrounding layout exactly as they are today.

## Why the swap is needed

The current `src/assets/india-states.svg` uses legacy state paths — Telangana is missing (rolled into Andhra Pradesh), Ladakh is missing (rolled into Jammu & Kashmir), Uttarakhand appears as "Uttaranchal", Odisha as "Orissa". Borders are also visibly rough. This is what makes the map look hand-drawn.

## Approach

1. **Source an accurate, current India admin-boundary dataset** with all 28 states + 8 UTs including Telangana, Ladakh, J&K (post-2019), Andaman & Nicobar and Lakshadweep. Preferred sources, in order:
   - Datameet / community India-States GeoJSON (post-2019, includes Telangana + Ladakh)
   - Wikimedia Commons "India location map" SVG (current)
   Convert GeoJSON → SVG with a d3-geo Mercator projection sized to the current 800×787 viewBox so nothing else in the layout needs to move. Each state becomes a `<path id="…">` using the same naming convention the component already matches on.

2. **Drop the new file in at `src/assets/india-states.svg`** (same path, same import). `IndiaMap.tsx` reads it as raw text, so no component logic changes.

3. **Extend the alias/slug map in `IndiaMap.tsx`** so DB slugs line up with the new path IDs:
   - Add `telangana`, `ladakh` as first-class matches (remove the current "telangana falls back to Andhra Pradesh" hack).
   - Keep existing aliases (Odisha↔Orissa, Uttarakhand↔Uttaranchal, J&K variants, A&N, Puducherry, Delhi).
   - Confirm every DB `states.slug` resolves to exactly one path in the new SVG; log any misses during dev.

4. **Pins reposition automatically.** Pin coordinates in `IndiaMap.tsx` are computed from each path's `getBBox()` centroid inside the shared `viewBox`, so once the paths are accurate the glowing markers snap to the correct state centres at every screen size. No hard-coded pixel positions exist to update. The overlay `<svg>` already reuses the base `viewBox` with `preserveAspectRatio="xMidYMid meet"`.

5. **Preserve everything else** in `IndiaMap.tsx`: fill/stroke tokens, hover glow, tooltip panel, click → `/state/$slug` navigation, container padding, and the "Hover a pin, click to enter" caption. `src/routes/index.tsx` and `src/routes/regions.tsx` are not touched.

6. **Verify** by loading the homepage in the preview at mobile + desktop widths and confirming:
   - Northeast states are distinct and connected via the Siliguri corridor
   - J&K and Ladakh render as separate regions
   - Telangana renders as its own region
   - Every pin sits inside its own state
   - Hover glow, tooltip and click-through still work
   - Andaman & Nicobar visible; Lakshadweep visible if it fits at this scale
   - No horizontal overflow, aspect ratio preserved

## Files touched

- `src/assets/india-states.svg` — replaced with accurate geometry (same viewBox, same path-id convention).
- `src/components/site/IndiaMap.tsx` — only the `ALIASES` map updated (add Telangana, Ladakh; drop the Telangana→Andhra fallback). No style, layout or interaction changes.

## Explicitly not changed

Header, logo, section heading, paragraph, container border/rounding, colours, typography, catalogue section, other routes, pin styling, tooltip, hover animation.

## Fallback

If a fully accurate single-file SVG can't be assembled cleanly in one pass (e.g. projection alignment issues at 800×787), keep the existing SVG for mainland regions that are already acceptable and only overwrite the paths for Telangana, Ladakh and J&K so the map is at minimum administratively correct — then iterate on the rougher borders in a follow-up. I'll flag this in-turn if it happens rather than ship a half-swapped map silently.

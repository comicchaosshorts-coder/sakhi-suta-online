# Homepage section reorder

## Changes
- Rename the existing primary hero button to “Our Collection” without changing its link or styling.
- Add a “New Arrivals” heading directly above the existing 3D product slider.
- Remove the separate “Fresh off the loom” product grid.
- Add a manual swipe/drag category row with circular tiles for Katan, Banarasi, Kanchipuram, and Paithani.
- Rename the full catalogue heading to “OUR COLLECTION” and move its unchanged product grid below the category row.
- Keep “Shop by region” after the collection grid, then move the existing “Most loved / Bestsellers” section directly below the map.
- Leave testimonials and all unlisted homepage content unchanged.

## Technical details
- Implement the category row as a small homepage-only component using existing product imagery where available, with stable placeholders when no matching image exists.
- Category links will open the existing shop page; the row will use native horizontal scrolling with touch swipe and mouse drag, without autoplay.
- Verify the homepage order and layout on the current mobile viewport and confirm the app builds cleanly.

# Hero Banner and Safe Loading Optimization

## Scope
- Change only the homepage banner presentation and safe image/data-loading behavior.
- Preserve all existing layouts, styling, content, data, routes, and interactions.

## Implementation
1. Replace the banner’s fixed aspect-ratio frame and cropped image treatment with intrinsic responsive image sizing (`width: 100%`, `height: auto`, `object-fit: contain`). Keep the first slide eager/high-priority and later slides lazy.
2. Keep below-the-fold product and category imagery lazy-loaded, and avoid fetching unused gallery images for product cards by resolving only each product’s first image in listing responses.
3. Preserve the category-specific database filters so category pages continue loading only their assigned products.
4. Retain cache headers on stored image delivery and add safe revalidation metadata without altering source files or uploads.

## Verification
- Check the complete banner at narrow mobile, wide mobile, and desktop widths.
- Confirm only the first banner loads eagerly, below-the-fold images remain lazy, product/category images render, and routes remain error-free.

Category architecture: products keep stable identities and receive nullable relational links to admin-managed main and saree categories, because catalogue history must remain intact.
Global benefits architecture: customer benefits are database-managed and rendered once in the root shell immediately above the footer, because changes must apply site-wide without rebuilds.
Saree route architecture: `/sarees` is an Outlet layout with an index category grid and `$slug` product-listing child, so tile navigation renders correctly.
Saree category visuals reuse `saree_categories.image_url` as the editorial card background, keeping admin uploads and customer presentation on one record.
Social launcher architecture: mount once in the root shell, hide on admin paths, and reuse the site settings query and admin-validated configuration so navigation cannot duplicate it or create separate settings systems.
Image delivery: use bounded native storage width transforms through the existing media endpoint, preserve originals, and cache only unique upload keys immutably because admin replacements use new keys.
Banner sizing: read original image headers server-side and use picture source dimensions and matching responsive preload hints so mobile selection and reserved space are correct before hydration.
Announcement loading: preload the shared promo-content query in the root loader and reuse it on the homepage so the announcement bar does not appear late or fetch twice.
<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

Category architecture: products keep stable identities and receive nullable relational links to admin-managed main and saree categories, because catalogue history must remain intact.
Global benefits architecture: customer benefits are database-managed and rendered once in the root shell immediately above the footer, because changes must apply site-wide without rebuilds.
Saree route architecture: `/sarees` is an Outlet layout with an index category grid and `$slug` product-listing child, so tile navigation renders correctly.
Saree category visuals reuse `saree_categories.image_url` as the editorial card background, keeping admin uploads and customer presentation on one record.
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

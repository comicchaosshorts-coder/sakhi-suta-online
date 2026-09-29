import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getCategoryProducts } from "@/lib/categories.functions";
import { ProductCard } from "@/components/site/ProductCard";

const categoryQuery = (slug: string) => queryOptions({
  queryKey: ["category-products", slug],
  queryFn: () => getCategoryProducts({ data: { mainSlug: slug } }),
});

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(categoryQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const name = loaderData?.main.name ?? "Collection";
    return { meta: [
      { title: `${name} — Sakhi Suta` },
      { name: "description", content: `Shop the ${name} collection from Sakhi Suta.` },
      { property: "og:title", content: `${name} — Sakhi Suta` },
      { property: "og:description", content: `Shop the ${name} collection from Sakhi Suta.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ] };
  },
  component: MainCategoryProducts,
  notFoundComponent: () => <div className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="font-serif text-4xl">Collection not found</h1><Link to="/shop" className="mt-5 inline-block text-primary">Back to shop</Link></div>,
});

function MainCategoryProducts() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(categoryQuery(slug));
  if (!data) return null;
  return <main className="mx-auto max-w-7xl px-4 py-16 md:px-8"><p className="text-xs uppercase tracking-[0.4em] text-primary/70">The Collection</p><h1 className="mt-2 font-serif text-5xl">{data.main.name}</h1>{data.main.opens_saree_categories && <Link to="/sarees" className="mt-4 inline-block text-sm text-primary hover:underline">Browse saree categories →</Link>}{data.products.length === 0 ? <p className="mt-10 text-muted-foreground">This collection is being curated.</p> : <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">{data.products.map((product) => <ProductCard key={product.id} p={product} />)}</div>}</main>;
}
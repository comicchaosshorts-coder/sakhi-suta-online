import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getCategoryProducts } from "@/lib/categories.functions";
import { ProductCard } from "@/components/site/ProductCard";
import type { ProductCardData } from "@/components/site/ProductCard";

const categoryQuery = (slug: string) => queryOptions({
  queryKey: ["category-products", "sarees", slug],
  queryFn: () => getCategoryProducts({ data: { mainSlug: "sarees", sareeSlug: slug } }),
});

export const Route = createFileRoute("/sarees/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(categoryQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const name = loaderData?.sareeCategory?.name ?? "Sarees";
    return { meta: [
      { title: `${name} Sarees — Sakhi Suta` },
      { name: "description", content: `Shop ${name} sarees from Sakhi Suta.` },
      { property: "og:title", content: `${name} Sarees — Sakhi Suta` },
      { property: "og:description", content: `Shop ${name} sarees from Sakhi Suta.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ] };
  },
  component: SareeCategoryProducts,
  notFoundComponent: () => <div className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="font-serif text-4xl">Category not found</h1><Link to="/sarees" className="mt-5 inline-block text-primary">Back to saree categories</Link></div>,
});

function SareeCategoryProducts() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(categoryQuery(slug));
  if (!data) return null;
  return <ProductListing title={data.sareeCategory?.name ?? "Sarees"} products={data.products} />;
}

function ProductListing({ title, products }: { title: string; products: ProductCardData[] }) {
  return <main className="mx-auto max-w-7xl px-4 py-16 md:px-8"><Link to="/sarees" className="text-xs uppercase tracking-[0.3em] text-primary/70">← Saree Categories</Link><h1 className="mt-4 font-serif text-5xl">{title}</h1>{products.length === 0 ? <p className="mt-10 text-muted-foreground">No products available in this category yet</p> : <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} p={product} />)}</div>}</main>;
}
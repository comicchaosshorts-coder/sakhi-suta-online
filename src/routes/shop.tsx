import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listProducts } from "@/lib/products.functions";
import { ProductCard } from "@/components/site/ProductCard";

const q = queryOptions({
  queryKey: ["shop"],
  queryFn: () => listProducts({ data: {} }),
});

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Sakhi Suta" },
      { name: "description", content: "Browse every saree in the Sakhi Suta atelier." },
      { property: "og:title", content: "Shop — Sakhi Suta" },
      { property: "og:description", content: "Browse every saree in the Sakhi Suta atelier." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  component: Shop,
});

function Shop() {
  const { data: products } = useSuspenseQuery(q);
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.4em] text-primary/70">The Atelier</p>
        <h1 className="mt-2 font-serif text-5xl">All drapes</h1>
      </div>
      {products.length === 0 ? (
        <div className="rounded-2xl glass p-12 text-center text-muted-foreground">
          The atelier is being dressed — add products from the admin panel to see them here.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}

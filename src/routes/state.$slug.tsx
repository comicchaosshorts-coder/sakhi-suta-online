import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getStateBySlug } from "@/lib/states.functions";
import { ProductCard } from "@/components/site/ProductCard";

const stateQuery = (slug: string) =>
  queryOptions({
    queryKey: ["state", slug],
    queryFn: () => getStateBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/state/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(stateQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "State — Sakhi Suta" }] };
    const name = loaderData.state.name;
    return {
      meta: [
        { title: `${name} Sarees — Sakhi Suta` },
        {
          name: "description",
          content: `Handloom sarees from ${name}: ${loaderData.state.saree_types?.join(", ") ?? ""}.`,
        },
        { property: "og:title", content: `${name} Sarees — Sakhi Suta` },
        {
          property: "og:description",
          content: loaderData.state.description ?? `Sarees from ${name}.`,
        },
      ],
    };
  },
  component: StatePage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-serif text-4xl">State not found</h1>
      <Link to="/regions" className="mt-6 inline-block text-primary hover:underline">
        Back to the map
      </Link>
    </div>
  ),
});

function StatePage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(stateQuery(slug));
  if (!data) return null;
  const { state, products } = data;

  return (
    <div>
      <section className="border-b border-border/40">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
          <Link to="/regions" className="text-xs uppercase tracking-[0.3em] text-primary/70 hover:text-primary">
            ← Shop by Region
          </Link>
          <h1 className="mt-4 font-serif text-5xl md:text-6xl">
            <span className="gold-text">{state.name}</span>
          </h1>
          {state.description && (
            <p className="mt-4 max-w-2xl text-muted-foreground">{state.description}</p>
          )}
          {state.saree_types && state.saree_types.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {state.saree_types.map((t) => (
                <span
                  key={t}
                  className="rounded-full gold-border px-4 py-1.5 text-xs uppercase tracking-widest text-primary"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        {products.length === 0 ? (
          <div className="rounded-2xl glass p-12 text-center">
            <p className="font-serif text-2xl">The looms of {state.name} are warming</p>
            <p className="mt-2 text-sm text-muted-foreground">
              This collection is being curated. Return soon, or browse other regions.
            </p>
            <Link
              to="/shop"
              className="mt-6 inline-block rounded-full bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary-glow"
            >
              Explore all sarees
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

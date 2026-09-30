import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listSareeCategories } from "@/lib/categories.functions";

const sareeCategoriesQuery = queryOptions({
  queryKey: ["saree-categories"],
  queryFn: () => listSareeCategories(),
});

export const Route = createFileRoute("/sarees/")({
  head: () => ({ meta: [
    { title: "Saree Categories — Sakhi Suta" },
    { name: "description", content: "Explore Sakhi Suta sarees by weave, craft, and heritage category." },
    { property: "og:title", content: "Saree Categories — Sakhi Suta" },
    { property: "og:description", content: "Explore sarees by weave, craft, and heritage category." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(sareeCategoriesQuery),
  component: SareeCategoriesPage,
});

function SareeCategoriesPage() {
  const { data: categories } = useSuspenseQuery(sareeCategoriesQuery);
  return (
    <main className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
      <div className="mb-10 text-center md:mb-14">
        <p className="text-xs uppercase tracking-[0.4em] text-primary/70">The Saree Collection</p>
        <h1 className="mt-2 font-serif text-5xl md:text-6xl">Saree Categories</h1>
        <Link to="/category/$slug" params={{ slug: "sarees" }} className="mt-4 inline-block text-sm text-primary hover:underline">
          Browse all sarees →
        </Link>
      </div>
      <div className="space-y-5 md:space-y-8">
        {categories.map((category) => (
          <Link
            key={category.id}
            to="/sarees/$slug"
            params={{ slug: category.slug }}
            aria-label={`Shop ${category.name} sarees`}
            className="group relative flex min-h-56 w-full isolate items-center justify-center overflow-hidden rounded-md border border-border bg-secondary px-6 py-10 text-center shadow-[var(--shadow-deep)] outline-none transition-[transform,box-shadow] duration-500 hover:-translate-y-0.5 hover:shadow-[var(--shadow-gold),var(--shadow-deep)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transform-none motion-reduce:transition-none sm:min-h-72 md:min-h-96 md:px-12"
          >
            {category.image_url ? (
              <img
                src={category.image_url}
                alt=""
                className="absolute inset-0 -z-20 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025] motion-reduce:transition-none"
              />
            ) : (
              <span aria-hidden="true" className="category-card-fallback absolute inset-0 -z-20" />
            )}
            <span aria-hidden="true" className="category-card-overlay absolute inset-0 -z-10" />
            <span className="max-w-full border-y border-primary-foreground/45 px-4 py-3 font-serif text-3xl font-medium uppercase text-primary-foreground shadow-primary sm:px-8 sm:text-5xl md:px-12 md:py-5 md:text-6xl">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
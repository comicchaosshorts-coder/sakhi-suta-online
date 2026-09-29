import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listSareeCategories } from "@/lib/categories.functions";

const sareeCategoriesQuery = queryOptions({
  queryKey: ["saree-categories"],
  queryFn: () => listSareeCategories(),
});

export const Route = createFileRoute("/sarees")({
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
    <main className="mx-auto max-w-5xl px-4 py-14 md:px-8 md:py-20">
      <div className="mb-10 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-primary/70">The Saree Collection</p>
        <h1 className="mt-2 font-serif text-5xl md:text-6xl">Saree Categories</h1>
        <Link to="/category/$slug" params={{ slug: "sarees" }} className="mt-4 inline-block text-sm text-primary hover:underline">
          Browse all sarees →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:gap-x-16 md:gap-y-16">
        {categories.map((category) => (
          <Link key={category.id} to="/sarees/$slug" params={{ slug: category.slug }} className="group text-center">
            <span className="mx-auto grid aspect-square w-full max-w-72 place-items-center overflow-hidden rounded-full border border-border bg-secondary shadow-[var(--shadow-deep)]">
              {category.image_url ? (
                <img src={category.image_url} alt={`${category.name} sarees`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <span className="font-serif text-5xl text-primary/45 md:text-7xl">{category.name.charAt(0)}</span>
              )}
            </span>
            <span className="mt-4 block font-serif text-xl text-foreground md:text-2xl">{category.name}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
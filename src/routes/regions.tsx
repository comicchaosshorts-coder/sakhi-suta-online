import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listStates } from "@/lib/states.functions";
import { IndiaMap } from "@/components/site/IndiaMap";
import { Link } from "@tanstack/react-router";

const q = queryOptions({
  queryKey: ["regions"],
  queryFn: async () => {
    const states = await listStates();
    return { states };
  },
});


export const Route = createFileRoute("/regions")({
  head: () => ({
    meta: [
      { title: "Shop by Region — Sakhi Suta" },
      {
        name: "description",
        content: "Explore handloom sarees from every state of India. Click any region on the map.",
      },
      { property: "og:title", content: "Shop by Region — Sakhi Suta" },
      { property: "og:description", content: "Explore handloom sarees from every state of India." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  component: Regions,
});

function Regions() {
  const { data } = useSuspenseQuery(q);
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <div className="mb-10 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-primary/70">Shop by Region</p>
        <h1 className="mt-2 font-serif text-5xl">The Weave of India</h1>
      </div>
      <div className="rounded-3xl glass p-6">
        <IndiaMap svg={data.svg} states={data.states} />
      </div>
      <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
        {data.states.map((s) => (
          <Link
            key={s.id}
            to="/state/$slug"
            params={{ slug: s.slug }}
            className="rounded-xl glass px-4 py-3 text-sm transition hover:border-primary hover:text-primary"
          >
            <div className="font-serif">{s.name}</div>
            {s.saree_types && s.saree_types.length > 0 && (
              <div className="mt-1 truncate text-xs text-muted-foreground">
                {s.saree_types.slice(0, 2).join(" · ")}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

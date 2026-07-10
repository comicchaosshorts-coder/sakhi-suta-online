import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getSiteSettings } from "@/lib/site.functions";
import { listStates } from "@/lib/states.functions";
import { listProducts } from "@/lib/products.functions";
import { IndiaMap } from "@/components/site/IndiaMap";
import { ProductCard } from "@/components/site/ProductCard";

const homeQuery = queryOptions({
  queryKey: ["home"],
  queryFn: async () => {
    const [settings, states, featured] = await Promise.all([
      getSiteSettings(),
      listStates(),
      listProducts({ data: { featured: true, limit: 8 } }),
    ]);
    return { settings, states, featured };
  },
});


export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  const { settings, states, featured } = data;

  const tagline = settings?.tagline ?? "Elegance Woven in Every Thread";
  const brand = settings?.brand_name ?? "Sakhi Suta";

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-70"
          style={{ background: "var(--gradient-luxe)" }}
        />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-24 md:grid-cols-2 md:px-8 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col justify-center"
          >
            <p className="mb-4 text-xs uppercase tracking-[0.4em] text-primary/80">
              A heritage house of drape
            </p>
            <h1 className="font-serif text-5xl leading-[1.05] md:text-7xl">
              <span className="gold-text">{brand}</span>
              <br />
              <span className="text-foreground/90">{tagline}</span>
            </h1>
            <p className="mt-6 max-w-lg text-base text-muted-foreground">
              An atelier of handloom sarees from all 29 states of India — Kanchipuram silks,
              Banarasi brocades, Paithani peacocks, Sambalpuri ikats. Each drape, an inheritance.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-gold)] transition hover:bg-primary-glow"
              >
                Enter the atelier
              </Link>
              <Link
                to="/regions"
                className="inline-flex items-center justify-center rounded-full gold-border px-7 py-3 text-sm text-foreground transition hover:bg-primary/10"
              >
                Shop by region
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-3xl glass">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at 30% 20%, oklch(0.32 0.14 20 / 0.7), transparent 60%), linear-gradient(180deg, oklch(0.24 0.08 20), oklch(0.14 0.005 40))",
                }}
              />
              <svg viewBox="0 0 300 400" className="absolute inset-0 h-full w-full">
                <defs>
                  <linearGradient id="drape" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0" stopColor="oklch(0.78 0.14 85)" stopOpacity="0.9" />
                    <stop offset="1" stopColor="oklch(0.32 0.14 20)" stopOpacity="0.9" />
                  </linearGradient>
                </defs>
                {Array.from({ length: 18 }).map((_, i) => (
                  <motion.path
                    key={i}
                    d={`M ${20 + i * 15} 20 Q ${40 + i * 14} 200 ${30 + i * 15} 400`}
                    stroke="url(#drape)"
                    strokeWidth="2"
                    fill="none"
                    opacity={0.35 + (i % 4) * 0.15}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2.4, delay: i * 0.05, ease: "easeOut" }}
                  />
                ))}
              </svg>
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl glass p-4">
                <p className="font-serif text-lg">Kanchipuram · Zari</p>
                <p className="text-xs text-muted-foreground">Featured heirloom · Autumn edit</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-primary/70">The Selection</p>
            <h2 className="mt-2 font-serif text-4xl md:text-5xl">Featured drapes</h2>
          </div>
          <Link to="/shop" className="text-sm text-primary hover:underline">
            View all →
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="rounded-2xl glass p-10 text-center text-sm text-muted-foreground">
            The atelier is being dressed. Add featured products from the admin panel.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {featured.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>

      {/* MAP */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-primary/70">The Cartography of Cloth</p>
          <h2 className="mt-2 font-serif text-4xl md:text-5xl">Shop by region</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
            Every state, its own loom. Hover any region to trace its weaves; click to enter its
            collection.
          </p>
        </div>
        <div className="rounded-3xl glass p-6">
          <IndiaMap states={states} />
        </div>
      </section>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getSiteSettings } from "@/lib/site.functions";
import { listStates } from "@/lib/states.functions";
import { listProducts } from "@/lib/products.functions";
import { listHeroSlides, listTestimonials } from "@/lib/homepage.functions";
import { listPromoContent } from "@/lib/promos.functions";
import { IndiaMap } from "@/components/site/IndiaMap";
import { ProductCard } from "@/components/site/ProductCard";
import { HeroCarousel } from "@/components/site/HeroCarousel";
import { TestimonialsSection } from "@/components/site/TestimonialsSection";
import { Coverflow3D } from "@/components/site/Coverflow3D";
import { OfferMarquee } from "@/components/site/OfferMarquee";
import { UspStrip } from "@/components/site/UspStrip";

const homeQuery = queryOptions({
  queryKey: ["home"],
  queryFn: async () => {
    const [settings, states, products, slides, testimonials, promos] = await Promise.all([
      getSiteSettings(),
      listStates(),
      listProducts({ data: {} }),
      listHeroSlides(),
      listTestimonials(),
      listPromoContent(),
    ]);
    return { settings, states, products, slides, testimonials, promos };
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sakhi Suta — Handcrafted Indian Ethnic Wear & Handloom Sarees" },
      {
        name: "description",
        content:
          "Handloom sarees from every state of India — Kanchipuram, Banarasi, Paithani, Sambalpuri and more. Free shipping, secure prepaid checkout.",
      },
      {
        property: "og:title",
        content: "Sakhi Suta — Handcrafted Indian Ethnic Wear & Handloom Sarees",
      },
      {
        property: "og:description",
        content: "Weaving bonds, celebrating women. Explore heritage sarees from across India.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  const { settings, states, products, slides, testimonials, promos } = data;

  const tagline = settings?.tagline ?? "Elegance Woven in Every Thread";
  const brand = settings?.brand_name ?? "Sakhi Suta";
  const marquee = promos.filter((p) => p.kind === "marquee");
  const usps = promos.filter((p) => p.kind === "usp");
  const featured = products.filter((p) => (p as { featured?: boolean }).featured);
  const newArrivals = products.slice(0, 8);

  return (
    <div>
      <OfferMarquee items={marquee} />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-80"
          style={{ background: "var(--gradient-luxe)" }}
        />
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
          {slides.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="mb-12"
            >
              <HeroCarousel slides={slides} />
            </motion.div>
          )}

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4 text-center text-xs uppercase tracking-[0.4em] text-primary/80"
          >
            A heritage house of drape
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="font-serif text-5xl leading-[1.05] md:text-7xl">
              <span className="gold-text">{brand}</span>
              <br />
              <span className="text-foreground/90">{tagline}</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground">
              An atelier of handloom sarees from all 29 states &amp; 9 U.Ts of India such as
              Sambalpuri ikats, Kanchipuram silks, Banarasi brocades, Paithani peacocks, premium
              night wears, salwar, lehenga and many more. Each drape, narrates a story of
              inheritance.
            </p>

            <p className="mx-auto mt-4 max-w-2xl text-sm font-medium text-primary">
              Our goal is to create a buisness chain wholeover the map.
            </p>

            <p className="mx-auto mt-4 max-w-2xl text-sm text-foreground/80">
              To be a part of our journey, please{" "}
              <Link to="/join" className="text-primary underline underline-offset-4 hover:text-primary-glow">
                connect with us
              </Link>
              .
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-gold)] transition hover:bg-primary-glow"
              >
                Shop the collection
              </Link>
              <Link
                to="/join"
                className="inline-flex items-center justify-center rounded-full gold-border px-7 py-3 text-sm text-foreground transition hover:bg-primary/10"
              >
                Connect with us →
              </Link>
            </div>
          </motion.div>

          {products.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="mt-14"
            >
              <Coverflow3D products={products} />
            </motion.div>
          )}
        </div>
      </section>

      <UspStrip items={usps} />

      {/* NEW ARRIVALS RAIL */}
      {newArrivals.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-primary/70">Fresh off the loom</p>
              <h2 className="mt-2 font-serif text-4xl md:text-5xl">New arrivals</h2>
            </div>
            <Link to="/shop" className="shrink-0 text-sm font-medium text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {newArrivals.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      {/* BESTSELLERS / FEATURED */}
      {featured.length > 0 && (
        <section className="border-y border-border bg-secondary/50">
          <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
            <div className="mb-8 text-center">
              <p className="text-xs uppercase tracking-[0.4em] text-primary/70">Most loved</p>
              <h2 className="mt-2 font-serif text-4xl md:text-5xl">Bestsellers</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {featured.slice(0, 8).map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* THE COLLECTION — map */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-primary/70">The Collection</p>
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

      {/* FULL CATALOGUE */}
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-primary/70">The Catalogue</p>
            <h2 className="mt-2 font-serif text-4xl md:text-5xl">Every drape</h2>
          </div>
          <Link to="/shop" className="text-sm font-medium text-primary hover:underline">
            Open shop →
          </Link>
        </div>
        {products.length === 0 ? (
          <p className="rounded-2xl glass p-10 text-center text-sm text-muted-foreground">
            The atelier is being dressed. Add products from the admin panel.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>

      {/* TESTIMONIALS */}
      <TestimonialsSection items={testimonials} />
    </div>
  );
}

import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, ShoppingBag, Sparkles } from "lucide-react";
import { getProductBySlug } from "@/lib/products.functions";
import { ImageZoom } from "@/components/site/ImageZoom";
import { useCart } from "@/lib/cart-store";
import { formatINR } from "@/lib/format";
import { toggleWishlist } from "@/lib/user.functions";
import { supabase } from "@/integrations/supabase/client";

const q = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(q(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Saree — Sakhi Suta" }] };
    const p = loaderData.product;
    const img = p.images?.[0];
    return {
      meta: [
        { title: `${p.name} — Sakhi Suta` },
        { name: "description", content: p.description?.slice(0, 160) || `${p.name} handloom saree.` },
        { property: "og:title", content: `${p.name} — Sakhi Suta` },
        { property: "og:description", content: p.description?.slice(0, 160) || `${p.name}.` },
        ...(img ? [{ property: "og:image", content: img }, { name: "twitter:image", content: img }] : []),
      ],
    };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-serif text-4xl">Saree not found</h1>
      <Link to="/shop" className="mt-6 inline-block text-primary hover:underline">
        Back to shop
      </Link>
    </div>
  ),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(q(slug));
  const [selected, setSelected] = useState(0);
  const add = useCart((s) => s.add);
  const [wishBusy, setWishBusy] = useState(false);
  const [wishSaved, setWishSaved] = useState(false);

  if (!data) return null;
  const { product, reviews } = data;
  const img = product.images?.[selected] || product.images?.[0];
  const avgRating =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  async function handleWishlist() {
    setWishBusy(true);
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      window.location.href = "/auth?next=" + encodeURIComponent(window.location.pathname);
      return;
    }
    try {
      const res = await toggleWishlist({ data: { productId: product.id } });
      setWishSaved(res.inWishlist);
    } finally {
      setWishBusy(false);
    }
  }

  function handleAdd() {
    add({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price_inr: product.price_inr,
      image: img,
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          {img ? (
            <ImageZoom src={img} alt={product.name} />
          ) : (
            <div className="grid aspect-[9/16] place-items-center rounded-xl bg-secondary font-serif text-6xl text-primary/40">
              {product.name.charAt(0)}
            </div>
          )}
          {product.images && product.images.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto">
              {product.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`h-20 w-16 shrink-0 overflow-hidden rounded-md border transition ${
                    selected === i ? "border-primary" : "border-border/50"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.saree_type && (
            <p className="text-xs uppercase tracking-[0.35em] text-primary/80">{product.saree_type}</p>
          )}
          <h1 className="mt-2 font-serif text-4xl md:text-5xl">{product.name}</h1>

          {avgRating > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-primary">
              {"★".repeat(Math.round(avgRating))}
              {"☆".repeat(5 - Math.round(avgRating))}
              <span className="text-muted-foreground">({reviews.length})</span>
            </div>
          )}

          <div className="mt-6 flex items-baseline flex-wrap gap-3">
            <span className="text-3xl font-semibold text-primary">{formatINR(product.price_inr)}</span>
            {product.compare_at_price_inr && product.compare_at_price_inr > product.price_inr && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatINR(product.compare_at_price_inr)}
                </span>
                <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {Math.round(((product.compare_at_price_inr - product.price_inr) / product.compare_at_price_inr) * 100)}% OFF
                </span>
              </>
            )}
          </div>

          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            {product.description || "A handloom saree woven with reverence for tradition."}
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
            {product.fabric && <Meta label="Fabric" value={product.fabric} />}
            {product.origin && <Meta label="Origin" value={product.origin} />}
            {product.work && <Meta label="Work" value={product.work} />}
            {product.occasion && <Meta label="Occasion" value={product.occasion} />}
          </dl>

          <div className="mt-10 flex flex-wrap gap-3">
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-gold)] transition hover:bg-primary-glow"
            >
              <ShoppingBag className="h-4 w-4" /> Add to cart
            </button>
            <Link
              to="/cart"
              onClick={handleAdd}
              className="inline-flex items-center gap-2 rounded-full gold-border px-6 py-3 text-sm text-foreground hover:bg-primary/10"
            >
              <Sparkles className="h-4 w-4" /> Buy now
            </Link>
            <button
              onClick={handleWishlist}
              disabled={wishBusy}
              className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-3 text-sm hover:text-primary"
            >
              <Heart className={`h-4 w-4 ${wishSaved ? "fill-primary text-primary" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {reviews.length > 0 && (
        <section className="mt-20">
          <h2 className="font-serif text-3xl">Reviews</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {reviews.slice(0, 6).map((r) => (
              <div key={r.id} className="rounded-xl glass p-5">
                <div className="text-primary">
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </div>
                {r.body && <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/40 p-3">
      <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}

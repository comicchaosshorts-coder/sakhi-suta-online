import { Link } from "@tanstack/react-router";
import { useTilt } from "@/lib/hooks";
import { formatINR } from "@/lib/format";
import { AutoImage } from "@/components/site/AutoImage";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price_inr: number;
  compare_at_price_inr?: number | null;
  images: string[];
  saree_type?: string | null;
  fabric?: string | null;
};

export function ProductCard({ p }: { p: ProductCardData }) {
  const ref = useTilt<HTMLAnchorElement>();
  const img = p.images?.[0];
  return (
    <Link
      to="/product/$slug"
      params={{ slug: p.slug }}
      ref={ref}
      className="tilt-card group relative block overflow-hidden rounded-xl glass"
    >
      <div className="relative overflow-hidden bg-secondary">
        {img ? (
          <AutoImage
            src={img}
            alt={p.name}
            imgClassName="transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex aspect-[9/16] w-full items-center justify-center font-serif text-primary/40">
            {p.name.charAt(0)}
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        {p.saree_type && (
          <span className="absolute left-3 top-3 rounded-full border border-primary/40 bg-background/60 px-3 py-1 text-[10px] uppercase tracking-widest text-primary">
            {p.saree_type}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-serif text-lg leading-tight text-foreground">{p.name}</h3>
        {p.fabric && <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{p.fabric}</p>}
        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          <span className="text-lg font-semibold text-primary">{formatINR(p.price_inr)}</span>
          {p.compare_at_price_inr && p.compare_at_price_inr > p.price_inr && (
            <>
              <span className="text-xs text-muted-foreground line-through">
                {formatINR(p.compare_at_price_inr)}
              </span>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                {Math.round(((p.compare_at_price_inr - p.price_inr) / p.compare_at_price_inr) * 100)}% OFF
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

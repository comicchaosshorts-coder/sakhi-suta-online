import { Link } from "@tanstack/react-router";
import { useRef } from "react";
import type { ProductCardData } from "@/components/site/ProductCard";

export type CategoryTile = {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  opens_saree_categories: boolean;
};

export function CategoryTiles({
  products,
  tiles = [],
}: {
  products: ProductCardData[];
  tiles?: CategoryTile[];
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; scrollLeft: number } | null>(null);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
      <div
        ref={railRef}
        className="flex cursor-grab gap-5 overflow-x-auto pb-2 select-none [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden md:justify-center md:gap-10"
        onMouseDown={(event) => {
          const rail = railRef.current;
          if (!rail) return;
          dragStart.current = { x: event.clientX, scrollLeft: rail.scrollLeft };
        }}
        onMouseMove={(event) => {
          const rail = railRef.current;
          if (!rail || !dragStart.current) return;
          rail.scrollLeft = dragStart.current.scrollLeft - (event.clientX - dragStart.current.x);
        }}
        onMouseUp={() => {
          dragStart.current = null;
        }}
        onMouseLeave={() => {
          dragStart.current = null;
        }}
      >
        {tiles.map((t) => ({
              key: t.id,
              name: t.name,
              image: t.image_url || undefined,
               fallback: products.find((product) =>
                 `${product.saree_type ?? ""} ${product.name}`.toLowerCase().includes(t.name.toLowerCase()),
               )?.images?.[0],
               slug: t.slug,
               opensSarees: t.opens_saree_categories,
             })).map((item) => {
          const inner = (
            <>
              <span className="grid aspect-square w-24 place-items-center overflow-hidden rounded-full border border-border bg-secondary shadow-[var(--shadow-deep)] md:w-32">
                {item.image || item.fallback ? (
                  <img
                    src={item.image || item.fallback}
                    alt={`${item.name} sarees`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    draggable={false}
                    loading="lazy"
                  />
                ) : (
                  <span className="font-serif text-3xl text-primary/50">
                    {item.name.charAt(0)}
                  </span>
                )}
              </span>
              <span className="font-serif text-lg text-foreground">{item.name}</span>
            </>
          );
          const cls =
            "group flex w-24 shrink-0 flex-col items-center gap-3 text-center md:w-32";

          return item.opensSarees ? (
            <Link key={item.key} to="/sarees" draggable={false} className={cls}>
              {inner}
            </Link>
          ) : (
            <Link key={item.key} to="/category/$slug" params={{ slug: item.slug }} draggable={false} className={cls}>
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
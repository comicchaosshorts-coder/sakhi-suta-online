import { Link } from "@tanstack/react-router";
import { useRef } from "react";
import type { ProductCardData } from "@/components/site/ProductCard";

const categories = ["Katan", "Banarasi", "Kanchipuram", "Paithani"];

export type CategoryTile = {
  id: string;
  name: string;
  image_url: string;
  link_url: string | null;
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
        {categories.map((category, index) => {
          const matchingProduct = products.find((product) =>
            `${product.saree_type ?? ""} ${product.name}`.toLowerCase().includes(category.toLowerCase()),
          );
          const fallbackProduct = products[index % Math.max(products.length, 1)];
          const image = matchingProduct?.images?.[0] ?? fallbackProduct?.images?.[0];

          return (
            <Link
              key={category}
              to="/shop"
              draggable={false}
              className="group flex w-24 shrink-0 flex-col items-center gap-3 text-center md:w-32"
            >
              <span className="grid aspect-square w-24 place-items-center overflow-hidden rounded-full border border-border bg-secondary shadow-[var(--shadow-deep)] md:w-32">
                {image ? (
                  <img
                    src={image}
                    alt={`${category} sarees`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    draggable={false}
                    loading="lazy"
                  />
                ) : (
                  <span className="font-serif text-3xl text-primary/50">{category.charAt(0)}</span>
                )}
              </span>
              <span className="font-serif text-lg text-foreground">{category}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
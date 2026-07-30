import type { PromoRow } from "@/lib/promos.functions";

export function OfferMarquee({ items }: { items: PromoRow[] }) {
  if (items.length === 0) return null;
  const line = [...items, ...items];

  return (
    <div className="overflow-hidden border-y border-accent/60 bg-accent py-2.5">
      <div className="marquee-track">
        {line.map((it, idx) => (
          <span
            key={`${it.id}-${idx}`}
            className="mx-6 text-[11px] font-semibold uppercase tracking-[0.28em] text-accent-foreground md:text-xs"
          >
            {it.text}
            <span className="ml-6 text-primary">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

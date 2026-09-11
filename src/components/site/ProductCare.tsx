import { configuredCare, type CareSource } from "@/lib/product-care";

export function ProductCare({ product }: { product: CareSource }) {
  const items = configuredCare(product);
  const note = product.care_note?.trim();
  if (items.length === 0 && !note) return null;

  return (
    <section aria-labelledby="product-care-heading" className="mt-10">
      <h2 id="product-care-heading" className="font-serif text-2xl">
        Product Care
      </h2>
      {items.length > 0 && (
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <li
                key={it.key}
                className="flex items-start gap-3 rounded-xl border border-border/50 bg-secondary/30 p-3"
              >
                <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {it.label}
                  </p>
                  <p className="mt-0.5 break-words text-sm">{it.value}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {note && (
        <div className="mt-4 rounded-xl border border-border/40 p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Additional Care Instructions
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{note}</p>
        </div>
      )}
    </section>
  );
}

import { Truck, ShieldCheck, Sparkles, BadgeCheck } from "lucide-react";
import type { PromoRow } from "@/lib/promos.functions";

const ICONS = [Sparkles, BadgeCheck, Truck, ShieldCheck];

export function UspStrip({ items }: { items: PromoRow[] }) {
  if (items.length === 0) return null;
  return (
    <section className="border-y border-border bg-secondary/60">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4 md:px-8">
        {items.map((it, idx) => {
          const Icon = ICONS[idx % ICONS.length];
          return (
            <div key={it.id} className="flex flex-col items-center gap-2 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <p className="text-sm font-medium text-foreground">{it.text}</p>
              {it.subtext && <p className="text-xs text-muted-foreground">{it.subtext}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

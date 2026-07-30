import { useEffect, useState } from "react";
import type { PromoRow } from "@/lib/promos.functions";

export function AnnouncementBar({ items }: { items: PromoRow[] }) {
  const [i, setI] = useState(0);
  const count = items.length;

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setI((v) => (v + 1) % count), 4000);
    return () => clearInterval(t);
  }, [count]);

  if (count === 0) return null;
  const current = items[i % count];

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-center px-4 text-center">
        <p key={current.id} className="truncate text-[11px] font-medium tracking-[0.18em] uppercase md:text-xs">
          {current.text}
        </p>
      </div>
    </div>
  );
}

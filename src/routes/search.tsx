import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { searchProducts } from "@/lib/products.functions";
import { ProductCard } from "@/components/site/ProductCard";
import type { ProductCardData } from "@/components/site/ProductCard";

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "Search — Sakhi Suta" }] }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(false);

  async function onChange(v: string) {
    setQ(v);
    if (v.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const r = await searchProducts({ data: { q: v.trim() } });
      setResults(r as ProductCardData[]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 md:px-8">
      <h1 className="font-serif text-5xl">Search the atelier</h1>
      <input
        autoFocus
        value={q}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Try Banarasi, Kanchipuram, Bandhani…"
        className="mt-6 w-full rounded-full gold-border bg-input/40 px-6 py-4 text-lg outline-none focus:border-primary"
      />
      {loading && <p className="mt-6 text-muted-foreground">Searching…</p>}
      {!loading && q.length >= 2 && results.length === 0 && (
        <p className="mt-6 text-muted-foreground">No drapes matched.</p>
      )}
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
        {results.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}

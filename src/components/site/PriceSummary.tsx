import { formatINR } from "@/lib/format";
import type { Quote } from "@/lib/pricing-types";

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div
      className={`flex justify-between gap-3 ${
        bold ? "text-base font-semibold text-foreground" : accent ? "text-primary" : "text-muted-foreground"
      }`}
    >
      <span className="min-w-0 break-words">{label}</span>
      <span className="whitespace-nowrap">{value}</span>
    </div>
  );
}

export function PriceSummary({
  quote,
  fallbackSubtotal,
  loading,
}: {
  quote: Quote | undefined;
  fallbackSubtotal: number;
  loading?: boolean;
}) {
  const subtotal = quote?.subtotal_inr ?? fallbackSubtotal;
  const shipping = quote?.shipping_inr ?? 0;
  const total = quote?.total_inr ?? fallbackSubtotal;

  return (
    <div className="mt-4 space-y-2 text-sm">
      <Row label="Subtotal" value={formatINR(subtotal)} />
      {quote?.discounts.map((d, i) => (
        <Row key={`${d.kind}-${i}`} label={d.label} value={`-${formatINR(d.amount_inr)}`} accent />
      ))}
      <Row label="Shipping" value={shipping === 0 ? "Free" : formatINR(shipping)} />
      <div className="my-3 h-px bg-border/60" />
      <Row label="Total" value={formatINR(total)} bold />
      {loading && <p className="text-[11px] text-muted-foreground">Updating offers…</p>}
      {quote?.messages.map((m) => (
        <p key={m} className="text-[11px] text-primary">
          {m}
        </p>
      ))}
      {quote?.removed.length ? (
        <p className="text-[11px] text-destructive">
          Unavailable and removed from pricing: {quote.removed.join(", ")}
        </p>
      ) : null}
    </div>
  );
}

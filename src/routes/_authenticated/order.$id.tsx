import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getMyOrderTracking } from "@/lib/orders.functions";
import { formatINR } from "@/lib/format";
import {
  PAYMENT_LABELS,
  STATUS_LABELS,
  TIMELINE_STAGES,
  isException,
  stageIndex,
} from "@/lib/order-status";
import { useRealtimeInvalidate } from "@/lib/use-realtime";

export const Route = createFileRoute("/_authenticated/order/$id")({
  head: () => ({ meta: [{ title: "Track your order — Sakhi Suta" }] }),
  component: TrackOrder,
});

type Item = {
  name: string;
  variantName?: string | null;
  quantity: number;
  price_inr: number;
  image?: string | null;
};

function TrackOrder() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["order-tracking", id],
    queryFn: () => getMyOrderTracking({ data: { orderId: id } }),
  });

  // Live updates: the database row is the source of truth.
  useRealtimeInvalidate({
    channel: `order-tracking-${id}`,
    table: "orders",
    filter: `id=eq.${id}`,
    queryKeys: [
      ["order-tracking", id],
      ["my-orders"],
    ],
  });

  if (q.isLoading) {
    return <p className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground">Loading…</p>;
  }
  if (q.isError || !q.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-muted-foreground">Order not found.</p>
        <Link to="/account" className="mt-4 inline-block underline">
          Back to my account
        </Link>
      </div>
    );
  }

  const order = q.data.order as unknown as {
    id: string;
    status: string;
    payment_status: string;
    created_at: string;
    items: Item[];
    subtotal_inr: number;
    discount_inr: number;
    shipping_inr: number;
    total_inr: number;
    coupon_code: string | null;
  };
  const history = q.data.history as {
    new_status: string;
    created_at: string;
  }[];

  const stampFor = (statuses: readonly string[]) => {
    const hit = history.find((h) => statuses.includes(h.new_status));
    return hit ? new Date(hit.created_at).toLocaleString() : null;
  };

  const current = stageIndex(order.status);
  const exception = isException(order.status);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-16">
      <Link to="/account" className="text-xs uppercase tracking-widest text-primary">
        ← My account
      </Link>
      <h1 className="mt-3 font-serif text-4xl md:text-5xl">Track order</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        #{order.id.slice(0, 8)} · placed {new Date(order.created_at).toLocaleString()}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-primary/15 px-3 py-1 uppercase tracking-widest text-primary">
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
        <span className="rounded-full border border-border/60 px-3 py-1">
          Payment: {PAYMENT_LABELS[order.payment_status] ?? order.payment_status}
        </span>
      </div>

      <section className="mt-8 rounded-2xl glass p-5 md:p-6">
        {exception ? (
          <div>
            <p className="font-serif text-2xl text-destructive">
              {STATUS_LABELS[order.status] ?? order.status}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              This order is not in delivery progress. If you believe this is a mistake, contact us at
              +91 63706 00422.
            </p>
          </div>
        ) : (
          <ol className="space-y-4">
            {TIMELINE_STAGES.map((stage, i) => {
              const done = current > i;
              const active = current === i;
              const stamp = stampFor(stage.statuses);
              return (
                <li key={stage.key} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${
                      done
                        ? "bg-primary text-primary-foreground"
                        : active
                          ? "bg-primary/20 text-primary ring-2 ring-primary"
                          : "border border-border/60 text-muted-foreground"
                    }`}
                  >
                    {done ? "✓" : active ? "●" : "○"}
                  </span>
                  <div>
                    <p
                      className={
                        active
                          ? "font-semibold text-primary"
                          : done
                            ? ""
                            : "text-muted-foreground"
                      }
                    >
                      {stage.label}
                    </p>
                    {(done || active) && stamp && (
                      <p className="text-xs text-muted-foreground">{stamp}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="mt-8 rounded-2xl glass p-5 md:p-6">
        <h2 className="font-serif text-2xl">Items</h2>
        <div className="mt-4 space-y-3">
          {(order.items ?? []).map((it, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              {it.image && (
                <img
                  src={it.image}
                  alt=""
                  className="h-16 w-14 rounded-md bg-secondary object-contain"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate">{it.name}</p>
                {it.variantName && (
                  <p className="text-xs text-muted-foreground">{it.variantName}</p>
                )}
                <p className="text-xs text-muted-foreground">Qty {it.quantity}</p>
              </div>
              <span className="font-semibold">{formatINR(it.price_inr * it.quantity)}</span>
            </div>
          ))}
        </div>
        <dl className="mt-5 space-y-1 border-t border-border/50 pt-4 text-sm">
          <Row label="Subtotal" value={formatINR(order.subtotal_inr)} />
          {order.discount_inr > 0 && (
            <Row
              label={`Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}`}
              value={`− ${formatINR(order.discount_inr)}`}
            />
          )}
          <Row label="Shipping" value={order.shipping_inr ? formatINR(order.shipping_inr) : "Free"} />
          <div className="flex justify-between pt-2 font-serif text-xl">
            <span>Total</span>
            <span>{formatINR(order.total_inr)}</span>
          </div>
        </dl>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminListOrders } from "@/lib/admin.functions";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: Orders,
});

function Orders() {
  const q = useQuery({ queryKey: ["admin-orders"], queryFn: () => adminListOrders() });
  return (
    <div>
      <h1 className="font-serif text-4xl">Orders</h1>
      <div className="mt-6 space-y-3">
        {q.data?.map((o) => (
          <div key={o.id} className="rounded-xl glass p-4 text-sm">
            <div className="flex justify-between">
              <span className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</span>
              <span className="rounded-full bg-primary/15 px-3 py-0.5 text-xs uppercase tracking-widest text-primary">
                {o.status}
              </span>
            </div>
            <div className="mt-1 flex justify-between text-muted-foreground">
              <span>{new Date(o.created_at).toLocaleString()}</span>
              <span className="font-semibold text-foreground">{formatINR(o.total_inr)}</span>
            </div>
          </div>
        ))}
        {q.data?.length === 0 && <p className="text-muted-foreground">No orders yet.</p>}
      </div>
    </div>
  );
}

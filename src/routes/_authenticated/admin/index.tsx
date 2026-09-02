import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminListOrders, adminListProducts } from "@/lib/admin.functions";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dash,
});

function Dash() {
  const orders = useQuery({ queryKey: ["admin-orders"], queryFn: () => adminListOrders() });
  const products = useQuery({ queryKey: ["admin-products"], queryFn: () => adminListProducts() });
  const revenue =
    orders.data
      ?.filter((o) => (o as { payment_status?: string }).payment_status === "paid")
      .reduce((s, o) => s + o.total_inr, 0) ?? 0;


  return (
    <div>
      <h1 className="font-serif text-4xl">Dashboard</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Stat label="Products" value={String(products.data?.length ?? "—")} />
        <Stat label="Orders" value={String(orders.data?.length ?? "—")} />
        <Stat label="Revenue (paid)" value={formatINR(revenue)} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl glass p-6">
      <p className="text-xs uppercase tracking-widest text-primary/70">{label}</p>
      <p className="mt-2 font-serif text-4xl">{value}</p>
    </div>
  );
}

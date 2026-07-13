import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listMyOrders } from "@/lib/orders.functions";
import { listWishlist } from "@/lib/user.functions";
import { isCurrentUserAdmin } from "@/lib/admin.functions";
import { formatINR } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "My account — Sakhi Suta" }] }),
  component: Account,
});

function Account() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const orders = useQuery({ queryKey: ["my-orders"], queryFn: () => listMyOrders() });
  const wl = useQuery({ queryKey: ["wishlist"], queryFn: () => listWishlist() });
  const admin = useQuery({ queryKey: ["is-admin"], queryFn: () => isCurrentUserAdmin() });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 md:px-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-5xl">My account</h1>
        <div className="flex gap-2">
          {admin.data?.isAdmin && (
            <Link to="/admin" className="rounded-full gold-border px-4 py-2 text-sm hover:bg-primary/10">
              Admin
            </Link>
          )}
          <button onClick={signOut} className="rounded-full border border-border/60 px-4 py-2 text-sm hover:text-primary">
            Sign out
          </button>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="font-serif text-2xl">Orders</h2>
        {orders.isLoading ? (
          <p className="mt-4 text-muted-foreground">Loading…</p>
        ) : !orders.data || orders.data.length === 0 ? (
          <p className="mt-4 text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.data.map((o) => (
              <div key={o.id} className="rounded-xl glass p-4 text-sm">
                <div className="flex justify-between">
                  <span className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</span>
                  <span className="rounded-full bg-primary/15 px-3 py-0.5 text-xs uppercase tracking-widest text-primary">
                    {o.status}
                  </span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString()}
                  </span>
                  <span className="font-semibold">{formatINR(o.total_inr)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl">Wishlist</h2>
        {wl.isLoading ? (
          <p className="mt-4 text-muted-foreground">Loading…</p>
        ) : !wl.data || wl.data.length === 0 ? (
          <p className="mt-4 text-muted-foreground">Nothing saved yet.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {wl.data.map(
              (w) =>
                w.products && (
                  <Link
                    key={w.product_id}
                    to="/product/$slug"
                    params={{ slug: w.products.slug }}
                    className="rounded-xl glass p-3 text-sm hover:text-primary"
                  >
                    {w.products.images?.[0] && (
                      <img src={w.products.images[0]} alt="" className="w-full rounded-md object-contain bg-secondary" />
                    )}
                    <div className="mt-2 truncate">{w.products.name}</div>
                    <div className="text-primary">{formatINR(w.products.price_inr)}</div>
                  </Link>
                ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}

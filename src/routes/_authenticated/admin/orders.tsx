import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminListOrdersFiltered,
  adminUpdateOrderStatus,
  adminCancelArchiveOrders,
  adminDeleteTestOrder,
} from "@/lib/admin.functions";
import { formatINR } from "@/lib/format";
import {
  ADMIN_SETTABLE_STATUSES,
  ORDER_STATUSES,
  PAYMENT_LABELS,
  STATUS_LABELS,
  ageLabel,
} from "@/lib/order-status";
import { useRealtimeInvalidate } from "@/lib/use-realtime";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: Orders,
});

type Order = {
  id: string;
  items: unknown;
  total_inr: number;
  status: string;
  payment_status: string;
  archived: boolean;
  coupon_code: string | null;
  created_at: string;
  shipping_address: { full_name?: string; phone?: string } | null;
};

function itemCount(items: unknown): number {
  if (!Array.isArray(items)) return 0;
  return items.reduce((s: number, i) => s + Number((i as { quantity?: number })?.quantity ?? 1), 0);
}

function Orders() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("pending");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const q = useQuery<Order[]>({
    queryKey: ["admin-orders-filtered", status, includeArchived],
    queryFn: () =>
      adminListOrdersFiltered({
        data: { status: status === "all" ? null : status, includeArchived },
      }) as Promise<Order[]>,
  });

  useRealtimeInvalidate({
    channel: "admin-orders-stream",
    table: "orders",
    queryKeys: [["admin-orders-filtered"], ["admin-orders"], ["admin-notifications"]],
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-orders-filtered"] });
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const setOrderStatus = useMutation({
    mutationFn: (v: { orderId: string; status: string }) =>
      adminUpdateOrderStatus({ data: v as never }),
    onSuccess: () => {
      toast.success("Order status updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelArchive = useMutation({
    mutationFn: (orderIds: string[]) => adminCancelArchiveOrders({ data: { orderIds } }),
    onSuccess: (r) => {
      toast.success(`Cancelled & archived ${r.cancelled}${r.skipped ? `, skipped ${r.skipped}` : ""}`);
      setSelected([]);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (orderId: string) => adminDeleteTestOrder({ data: { orderId } }),
    onSuccess: () => {
      toast.success("Test order deleted permanently");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = q.data ?? [];
  const eligible = useMemo(
    () =>
      rows.filter(
        (o) => o.payment_status !== "paid" && ["pending", "failed"].includes(o.status),
      ),
    [rows],
  );

  return (
    <div>
      <h1 className="font-serif text-4xl">Orders</h1>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {["pending", "all", ...ORDER_STATUSES.filter((s) => s !== "pending")].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setSelected([]);
            }}
            className={`rounded-full px-3 py-1.5 text-xs ${
              status === s
                ? "bg-primary text-primary-foreground"
                : "gold-border hover:bg-primary/10"
            }`}
          >
            {s === "all" ? "All" : STATUS_LABELS[s] ?? s}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
          />
          Show archived
        </label>
      </div>

      {eligible.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl glass p-3 text-xs">
          <button
            onClick={() => setSelected(eligible.map((o) => o.id))}
            className="rounded-full gold-border px-3 py-1 hover:bg-primary/10"
          >
            Select all eligible ({eligible.length})
          </button>
          {selected.length > 0 && (
            <>
              <button
                onClick={() => setConfirmCancel(true)}
                className="rounded-full border border-destructive/60 px-3 py-1 text-destructive hover:bg-destructive/10"
              >
                Cancel selected ({selected.length})
              </button>
              <button onClick={() => setSelected([])} className="text-muted-foreground underline">
                Clear
              </button>
            </>
          )}
          <span className="text-muted-foreground">
            Only unpaid / abandoned orders can be cancelled in bulk.
          </span>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {rows.map((o) => {
          const canDelete =
            o.payment_status !== "paid" &&
            o.payment_status !== "refunded" &&
            ["pending", "failed", "cancelled"].includes(o.status);
          const isEligible = o.payment_status !== "paid" && ["pending", "failed"].includes(o.status);
          return (
            <div key={o.id} className="rounded-xl glass p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  {isEligible && (
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selected.includes(o.id)}
                      onChange={(e) =>
                        setSelected((s) =>
                          e.target.checked ? [...s, o.id] : s.filter((x) => x !== o.id),
                        )
                      }
                    />
                  )}
                  <div>
                    <span className="font-mono text-xs text-muted-foreground">
                      #{o.id.slice(0, 8)}
                    </span>
                    <div className="mt-0.5">{o.shipping_address?.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {o.shipping_address?.phone ?? ""}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatINR(o.total_inr)}</div>
                  <div className="text-xs text-muted-foreground">
                    {itemCount(o.items)} item(s)
                    {o.coupon_code ? ` · ${o.coupon_code}` : ""}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-primary/15 px-3 py-0.5 uppercase tracking-widest text-primary">
                  {STATUS_LABELS[o.status] ?? o.status}
                </span>
                <span className="rounded-full border border-border/60 px-3 py-0.5">
                  Payment: {PAYMENT_LABELS[o.payment_status] ?? o.payment_status}
                </span>
                {o.archived && (
                  <span className="rounded-full border border-border/60 px-3 py-0.5 text-muted-foreground">
                    Archived
                  </span>
                )}
                <span className="text-muted-foreground">
                  {new Date(o.created_at).toLocaleString()}
                </span>
                {o.status === "pending" && (
                  <span className="text-muted-foreground">· pending {ageLabel(o.created_at)}</span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value=""
                  onChange={(e) =>
                    e.target.value &&
                    setOrderStatus.mutate({ orderId: o.id, status: e.target.value })
                  }
                  className="rounded-full bg-background/60 px-3 py-1 text-xs ring-1 ring-primary/20"
                >
                  <option value="">Change status…</option>
                  {ADMIN_SETTABLE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                {isEligible && (
                  <button
                    onClick={() => {
                      setSelected([o.id]);
                      setConfirmCancel(true);
                    }}
                    className="rounded-full gold-border px-3 py-1 text-xs hover:bg-primary/10"
                  >
                    Cancel &amp; archive
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => setDeleteId(o.id)}
                    className="rounded-full border border-destructive/60 px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
                  >
                    Delete test order
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {!q.isLoading && rows.length === 0 && (
          <p className="text-muted-foreground">No orders in this view.</p>
        )}
        {q.isLoading && <p className="text-muted-foreground">Loading…</p>}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Need the order summary? See the <Link to="/admin" className="underline">dashboard</Link>.
      </p>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel &amp; archive {selected.length} order(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              They will be marked cancelled and hidden from the active workflow. Payment, stock and
              coupon usage are not counted as a sale. Records are kept for history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep them</AlertDialogCancel>
            <AlertDialogAction onClick={() => cancelArchive.mutate(selected)}>
              Cancel &amp; archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this test order permanently?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) del.mutate(deleteId);
                setDeleteId(null);
              }}
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

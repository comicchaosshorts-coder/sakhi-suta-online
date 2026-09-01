import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminListNotifications, adminMarkNotificationsRead } from "@/lib/admin.functions";
import { formatINR } from "@/lib/format";
import { PAYMENT_LABELS, STATUS_LABELS } from "@/lib/order-status";
import { useRealtimeInvalidate } from "@/lib/use-realtime";

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  component: Notifications,
});

type Notif = {
  id: string;
  type: string;
  order_id: string | null;
  customer_name: string | null;
  item_count: number;
  amount_inr: number;
  payment_status: string | null;
  order_status: string | null;
  created_at: string;
  read: boolean;
};

const TYPE_LABEL: Record<string, string> = {
  NEW_ORDER: "🔔 New order received",
  PAYMENT_SUCCESS: "Payment received",
  ORDER_CANCELLED: "Order cancelled",
  ORDER_REFUNDED: "Order refunded",
};

function Notifications() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const q = useQuery<Notif[]>({
    queryKey: ["admin-notifications"],
    queryFn: () => adminListNotifications() as Promise<Notif[]>,
  });

  useRealtimeInvalidate({
    channel: "admin-notifications-page",
    table: "admin_notifications",
    queryKeys: [["admin-notifications"], ["admin-orders-filtered"]],
  });

  const markRead = useMutation({
    mutationFn: (v: { ids?: string[]; all?: boolean }) =>
      adminMarkNotificationsRead({ data: { ids: v.ids ?? null, all: v.all ?? false } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-notifications"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = q.data ?? [];
  const unread = rows.filter((r) => !r.read).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unread} unread · live updates from confirmed orders
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={() => markRead.mutate({ all: true })}
            className="rounded-full gold-border px-4 py-2 text-sm hover:bg-primary/10"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {rows.map((n) => (
          <div
            key={n.id}
            role="button"
            tabIndex={0}
            onClick={() => {
              if (!n.read) markRead.mutate({ ids: [n.id] });
              navigate({ to: "/admin/orders" });
            }}
            onKeyDown={(e) => e.key === "Enter" && navigate({ to: "/admin/orders" })}
            className={`w-full cursor-pointer rounded-xl glass p-4 text-left text-sm ${
              n.read ? "opacity-70" : "ring-1 ring-primary/40"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-serif text-lg text-primary">
                {TYPE_LABEL[n.type] ?? n.type}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(n.created_at).toLocaleString()}
              </span>
            </div>
            <div className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
              <span>Order #{n.order_id?.slice(0, 8) ?? "—"}</span>
              <span>Customer: {n.customer_name ?? "—"}</span>
              <span>Items: {n.item_count}</span>
              <span>Amount: {formatINR(n.amount_inr)}</span>
              <span>Payment: {PAYMENT_LABELS[n.payment_status ?? ""] ?? n.payment_status}</span>
              <span>Status: {STATUS_LABELS[n.order_status ?? ""] ?? n.order_status}</span>
            </div>
            {!n.read && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markRead.mutate({ ids: [n.id] });
                }}
                className="mt-3 rounded-full border border-border/60 px-3 py-1 text-xs hover:text-primary"
              >
                Mark as read
              </button>
            )}
          </div>
        ))}
        {!q.isLoading && rows.length === 0 && (
          <p className="text-muted-foreground">No notifications yet.</p>
        )}
      </div>
    </div>
  );
}

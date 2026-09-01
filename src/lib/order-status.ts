/** Shared, client-safe order status vocabulary. Source of truth is the database. */

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "in_transit",
  "delivered",
  "cancelled",
  "failed",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number] | "paid";

/** Operational statuses an admin may set. */
export const ADMIN_SETTABLE_STATUSES = [
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "in_transit",
  "delivered",
  "cancelled",
] as const;

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Order Confirmed",
  confirmed: "Order Confirmed",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
  failed: "Payment Failed",
  refunded: "Refunded",
};

export const PAYMENT_LABELS: Record<string, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

/** Happy-path progress stages shown to customers. */
export const TIMELINE_STAGES = [
  { key: "placed", label: "Order Placed", statuses: ["pending"] },
  { key: "confirmed", label: "Order Confirmed", statuses: ["paid", "confirmed"] },
  { key: "processing", label: "Processing", statuses: ["processing"] },
  { key: "packed", label: "Packed", statuses: ["packed"] },
  { key: "shipped", label: "Shipped", statuses: ["shipped"] },
  { key: "in_transit", label: "In Transit", statuses: ["in_transit"] },
  { key: "delivered", label: "Delivered", statuses: ["delivered"] },
] as const;

export const EXCEPTION_STATUSES = ["cancelled", "failed", "refunded"] as const;

export function isException(status: string): boolean {
  return (EXCEPTION_STATUSES as readonly string[]).includes(status);
}

/** Index of the stage matching a status, or -1 for exceptional states. */
export function stageIndex(status: string): number {
  return TIMELINE_STAGES.findIndex((s) => (s.statuses as readonly string[]).includes(status));
}

export function ageLabel(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${Math.max(0, mins)}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

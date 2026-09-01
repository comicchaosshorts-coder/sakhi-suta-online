// Centralised, server-authoritative discount / pricing engine.
// Every amount shown to a customer or written to an order comes from here.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Quote, QuoteDiscount, QuoteItemInput, QuoteLine } from "./pricing-types";

type AnyClient = SupabaseClient<Database>;

export type DiscountSettings = Database["public"]["Tables"]["discount_settings"]["Row"];
export type Campaign = Database["public"]["Tables"]["discount_campaigns"]["Row"];
export type Coupon = Database["public"]["Tables"]["coupons"]["Row"];

export const PAID_STATUSES = ["paid", "shipped", "delivered"] as const;

const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function within(start: string | null, end: string | null, now = new Date()) {
  if (start && now < new Date(start)) return false;
  if (end && now > new Date(end)) return false;
  return true;
}

type Variant = {
  id: string;
  name: string;
  price_inr: number;
  images?: string[] | null;
};

/** Resolve cart lines against live DB prices/stock. Client prices are ignored. */
async function resolveLines(
  db: AnyClient,
  items: QuoteItemInput[],
): Promise<{ lines: QuoteLine[]; removed: string[] }> {
  const ids = [...new Set(items.map((i) => i.productId))];
  if (ids.length === 0) return { lines: [], removed: [] };
  const { data: products, error } = await db
    .from("products")
    .select("id,name,slug,price_inr,images,in_stock,saree_type,variants")
    .in("id", ids);
  if (error) throw error;

  const lines: QuoteLine[] = [];
  const removed: string[] = [];
  for (const item of items) {
    const p = products?.find((x) => x.id === item.productId);
    if (!p || !p.in_stock) {
      if (p) removed.push(p.name);
      continue;
    }
    const variants = (Array.isArray(p.variants) ? p.variants : []) as unknown as Variant[];
    const v = item.variantId ? variants.find((x) => x.id === item.variantId) : undefined;
    if (item.variantId && !v) {
      removed.push(p.name);
      continue;
    }
    const qty = Math.max(1, Math.min(20, Math.floor(item.quantity)));
    lines.push({
      productId: p.id,
      variantId: v?.id ?? null,
      variantName: v?.name ?? null,
      name: p.name,
      slug: p.slug,
      price_inr: Number(v ? v.price_inr : p.price_inr),
      quantity: qty,
      image: (v?.images?.[0] ?? p.images?.[0]) ?? null,
      saree_type: p.saree_type ?? null,
    });
  }
  return { lines, removed };
}

function eligibleSubtotal(
  lines: QuoteLine[],
  productIds: string[] | null,
  sareeTypes: string[] | null,
) {
  const pids = productIds ?? [];
  const types = sareeTypes ?? [];
  if (pids.length === 0 && types.length === 0)
    return lines.reduce((s, l) => s + l.price_inr * l.quantity, 0);
  return lines.reduce((s, l) => {
    const ok =
      (pids.length > 0 && pids.includes(l.productId)) ||
      (types.length > 0 && l.saree_type != null && types.includes(l.saree_type));
    return ok ? s + l.price_inr * l.quantity : s;
  }, 0);
}

function capped(amount: number, max: number | null) {
  const a = Math.floor(amount);
  if (max != null && max > 0) return Math.min(a, max);
  return a;
}

// ---------- stacking matrix ----------
function pairAllowed(
  a: QuoteDiscount,
  b: QuoteDiscount,
  s: DiscountSettings,
  campaign: Campaign | null,
  coupon: Coupon | null,
) {
  const kinds = [a.kind, b.kind].sort().join("+");
  const campaignStackable = campaign?.stackable ?? false;
  switch (kinds) {
    case "auto+returning":
      return s.stack_auto_with_returning;
    case "auto+campaign":
      return s.stack_auto_with_campaign && campaignStackable;
    case "campaign+returning":
      return s.stack_returning_with_campaign && campaignStackable;
    case "auto+coupon":
      return s.stack_auto_with_coupon && Boolean(coupon?.combine_with_auto);
    case "coupon+returning":
      return s.stack_returning_with_coupon && Boolean(coupon?.combine_with_returning);
    case "campaign+coupon":
      return (
        s.stack_campaign_with_coupon && Boolean(coupon?.combine_with_campaign) && campaignStackable
      );
    default:
      return false;
  }
}

const COUPON_ERRORS: Record<string, string> = {
  COUPON_NOT_FOUND: "This coupon code is invalid.",
  COUPON_INACTIVE: "This coupon is no longer available.",
  COUPON_NOT_STARTED: "This coupon is not active yet.",
  COUPON_EXPIRED: "This coupon has expired.",
  COUPON_LIMIT_REACHED: "This coupon has reached its usage limit.",
  COUPON_USER_LIMIT_REACHED: "You have already used this coupon.",
};

export function couponErrorMessage(code: string) {
  return COUPON_ERRORS[code] ?? "This coupon code cannot be applied.";
}

export type PricingContext = {
  /** Reads products, settings, campaigns. */
  db: AnyClient;
  /** Privileged client used only for coupon lookup / redemption checks. */
  admin: AnyClient;
  userId: string | null;
};

export type QuoteOptions = {
  items: QuoteItemInput[];
  couponCode?: string | null;
};

export async function buildQuote(ctx: PricingContext, opts: QuoteOptions): Promise<Quote> {
  const { lines, removed } = await resolveLines(ctx.db, opts.items);
  const subtotal = lines.reduce((s, l) => s + l.price_inr * l.quantity, 0);
  const shipping = 0;

  const [{ data: settingsRow }, { data: campaignRows }] = await Promise.all([
    ctx.db.from("discount_settings").select("*").eq("id", 1).maybeSingle(),
    ctx.db.from("discount_campaigns").select("*").eq("active", true),
  ]);
  const s = settingsRow as DiscountSettings | null;

  // ---- returning customer status (account/order history only) ----
  let paidOrders = 0;
  if (ctx.userId) {
    const { count } = await ctx.admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ctx.userId)
      .eq("payment_status", "paid");
    paidOrders = count ?? 0;
  }
  const minOrders = s?.returning_min_orders ?? 1;
  const isReturning = paidOrders >= Math.max(1, minOrders);

  const messages: string[] = [];
  const candidates: QuoteDiscount[] = [];

  // ---- automatic threshold discount ----
  if (s?.auto_enabled && within(s.auto_start_at, s.auto_end_at)) {
    const base = eligibleSubtotal(lines, s.auto_product_ids, s.auto_saree_types);
    const percent = Number(s.auto_percent);
    if (base >= s.auto_min_subtotal_inr && base > 0 && percent > 0) {
      const amount = capped((base * percent) / 100, s.auto_max_discount_inr);
      if (amount > 0) {
        candidates.push({
          kind: "auto",
          label: `Automatic discount (${percent}%)`,
          percent,
          amount_inr: amount,
        });
        messages.push(`Congratulations! You unlocked ${percent}% off.`);
      }
    } else if (base > 0 && percent > 0) {
      messages.push(
        `Add ${rupees(s.auto_min_subtotal_inr - base)} more to unlock your ${percent}% discount.`,
      );
    }
  }

  // ---- returning customer discount ----
  if (s?.returning_enabled && isReturning && within(s.returning_start_at, s.returning_end_at)) {
    const base = eligibleSubtotal(lines, s.returning_product_ids, s.returning_saree_types);
    const percent = Number(s.returning_percent);
    if (base >= s.returning_min_subtotal_inr && base > 0 && percent > 0) {
      const amount = capped((base * percent) / 100, s.returning_max_discount_inr);
      if (amount > 0) {
        candidates.push({
          kind: "returning",
          label: `Returning customer discount (${percent}%)`,
          percent,
          amount_inr: amount,
        });
        messages.push("Welcome back! Your returning customer discount has been applied.");
      }
    }
  }

  // ---- best eligible campaign ----
  let campaign: Campaign | null = null;
  let campaignDiscount: QuoteDiscount | null = null;
  const eligibleCampaigns = ((campaignRows ?? []) as Campaign[])
    .filter((c) => within(c.start_at, c.end_at))
    .filter((c) =>
      c.audience === "all" ||
      (c.audience === "returning" && isReturning) ||
      (c.audience === "first_order" && !isReturning),
    )
    .map((c) => {
      const base = eligibleSubtotal(lines, c.product_ids, c.saree_types);
      const percent = Number(c.percent);
      const raw = base >= c.min_subtotal_inr && base > 0 ? (base * percent) / 100 + c.fixed_inr : 0;
      const amount = Math.min(capped(raw, c.max_discount_inr), base);
      return { c, amount, percent };
    })
    .filter((x) => x.amount > 0)
    .sort((a, b) => b.c.priority - a.c.priority || b.amount - a.amount);

  if (eligibleCampaigns.length > 0) {
    const best = eligibleCampaigns[0]!;
    campaign = best.c;
    campaignDiscount = {
      kind: "campaign",
      label: best.percent > 0 ? `${best.c.name} (${best.percent}%)` : best.c.name,
      percent: best.percent > 0 ? best.percent : null,
      amount_inr: best.amount,
      campaign_id: best.c.id,
    };
    candidates.push(campaignDiscount);
  }

  // ---- coupon ----
  let coupon: Coupon | null = null;
  let couponDiscount: QuoteDiscount | null = null;
  let couponState: Quote["coupon"] = null;
  const code = (opts.couponCode ?? "").trim().toUpperCase();
  if (code) {
    const { data: row } = await ctx.admin
      .from("coupons")
      .select("*")
      .eq("code", code)
      .eq("archived", false)
      .maybeSingle();
    const c = row as Coupon | null;
    const fail = (message: string) => {
      couponState = { code, applied: false, message };
    };
    if (!c) fail(COUPON_ERRORS.COUPON_NOT_FOUND!);
    else if (!c.active) fail(COUPON_ERRORS.COUPON_INACTIVE!);
    else if (c.start_at && new Date() < new Date(c.start_at))
      fail(COUPON_ERRORS.COUPON_NOT_STARTED!);
    else if (c.end_at && new Date() > new Date(c.end_at)) fail(COUPON_ERRORS.COUPON_EXPIRED!);
    else if (c.usage_limit != null && c.used_count >= c.usage_limit)
      fail(COUPON_ERRORS.COUPON_LIMIT_REACHED!);
    else if (c.audience === "returning" && !isReturning)
      fail("This coupon is only for returning customers.");
    else if (c.audience === "first_order" && isReturning)
      fail("This coupon is only valid on your first order.");
    else if (subtotal < c.min_cart_inr)
      fail(`Add ${rupees(c.min_cart_inr - subtotal)} more to use this coupon.`);
    else if (c.max_cart_inr != null && subtotal > c.max_cart_inr)
      fail("This coupon does not apply to this cart value.");
    else {
      // per-customer limit (signed-in customers only)
      let userUses = 0;
      if (ctx.userId) {
        const { count } = await ctx.admin
          .from("coupon_redemptions")
          .select("id", { count: "exact", head: true })
          .eq("coupon_id", c.id)
          .eq("user_id", ctx.userId)
          .neq("status", "released");
        userUses = count ?? 0;
      }
      if (c.per_customer_limit != null && userUses >= c.per_customer_limit) {
        fail(COUPON_ERRORS.COUPON_USER_LIMIT_REACHED!);
      } else {
        const base = eligibleSubtotal(lines, c.product_ids, c.saree_types);
        const percent = Number(c.percent);
        const raw = base > 0 ? (base * percent) / 100 + c.fixed_inr : 0;
        const amount = Math.min(capped(raw, c.max_discount_inr), base);
        if (amount <= 0) {
          fail("This coupon does not apply to the items in your cart.");
        } else {
          coupon = c;
          couponDiscount = {
            kind: "coupon",
            label: `Coupon ${c.code}${percent > 0 ? ` (${percent}%)` : ""}`,
            percent: percent > 0 ? percent : null,
            amount_inr: amount,
            code: c.code,
            coupon_id: c.id,
          };
          couponState = {
            code: c.code,
            applied: true,
            message: `Coupon ${c.code} applied — You saved ${rupees(amount)}.`,
          };
        }
      }
    }
  }

  // ---- stacking / priority resolution ----
  let selected: QuoteDiscount[] = [];
  if (campaign?.overrides_other_discounts && campaignDiscount) {
    selected = [campaignDiscount];
  } else {
    const pool = candidates.slice().sort((a, b) => b.amount_inr - a.amount_inr);
    for (const cand of pool) {
      if (selected.every((sel) => pairAllowed(sel, cand, s!, campaign, coupon))) {
        selected.push(cand);
      } else if (selected.length === 0) {
        selected.push(cand);
      }
    }
  }

  if (couponDiscount) {
    const combinable = selected.every((sel) =>
      pairAllowed(sel, couponDiscount!, s!, campaign, coupon),
    );
    if (combinable) {
      selected.push(couponDiscount);
    } else {
      const selectedTotal = selected.reduce((n, d) => n + d.amount_inr, 0);
      if (couponDiscount.amount_inr >= selectedTotal) {
        selected = [couponDiscount];
      } else {
        couponState = {
          code: couponDiscount.code!,
          applied: false,
          message: "Your existing offer gives a bigger saving, so the coupon was not applied.",
        };
      }
    }
  }

  const discountTotal = Math.min(
    selected.reduce((n, d) => n + d.amount_inr, 0),
    subtotal,
  );
  const total = Math.max(0, subtotal - discountTotal + shipping);

  return {
    lines,
    removed,
    subtotal_inr: subtotal,
    discounts: selected,
    discount_total_inr: discountTotal,
    shipping_inr: shipping,
    total_inr: total,
    coupon: couponState,
    isReturningCustomer: isReturning,
    messages,
  };
}

export function appliedCoupon(quote: Quote) {
  return quote.discounts.find((d) => d.kind === "coupon") ?? null;
}

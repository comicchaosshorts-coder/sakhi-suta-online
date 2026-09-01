import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: any; userId: string };

async function assertAdmin(context: Ctx) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw error;
  if (!data) throw new Error("Forbidden: admin only");
}

async function audit(
  context: Ctx,
  action: string,
  entity: string,
  entityId: string | null,
  details: Record<string, unknown> = {},
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("admin_audit_log").insert({
    actor_id: context.userId,
    action,
    entity,
    entity_id: entityId,
    details: details as never,
  });
}

const dt = z.string().datetime({ offset: true }).nullish();
const idList = z.array(z.string().uuid()).max(500).optional();
const typeList = z.array(z.string().max(80)).max(200).optional();

// ================= SETTINGS =================
export const getDiscountSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("discount_settings")
      .select("*")
      .eq("id", 1)
      .single();
    if (error) throw error;
    return data;
  });

const SettingsSchema = z.object({
  auto_enabled: z.boolean().optional(),
  auto_min_subtotal_inr: z.number().int().min(0).max(10_000_000).optional(),
  auto_percent: z.number().min(0).max(100).optional(),
  auto_max_discount_inr: z.number().int().min(0).nullish(),
  auto_start_at: dt,
  auto_end_at: dt,
  auto_product_ids: idList,
  auto_saree_types: typeList,
  returning_enabled: z.boolean().optional(),
  returning_percent: z.number().min(0).max(100).optional(),
  returning_min_subtotal_inr: z.number().int().min(0).optional(),
  returning_max_discount_inr: z.number().int().min(0).nullish(),
  returning_min_orders: z.number().int().min(1).max(100).optional(),
  returning_start_at: dt,
  returning_end_at: dt,
  returning_product_ids: idList,
  returning_saree_types: typeList,
  stack_auto_with_coupon: z.boolean().optional(),
  stack_returning_with_coupon: z.boolean().optional(),
  stack_returning_with_campaign: z.boolean().optional(),
  stack_campaign_with_coupon: z.boolean().optional(),
  stack_auto_with_returning: z.boolean().optional(),
  stack_auto_with_campaign: z.boolean().optional(),
});

export const updateDiscountSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => SettingsSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("discount_settings").update(data).eq("id", 1);
    if (error) throw error;
    await audit(context, "discount_settings_updated", "discount_settings", "1", data);
    return { ok: true };
  });

// ================= CAMPAIGNS =================
export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("discount_campaigns")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

const CampaignSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(120),
  description: z.string().max(1000).default(""),
  percent: z.number().min(0).max(100).default(0),
  fixed_inr: z.number().int().min(0).default(0),
  min_subtotal_inr: z.number().int().min(0).default(0),
  max_discount_inr: z.number().int().min(0).nullish(),
  product_ids: idList,
  saree_types: typeList,
  audience: z.enum(["all", "first_order", "returning"]).default("all"),
  start_at: dt,
  end_at: dt,
  active: z.boolean().default(false),
  priority: z.number().int().min(0).max(1000).default(0),
  stackable: z.boolean().default(false),
  overrides_other_discounts: z.boolean().default(false),
});

export const saveCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => CampaignSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...fields } = data;
    if (id) {
      const { error } = await context.supabase
        .from("discount_campaigns")
        .update(fields)
        .eq("id", id);
      if (error) throw error;
      await audit(context, "campaign_updated", "discount_campaigns", id, { name: data.name });
      return { ok: true, id };
    }
    const { data: row, error } = await context.supabase
      .from("discount_campaigns")
      .insert(fields)
      .select("id")
      .single();
    if (error) throw error;
    await audit(context, "campaign_created", "discount_campaigns", row.id, { name: data.name });
    return { ok: true, id: row.id as string };
  });

export const setCampaignActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("discount_campaigns")
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) throw error;
    await audit(
      context,
      data.active ? "campaign_activated" : "campaign_deactivated",
      "discount_campaigns",
      data.id,
    );
    return { ok: true };
  });

export const deleteCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("discount_campaigns")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    await audit(context, "campaign_deleted", "discount_campaigns", data.id);
    return { ok: true };
  });

// ================= COUPONS =================
export const listCoupons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data ?? [];
  });

const CouponSchema = z.object({
  id: z.string().uuid().optional(),
  code: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, - and _ only"),
  name: z.string().max(120).default(""),
  description: z.string().max(1000).default(""),
  percent: z.number().min(0).max(100).default(0),
  fixed_inr: z.number().int().min(0).default(0),
  max_discount_inr: z.number().int().min(0).nullish(),
  min_cart_inr: z.number().int().min(0).default(0),
  max_cart_inr: z.number().int().min(0).nullish(),
  audience: z.enum(["all", "first_order", "returning"]).default("all"),
  product_ids: idList,
  saree_types: typeList,
  usage_limit: z.number().int().min(1).nullish(),
  per_customer_limit: z.number().int().min(1).max(100).default(1),
  start_at: dt,
  end_at: dt,
  active: z.boolean().default(true),
  archived: z.boolean().default(false),
  combine_with_auto: z.boolean().default(false),
  combine_with_campaign: z.boolean().default(false),
  combine_with_returning: z.boolean().default(false),
  priority: z.number().int().min(0).max(1000).default(0),
  campaign_id: z.string().uuid().nullish(),
});

export const saveCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => CouponSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...rest } = data;
    const fields = { ...rest, code: rest.code.toUpperCase() };
    if (id) {
      const { error } = await context.supabase.from("coupons").update(fields).eq("id", id);
      if (error) throw error;
      await audit(context, "coupon_updated", "coupons", id, { code: fields.code });
      return { ok: true, id };
    }
    const { data: row, error } = await context.supabase
      .from("coupons")
      .insert({ ...fields, created_by: context.userId })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505" || /duplicate/i.test(error.message))
        throw new Error("A coupon with that code already exists.");
      throw error;
    }
    await audit(context, "coupon_created", "coupons", row.id, { code: fields.code });
    return { ok: true, id: row.id as string };
  });

export const updateCouponFlags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        id: z.string().uuid(),
        active: z.boolean().optional(),
        archived: z.boolean().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("coupons").update(patch).eq("id", id);
    if (error) throw error;
    await audit(context, "coupon_flags_changed", "coupons", id, patch);
    return { ok: true };
  });

export const duplicateCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: src, error } = await context.supabase
      .from("coupons")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw error;
    const { id, created_at, updated_at, used_count, code, ...rest } = src as Record<string, any>;
    const suffix = randomCode(4);
    const { data: row, error: iErr } = await context.supabase
      .from("coupons")
      .insert({ ...rest, code: `${code}-${suffix}`, active: false, created_by: context.userId })
      .select("id")
      .single();
    if (iErr) throw iErr;
    await audit(context, "coupon_duplicated", "coupons", row.id, { from: data.id });
    return { ok: true, id: row.id as string };
  });

// Cryptographically random, unambiguous alphabet (no O/0/I/1).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomCode(len: number) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export const bulkGenerateCoupons = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        prefix: z
          .string()
          .max(20)
          .regex(/^[A-Za-z0-9_-]*$/)
          .default(""),
        count: z.number().int().min(1).max(500),
        length: z.number().int().min(4).max(12).default(6),
        percent: z.number().min(0).max(100).default(0),
        fixed_inr: z.number().int().min(0).default(0),
        max_discount_inr: z.number().int().min(0).nullish(),
        min_cart_inr: z.number().int().min(0).default(0),
        usage_limit: z.number().int().min(1).nullish(),
        per_customer_limit: z.number().int().min(1).max(100).default(1),
        end_at: dt,
        campaign_id: z.string().uuid().nullish(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { count, length, prefix, ...shared } = data;
    const pre = prefix ? `${prefix.toUpperCase()}-` : "";
    const codes = new Set<string>();
    while (codes.size < count) codes.add(`${pre}${randomCode(length)}`);
    const rows = [...codes].map((code) => ({
      ...shared,
      code,
      name: prefix ? `${prefix.toUpperCase()} bulk coupon` : "Bulk coupon",
      active: true,
      created_by: context.userId,
    }));
    const { data: inserted, error } = await context.supabase
      .from("coupons")
      .insert(rows)
      .select("code");
    if (error) throw error;
    await audit(context, "coupons_bulk_generated", "coupons", null, { count, prefix: pre });
    return { codes: (inserted ?? []).map((r: { code: string }) => r.code) };
  });

// ================= ANALYTICS =================
export const discountAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const paid = ["paid", "shipped", "delivered"] as const;
    const [orders, redemptions, campaigns] = await Promise.all([
      context.supabase
        .from("orders")
        .select("id,total_inr,discount_inr,discount_breakdown,coupon_code,status,created_at")
        .eq("payment_status", "paid")
        .order("created_at", { ascending: false })
        .limit(1000),
      context.supabase
        .from("coupon_redemptions")
        .select("coupon_code,discount_inr,status,created_at")
        .neq("status", "released")
        .limit(2000),
      context.supabase.from("discount_campaigns").select("id,name,active,start_at,end_at"),
    ]);

    const rows = (orders.data ?? []) as any[];
    const totalDiscount = rows.reduce((n, o) => n + (o.discount_inr ?? 0), 0);
    const promoOrders = rows.filter((o) => (o.discount_inr ?? 0) > 0);
    const couponRevenue = rows
      .filter((o) => o.coupon_code)
      .reduce((n, o) => n + (o.total_inr ?? 0), 0);

    const byCoupon = new Map<string, { code: string; uses: number; discount: number }>();
    for (const r of (redemptions.data ?? []) as any[]) {
      const e = byCoupon.get(r.coupon_code) ?? { code: r.coupon_code, uses: 0, discount: 0 };
      e.uses += 1;
      e.discount += r.discount_inr ?? 0;
      byCoupon.set(r.coupon_code, e);
    }

    const byDate = new Map<string, { date: string; orders: number; discount: number }>();
    for (const o of promoOrders) {
      const d = String(o.created_at).slice(0, 10);
      const e = byDate.get(d) ?? { date: d, orders: 0, discount: 0 };
      e.orders += 1;
      e.discount += o.discount_inr ?? 0;
      byDate.set(d, e);
    }

    const byCampaign = new Map<string, { name: string; uses: number; discount: number }>();
    for (const o of promoOrders) {
      for (const d of (o.discount_breakdown ?? []) as any[]) {
        if (d.kind !== "campaign") continue;
        const e = byCampaign.get(d.label) ?? { name: d.label, uses: 0, discount: 0 };
        e.uses += 1;
        e.discount += d.amount_inr ?? 0;
        byCampaign.set(d.label, e);
      }
    }

    const now = new Date();
    const camps = (campaigns.data ?? []) as any[];
    return {
      totalDiscount,
      totalPromoOrders: promoOrders.length,
      totalRedemptions: (redemptions.data ?? []).length,
      couponRevenue,
      topCoupons: [...byCoupon.values()].sort((a, b) => b.uses - a.uses).slice(0, 10),
      topByValue: [...byCoupon.values()].sort((a, b) => b.discount - a.discount).slice(0, 10),
      usageByDate: [...byDate.values()].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 30),
      campaignUsage: [...byCampaign.values()].sort((a, b) => b.discount - a.discount),
      activeCampaigns: camps.filter(
        (c) =>
          c.active &&
          (!c.start_at || new Date(c.start_at) <= now) &&
          (!c.end_at || new Date(c.end_at) >= now),
      ),
      upcomingCampaigns: camps.filter((c) => c.start_at && new Date(c.start_at) > now),
      expiredCampaigns: camps.filter((c) => c.end_at && new Date(c.end_at) < now),
    };
  });

export const listAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("admin_audit_log")
      .select("id,action,entity,entity_id,details,created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return data ?? [];
  });

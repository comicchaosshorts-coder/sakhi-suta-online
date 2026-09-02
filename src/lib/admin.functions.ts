import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw error;
  if (!data) throw new Error("Forbidden: admin only");
}

export const isCurrentUserAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: Boolean(data) };
  });

export const grantSelfAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Bootstrap: allow if no admin exists yet
    const { data: existingAdmins } = await context.supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1);
    if (existingAdmins && existingAdmins.length > 0) {
      throw new Error("An admin already exists. Ask an admin to promote you.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw error;
    return { ok: true };
  });

// ---- SITE SETTINGS ----
export const updateSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        brand_name: z.string().min(1).max(100).optional(),
        tagline: z.string().min(1).max(200).optional(),
        color_primary: z.string().max(30).optional(),
        color_bg: z.string().max(30).optional(),
        color_accent: z.string().max(30).optional(),
        logo_url: z.string().max(500).optional().nullable(),
        map_svg_url: z.string().max(500).optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("site_settings")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw error;
    return { ok: true };
  });

// ---- MAP SVG UPLOAD ----
export const uploadMapSvg = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ svg: z.string().min(20).max(2_000_000) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const key = `india-map-${Date.now()}.svg`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("brand-assets")
      .upload(key, new Blob([data.svg], { type: "image/svg+xml" }), {
        upsert: true,
        contentType: "image/svg+xml",
      });
    if (upErr) throw upErr;
    await context.supabase.from("site_settings").update({ map_svg_url: key }).eq("id", 1);
    return { ok: true, key };
  });

// ---- PRODUCTS ----
const VariantInput = z.object({
  id: z.string().min(1).max(60),
  name: z.string().min(1).max(100),
  description: z.string().max(2000).default(""),
  price_inr: z.number().int().min(0),
  compare_at_price_inr: z.number().int().min(0).nullable().optional(),
  images: z.array(z.string().max(500)).max(20).default([]),
});

const ProductInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  price_inr: z.number().int().min(0),
  compare_at_price_inr: z.number().int().min(0).optional().nullable(),
  description: z.string().max(5000).default(""),
  fabric: z.string().max(100).optional().nullable(),
  occasion: z.string().max(100).optional().nullable(),
  origin: z.string().max(100).optional().nullable(),
  work: z.string().max(100).optional().nullable(),
  images: z.array(z.string().max(500)).default([]),
  state_id: z.string().uuid().optional().nullable(),
  saree_type: z.string().max(100).optional().nullable(),
  in_stock: z.boolean().default(true),
  featured: z.boolean().default(false),
  variants: z.array(VariantInput).max(30).default([]),
});

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => ProductInput.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.id) {
      const { id, ...rest } = data;
      const { error } = await context.supabase.from("products").update(rest).eq("id", id);
      if (error) throw error;
      return { id };
    }
    const { data: row, error } = await context.supabase
      .from("products")
      .insert(data)
      .select("id")
      .single();
    if (error) throw error;
    return { id: row.id };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

// ---- STATES ----
export const updateStateSareeTypes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ id: z.string().uuid(), saree_types: z.array(z.string().max(80)).max(20) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("states")
      .update({ saree_types: data.saree_types })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ---- ORDERS ----
export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("orders")
      .select("id,user_id,items,total_inr,status,payment_status,archived,created_at,shipping_address")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  });

// ---- UPLOAD signed URL for product images ----
export const createProductImageUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ filename: z.string().min(1).max(200) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const key = `${Date.now()}-${data.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { data: signed, error } = await context.supabase.storage
      .from("product-images")
      .createSignedUploadUrl(key);
    if (error) throw error;
    return { key, uploadUrl: signed.signedUrl, token: signed.token };
  });

export const getPublicProductImageUrl = createServerFn({ method: "GET" })
  .inputValidator((i) => z.object({ key: z.string().min(1).max(300) }).parse(i))
  .handler(async ({ data }) => {
    const { createPublicClient } = await import("./supabase-public.server");
    const supabase = createPublicClient();
    const { data: signed } = await supabase.storage
      .from("product-images")
      .createSignedUrl(data.key, 60 * 60 * 24 * 365);
    return { url: signed?.signedUrl ?? null };
  });

// ============ HERO SLIDES ============
export const adminListHeroSlides = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("hero_slides")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

export const upsertHeroSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        id: z.string().uuid().optional(),
        image_url: z.string().min(1).max(1000),
        caption: z.string().max(200).optional().nullable(),
        link_url: z.string().max(500).optional().nullable(),
        display_order: z.number().int().min(0).max(1000),
        active: z.boolean(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const payload = {
      image_url: data.image_url,
      caption: data.caption ?? null,
      link_url: data.link_url ?? null,
      display_order: data.display_order,
      active: data.active,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("hero_slides")
        .update(payload)
        .eq("id", data.id);
      if (error) throw error;
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("hero_slides")
      .insert(payload)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    return { ok: true, id: row?.id };
  });

export const deleteHeroSlide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("hero_slides").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ PARTNER INQUIRIES ============
export const adminListInquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("partner_inquiries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data ?? [];
  });

export const updateInquiryStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ id: z.string().uuid(), status: z.string().min(1).max(30) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("partner_inquiries")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteInquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("partner_inquiries").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ TESTIMONIALS ============
export const adminListTestimonials = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data ?? [];
  });

export const setTestimonialApproved = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ id: z.string().uuid(), approved: z.boolean() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("testimonials")
      .update({ approved: data.approved })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteTestimonial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("testimonials").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ PROMO CONTENT ============
export const adminListPromoContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("promo_content")
      .select("*")
      .order("kind", { ascending: true })
      .order("display_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

export const upsertPromoContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        id: z.string().uuid().optional(),
        kind: z.enum(["announcement", "marquee", "usp"]),
        text: z.string().trim().min(1).max(200),
        subtext: z.string().max(200).optional().nullable(),
        link_url: z.string().max(500).optional().nullable(),
        display_order: z.number().int().min(0).max(1000),
        active: z.boolean(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const payload = {
      kind: data.kind,
      text: data.text,
      subtext: data.subtext || null,
      link_url: data.link_url || null,
      display_order: data.display_order,
      active: data.active,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("promo_content")
        .update(payload)
        .eq("id", data.id);
      if (error) throw error;
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("promo_content")
      .insert(payload)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    return { ok: true, id: row?.id };
  });

export const deletePromoContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("promo_content").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ================= ORDER MANAGEMENT (admin) =================
import { ADMIN_SETTABLE_STATUSES } from "./order-status";

const ORDER_SELECT =
  "id,user_id,items,subtotal_inr,discount_inr,coupon_code,total_inr,status,payment_status,archived,paid_at,razorpay_order_id,razorpay_payment_id,created_at,updated_at,shipping_address";

/** Filterable admin order list. Oldest-first for pending so abandoned orders surface. */
export const adminListOrdersFiltered = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        status: z.string().max(30).nullish(),
        includeArchived: z.boolean().default(false),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase.from("orders").select(ORDER_SELECT);
    if (data.status) q = q.eq("status", data.status as never);
    if (!data.includeArchived) q = q.eq("archived", false);
    q =
      data.status === "pending"
        ? q.order("created_at", { ascending: true })
        : q.order("created_at", { ascending: false });
    const { data: rows, error } = await q.limit(500);
    if (error) throw error;
    return rows ?? [];
  });

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        orderId: z.string().uuid(),
        status: z.enum(ADMIN_SETTABLE_STATUSES),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    // Operational status only — payment fields are never touched here.
    const { error } = await context.supabase
      .from("orders")
      .update({ status: data.status as never })
      .eq("id", data.orderId);
    if (error) throw error;
    return { ok: true };
  });

/** Safe cleanup: cancel + archive. Never marks payment, never touches stock. */
export const adminCancelArchiveOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ orderIds: z.array(z.string().uuid()).min(1).max(200) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: rows, error: fErr } = await context.supabase
      .from("orders")
      .select("id,status,payment_status")
      .in("id", data.orderIds);
    if (fErr) throw fErr;

    // Only unpaid, non-final orders are eligible for bulk cancellation.
    const eligible = (rows ?? [])
      .filter(
        (o) =>
          o.payment_status !== "paid" &&
          ["pending", "failed", "cancelled"].includes(String(o.status)),
      )
      .map((o) => o.id);
    if (eligible.length === 0) return { cancelled: 0, skipped: (rows ?? []).length };

    const { error } = await context.supabase
      .from("orders")
      .update({ status: "cancelled" as never, archived: true })
      .in("id", eligible);
    if (error) throw error;

    // Release any reserved coupon uses back to the pool (never consumes them).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (const id of eligible) {
      await supabaseAdmin.rpc("settle_coupon_redemption", { _order_id: id, _status: "released" });
    }
    return { cancelled: eligible.length, skipped: (rows ?? []).length - eligible.length };
  });

/** Permanent delete — only for clearly unpaid test/abandoned orders. */
export const adminDeleteTestOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ orderId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: order, error: fErr } = await context.supabase
      .from("orders")
      .select("id,status,payment_status,razorpay_payment_id")
      .eq("id", data.orderId)
      .maybeSingle();
    if (fErr) throw fErr;
    if (!order) throw new Error("Order not found");
    if (
      order.payment_status === "paid" ||
      order.payment_status === "refunded" ||
      order.razorpay_payment_id ||
      !["pending", "failed", "cancelled"].includes(String(order.status))
    ) {
      throw new Error("This order has payment history and cannot be deleted. Archive it instead.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Release the coupon hold first so usage counts stay accurate.
    await supabaseAdmin.rpc("settle_coupon_redemption", {
      _order_id: data.orderId,
      _status: "released",
    });
    const { error } = await supabaseAdmin.from("orders").delete().eq("id", data.orderId);
    if (error) throw error;
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: "delete_test_order",
      entity: "orders",
      entity_id: data.orderId,
      details: { status: order.status, payment_status: order.payment_status },
    });
    return { ok: true };
  });

// ================= ADMIN NOTIFICATIONS =================
export const adminListNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const [{ data: rows, error }, { data: reads }] = await Promise.all([
      context.supabase
        .from("admin_notifications")
        .select("id,type,order_id,customer_name,item_count,amount_inr,payment_status,order_status,created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      context.supabase
        .from("admin_notification_reads")
        .select("notification_id")
        .eq("admin_id", context.userId),
    ]);
    if (error) throw error;
    const readSet = new Set((reads ?? []).map((r) => r.notification_id));
    return (rows ?? []).map((r) => ({ ...r, read: readSet.has(r.id) }));
  });

export const adminMarkNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ ids: z.array(z.string().uuid()).max(500).nullish(), all: z.boolean().default(false) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let ids = data.ids ?? [];
    if (data.all) {
      const { data: rows } = await context.supabase
        .from("admin_notifications")
        .select("id")
        .limit(500);
      ids = (rows ?? []).map((r) => r.id);
    }
    if (ids.length === 0) return { ok: true };
    const { error } = await context.supabase
      .from("admin_notification_reads")
      .upsert(
        ids.map((id) => ({ notification_id: id, admin_id: context.userId })),
        { onConflict: "notification_id,admin_id", ignoreDuplicates: true },
      );
    if (error) throw error;
    return { ok: true };
  });

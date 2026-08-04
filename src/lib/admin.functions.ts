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
      .select("id,user_id,items,total_inr,status,created_at,shipping_address")
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

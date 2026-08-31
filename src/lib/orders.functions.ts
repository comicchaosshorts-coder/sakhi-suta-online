import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AddressSchema = z.object({
  full_name: z.string().min(2).max(100),
  phone: z.string().min(6).max(20),
  line1: z.string().min(2).max(200),
  line2: z.string().max(200).optional().default(""),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().min(4).max(10),
});

// Only identifiers and quantities are accepted from the browser. Prices,
// discounts and totals are recomputed server-side by the pricing engine.
const CartItemSchema = z
  .object({
    productId: z.string().uuid(),
    variantId: z.string().max(100).nullish(),
    quantity: z.number().int().min(1).max(20),
  })
  .passthrough();

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        items: z.array(CartItemSchema).min(1),
        address: AddressSchema,
        couponCode: z.string().max(40).nullish(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { buildQuote } = await import("./pricing.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const quote = await buildQuote(
      { db: context.supabase, admin: supabaseAdmin, userId: context.userId },
      {
        items: data.items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId ?? null,
          quantity: i.quantity,
        })),
        couponCode: data.couponCode ?? null,
      },
    );

    if (quote.lines.length === 0) throw new Error("No purchasable items in your cart.");
    if (quote.coupon && !quote.coupon.applied && data.couponCode) {
      throw new Error(quote.coupon.message);
    }

    const items = quote.lines.map((l) => ({
      productId: l.productId,
      variantId: l.variantId,
      variantName: l.variantName,
      name: l.name,
      price_inr: l.price_inr,
      quantity: l.quantity,
      image: l.image,
    }));
    const couponDiscount = quote.discounts.find((d) => d.kind === "coupon") ?? null;

    const { data: order, error } = await context.supabase
      .from("orders")
      .insert({
        user_id: context.userId,
        items,
        subtotal_inr: quote.subtotal_inr,
        shipping_inr: quote.shipping_inr,
        discount_inr: quote.discount_total_inr,
        // Permanent historical snapshot — never recalculated later.
        discount_breakdown: quote.discounts,
        coupon_code: couponDiscount?.code ?? null,
        total_inr: quote.total_inr,
        shipping_address: data.address,
        status: "pending",
      })
      .select()
      .single();
    if (error) throw error;

    // Atomically reserve the coupon redemption (race-safe, honours limits).
    if (couponDiscount?.coupon_id) {
      const { error: rErr } = await supabaseAdmin.rpc("reserve_coupon", {
        _coupon_id: couponDiscount.coupon_id,
        _user_id: context.userId,
        _order_id: order.id,
        _discount_inr: couponDiscount.amount_inr,
      });
      if (rErr) {
        await supabaseAdmin.from("orders").delete().eq("id", order.id);
        const { couponErrorMessage } = await import("./pricing.server");
        const code = (rErr.message.match(/COUPON_[A-Z_]+/) ?? [])[0] ?? "";
        throw new Error(couponErrorMessage(code));
      }
    }

    const total = quote.total_inr;
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keyId && keySecret) {
      const rzRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa(`${keyId}:${keySecret}`),
        },
        body: JSON.stringify({
          amount: total * 100, // paise
          currency: "INR",
          receipt: order.id,
          notes: { order_id: order.id },
        }),
      });
      if (!rzRes.ok) {
        const errText = await rzRes.text();
        throw new Error(`Razorpay error: ${errText}`);
      }
      const rz = (await rzRes.json()) as { id: string };
      await context.supabase
        .from("orders")
        .update({ razorpay_order_id: rz.id })
        .eq("id", order.id);
      return { order, quote, razorpay: { orderId: rz.id, keyId, amount: total * 100 } };
    }

    return { order, quote, razorpay: null };
  });

export const verifyPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        orderId: z.string().uuid(),
        razorpay_order_id: z.string(),
        razorpay_payment_id: z.string(),
        razorpay_signature: z.string(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new Error("Payment gateway not configured");
    const crypto = await import("crypto");
    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");
    if (expected !== data.razorpay_signature) throw new Error("Invalid signature");

    const { error } = await context.supabase
      .from("orders")
      .update({
        status: "paid",
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature,
      })
      .eq("id", data.orderId)
      .eq("user_id", context.userId);
    if (error) throw error;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.rpc("settle_coupon_redemption", {
      _order_id: data.orderId,
      _status: "consumed",
    });
    return { ok: true };
  });

/** Payment abandoned/failed — frees the reserved coupon use for other shoppers. */
export const abandonOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ orderId: z.string().uuid(), reason: z.enum(["failed", "cancelled"]) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: order } = await context.supabase
      .from("orders")
      .select("id,status")
      .eq("id", data.orderId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!order || order.status !== "pending") return { ok: false };

    await context.supabase
      .from("orders")
      .update({ status: data.reason })
      .eq("id", data.orderId)
      .eq("user_id", context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.rpc("settle_coupon_redemption", {
      _order_id: data.orderId,
      _status: "released",
    });
    return { ok: true };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select(
        "id,items,subtotal_inr,discount_inr,discount_breakdown,coupon_code,total_inr,status,created_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

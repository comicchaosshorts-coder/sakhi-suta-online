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

const CartItemSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1).max(200),
  price_inr: z.number().int().min(0),
  quantity: z.number().int().min(1).max(20),
  image: z.string().max(500).optional(),
});

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        items: z.array(CartItemSchema).min(1),
        address: AddressSchema,
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    // Recompute totals from DB — never trust client prices
    const ids = data.items.map((i) => i.productId);
    const { data: dbProducts, error: pErr } = await context.supabase
      .from("products")
      .select("id,name,price_inr,images,in_stock")
      .in("id", ids);
    if (pErr) throw pErr;

    const items = data.items.map((ci) => {
      const p = dbProducts?.find((x) => x.id === ci.productId);
      if (!p || !p.in_stock) throw new Error(`Product unavailable: ${ci.name}`);
      return {
        productId: p.id,
        name: p.name,
        price_inr: p.price_inr,
        quantity: ci.quantity,
        image: p.images?.[0] ?? null,
      };
    });

    const subtotal = items.reduce((s, i) => s + i.price_inr * i.quantity, 0);
    const shipping = subtotal >= 5000 ? 0 : 99;
    const total = subtotal + shipping;

    const { data: order, error } = await context.supabase
      .from("orders")
      .insert({
        user_id: context.userId,
        items,
        subtotal_inr: subtotal,
        shipping_inr: shipping,
        total_inr: total,
        shipping_address: data.address,
        status: "pending",
      })
      .select()
      .single();
    if (error) throw error;

    // Create Razorpay order if keys configured; otherwise return order for mock flow
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
      return { order, razorpay: { orderId: rz.id, keyId, amount: total * 100 } };
    }

    return { order, razorpay: null };
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
    return { ok: true };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("id,items,total_inr,status,created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

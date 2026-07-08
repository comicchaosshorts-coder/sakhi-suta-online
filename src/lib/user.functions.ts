import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listWishlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("wishlist")
      .select("product_id, products(id,name,slug,price_inr,images,saree_type)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const toggleWishlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ productId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const existing = await context.supabase
      .from("wishlist")
      .select("product_id")
      .eq("user_id", context.userId)
      .eq("product_id", data.productId)
      .maybeSingle();
    if (existing.data) {
      await context.supabase
        .from("wishlist")
        .delete()
        .eq("user_id", context.userId)
        .eq("product_id", data.productId);
      return { inWishlist: false };
    }
    await context.supabase
      .from("wishlist")
      .insert({ user_id: context.userId, product_id: data.productId });
    return { inWishlist: true };
  });

export const addReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        productId: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        body: z.string().max(1000).default(""),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("reviews").insert({
      product_id: data.productId,
      user_id: context.userId,
      rating: data.rating,
      body: data.body,
    });
    if (error) throw error;
    return { ok: true };
  });

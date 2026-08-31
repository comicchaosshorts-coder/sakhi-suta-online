import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Quote } from "./pricing-types";

export const QuoteItemsSchema = z.array(
  z.object({
    productId: z.string().uuid(),
    variantId: z.string().max(100).nullish(),
    quantity: z.number().int().min(1).max(20),
  }),
).max(50);

export const QuoteInputSchema = z.object({
  items: QuoteItemsSchema,
  couponCode: z.string().max(40).nullish(),
});

/**
 * Authoritative cart quote. The browser sends product ids, variant ids and
 * quantities only — every price, discount and total is computed here.
 */
export const quoteCart = createServerFn({ method: "POST" })
  .inputValidator((i) => QuoteInputSchema.parse(i))
  .handler(async ({ data }): Promise<Quote> => {
    const { buildQuote } = await import("./pricing.server");
    const { createPublicClient } = await import("./supabase-public.server");
    const { resolveCaller } = await import("./caller.server");
    const { supabaseAdmin, userId } = await resolveCaller();
    return buildQuote(
      { db: createPublicClient(), admin: supabaseAdmin, userId },
      { items: data.items, couponCode: data.couponCode ?? null },
    );
  });

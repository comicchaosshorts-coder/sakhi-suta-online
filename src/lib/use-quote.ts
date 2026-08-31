import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { quoteCart } from "./pricing.functions";
import type { Quote } from "./pricing-types";
import { useCart } from "./cart-store";

/**
 * Server-authoritative cart quote. The UI only ever displays what the
 * backend calculated — it never computes discounts itself.
 */
export function useQuote() {
  const items = useCart((s) => s.items);
  const couponCode = useCart((s) => s.couponCode);
  const fetchQuote = useServerFn(quoteCart);

  const payload = items.map((i) => ({
    productId: i.productId,
    variantId: i.variantId ?? null,
    quantity: i.quantity,
  }));

  const query = useQuery<Quote>({
    queryKey: ["cart-quote", payload, couponCode],
    enabled: payload.length > 0,
    staleTime: 15_000,
    queryFn: () => fetchQuote({ data: { items: payload, couponCode } }),
  });

  return query;
}

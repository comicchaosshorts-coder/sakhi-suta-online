import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-store";
import type { Quote } from "@/lib/pricing-types";
import { X } from "lucide-react";

export function CouponBox({ quote }: { quote: Quote | undefined }) {
  const couponCode = useCart((s) => s.couponCode);
  const setCoupon = useCart((s) => s.setCoupon);
  const [value, setValue] = useState(couponCode ?? "");

  useEffect(() => {
    if (couponCode) setValue(couponCode);
  }, [couponCode]);

  const state = quote?.coupon ?? null;
  const applied = state?.applied ?? false;

  return (
    <div className="mt-5 border-t border-border/60 pt-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Have a coupon?</p>
      {applied ? (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-full gold-border px-4 py-2 text-sm">
          <span className="font-medium text-primary">{state?.code}</span>
          <button
            type="button"
            onClick={() => {
              setCoupon(null);
              setValue("");
            }}
            aria-label="Remove coupon"
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            placeholder="ENTER COUPON CODE"
            className="min-w-0 flex-1 rounded-md border border-input bg-input/40 px-3 py-2 text-sm uppercase tracking-wider outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => setCoupon(value)}
            disabled={value.trim().length < 3}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      )}
      {state && (
        <p className={`mt-2 text-xs ${applied ? "text-primary" : "text-destructive"}`}>
          {state.message}
        </p>
      )}
    </div>
  );
}

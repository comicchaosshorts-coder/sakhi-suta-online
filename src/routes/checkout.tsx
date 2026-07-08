import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useCart } from "@/lib/cart-store";
import { useHydrated } from "@/lib/hooks";
import { formatINR } from "@/lib/format";
import { createOrder, verifyPayment } from "@/lib/orders.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Sakhi Suta" }] }),
  component: Checkout,
});

const schema = z.object({
  full_name: z.string().min(2, "Enter your name"),
  phone: z.string().min(6, "Enter a valid phone"),
  line1: z.string().min(2, "Enter address"),
  line2: z.string().optional().default(""),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  pincode: z.string().min(4, "Pincode required"),
});

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

function Checkout() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const subtotal = useCart((s) => s.items.reduce((n, i) => n + i.price_inr * i.quantity, 0));
  const [signedIn, setSignedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    // Load Razorpay script once
    if (!document.querySelector('script[src*="checkout.razorpay.com"]')) {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  if (!hydrated) return null;
  const shipping = subtotal >= 5000 ? 0 : 99;
  const total = subtotal + shipping;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }
    if (!signedIn) {
      navigate({ to: "/auth", search: { next: "/checkout" } as never });
      return;
    }
    if (items.length === 0) return;
    setBusy(true);
    try {
      const cartItems = items.map((i) => ({
        productId: i.productId,
        name: i.name,
        price_inr: i.price_inr,
        quantity: i.quantity,
        image: i.image,
      }));
      const res = await createOrder({ data: { items: cartItems, address: parsed.data } });
      if (!res.razorpay) {
        // No Razorpay keys yet — mock success
        clear();
        navigate({ to: "/account/orders" });
        return;
      }
      if (!window.Razorpay) {
        setError("Payment SDK still loading. Please try again in a moment.");
        setBusy(false);
        return;
      }
      const rp = new window.Razorpay({
        key: res.razorpay.keyId,
        amount: res.razorpay.amount,
        currency: "INR",
        name: "Sakhi Suta",
        description: "Handloom saree order",
        order_id: res.razorpay.orderId,
        prefill: { name: form.full_name, contact: form.phone },
        theme: { color: "#D4AF37" },
        handler: async (r: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await verifyPayment({
              data: {
                orderId: res.order.id,
                razorpay_order_id: r.razorpay_order_id,
                razorpay_payment_id: r.razorpay_payment_id,
                razorpay_signature: r.razorpay_signature,
              },
            });
            clear();
            navigate({ to: "/account/orders" });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Payment verification failed");
          }
        },
      });
      rp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 md:px-8">
      <h1 className="font-serif text-5xl">Checkout</h1>
      {items.length === 0 ? (
        <p className="mt-8 text-muted-foreground">Your cart is empty.</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 grid gap-8 md:grid-cols-[1fr_360px]">
          <div className="space-y-4 rounded-xl glass p-6">
            <h2 className="font-serif text-2xl">Shipping address</h2>
            {(
              [
                ["full_name", "Full name"],
                ["phone", "Phone"],
                ["line1", "Address line 1"],
                ["line2", "Address line 2 (optional)"],
                ["city", "City"],
                ["state", "State"],
                ["pincode", "PIN code"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="block">
                <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
                  {label}
                </span>
                <input
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="w-full rounded-md border border-input bg-input/40 px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>
            ))}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {!signedIn && (
              <p className="text-sm text-muted-foreground">
                You'll be asked to sign in before payment.
              </p>
            )}
          </div>
          <div className="h-fit rounded-xl glass p-6">
            <h2 className="font-serif text-2xl">Order</h2>
            <div className="mt-4 space-y-2 text-sm">
              {items.map((i) => (
                <div key={i.productId} className="flex justify-between text-muted-foreground">
                  <span className="truncate pr-2">
                    {i.name} × {i.quantity}
                  </span>
                  <span>{formatINR(i.price_inr * i.quantity)}</span>
                </div>
              ))}
              <div className="my-3 h-px bg-border/60" />
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : formatINR(shipping)}</span>
              </div>
              <div className="mt-2 flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatINR(total)}</span>
              </div>
            </div>
            <button
              disabled={busy}
              className="mt-6 w-full rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-gold)] transition hover:bg-primary-glow disabled:opacity-60"
            >
              {busy ? "Processing…" : "Pay with UPI / Card"}
            </button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Secure payment via Razorpay
            </p>
          </div>
        </form>
      )}
    </div>
  );
}

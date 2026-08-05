import { createFileRoute, Link, useBlocker } from "@tanstack/react-router";
import { useState } from "react";
import { useCart, cartKey } from "@/lib/cart-store";
import { formatINR } from "@/lib/format";
import { useHydrated } from "@/lib/hooks";
import { Minus, Plus, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — Sakhi Suta" }] }),
  component: CartPage,
});

function CartPage() {
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const subtotal = useCart((s) => s.items.reduce((n, i) => n + i.price_inr * i.quantity, 0));
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const blocker = useBlocker({
    shouldBlockFn: ({ next }) => items.length > 0 && next.pathname !== "/checkout",
    enableBeforeUnload: false,
    withResolver: true,
  });


  if (!hydrated) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  const shipping = 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 md:px-8">
      <h1 className="font-serif text-5xl">Your cart</h1>
      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl glass p-12 text-center">
          <p className="text-muted-foreground">Your drape is unwoven — nothing here yet.</p>
          <Link
            to="/shop"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary-glow"
          >
            Enter the atelier
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {items.map((i) => {
              const k = cartKey(i);
              return (
              <div key={k} className="flex gap-4 rounded-xl glass p-4">
                <div className="h-24 w-20 shrink-0 overflow-hidden rounded-md bg-secondary">
                  {i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link to="/product/$slug" params={{ slug: i.slug }} className="font-serif text-lg hover:text-primary">
                      {i.name}
                    </Link>
                    {i.variantName && (
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{i.variantName}</p>
                    )}
                    <p className="text-sm text-primary">{formatINR(i.price_inr)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-full gold-border">
                      <button onClick={() => setQty(k, i.quantity - 1)} className="p-2">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm">{i.quantity}</span>
                      <button onClick={() => setQty(k, i.quantity + 1)} className="p-2">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => setPendingKey(k)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="text-right font-semibold">{formatINR(i.price_inr * i.quantity)}</div>
              </div>
              );
            })}
          </div>
          <div className="h-fit rounded-xl glass p-6">
            <h2 className="font-serif text-2xl">Summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Subtotal" value={formatINR(subtotal)} />
              <Row label="Shipping" value={shipping === 0 ? "Free" : formatINR(shipping)} />
              <div className="my-3 h-px bg-border/60" />
              <Row label="Total" value={formatINR(subtotal + shipping)} bold />
            </div>
            <Link
              to="/checkout"
              className="mt-6 block rounded-full bg-primary px-6 py-3 text-center text-sm font-medium text-primary-foreground hover:bg-primary-glow"
            >
              Proceed to checkout
            </Link>
          </div>
        </div>
      )}

      <AlertDialog open={pendingKey !== null} onOpenChange={(open) => !open && setPendingKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove item?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to exit this item from your cart?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingKey(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingKey) remove(pendingKey);
                setPendingKey(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={blocker.status === "blocked"} onOpenChange={() => blocker.reset?.()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave cart?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to exit? Your cart items will be saved.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={() => blocker.proceed?.()}>Exit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-semibold text-foreground" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

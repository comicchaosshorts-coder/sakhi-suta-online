import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingBag, Search, User, Menu, X } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useHydrated } from "@/lib/hooks";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/sakhi-suta-logo.png.asset.json";

export function Header() {
  const hydrated = useHydrated();
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const [signedIn, setSignedIn] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(Boolean(session)),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const nav = [
    { to: "/", label: "Home" },
    { to: "/shop", label: "Shop" },
    { to: "/regions", label: "Shop by Region" },
    { to: "/search", label: "Search" },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link to="/" className="group flex items-center">
          <img
            src={logoAsset.url}
            alt="Sakhi Suta — Weaving Bonds, Celebrating Women"
            className="h-12 w-12 rounded-full object-contain md:h-14 md:w-14"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm text-muted-foreground transition hover:text-primary"
              activeProps={{ className: "text-primary" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/search" className="hidden rounded-full p-2 text-muted-foreground hover:text-primary md:inline-flex">
            <Search className="h-5 w-5" />
          </Link>
          <Link
            to={signedIn ? "/account" : "/auth"}
            className="rounded-full p-2 text-muted-foreground hover:text-primary"
            aria-label="Account"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link
            to="/cart"
            className="relative rounded-full p-2 text-muted-foreground hover:text-primary"
            aria-label="Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {hydrated && count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="rounded-full p-2 text-muted-foreground hover:text-primary md:hidden"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border/60 bg-background/95 md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="text-sm text-muted-foreground hover:text-primary"
                activeProps={{ className: "text-primary" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-background/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          <div className="font-serif text-3xl">
            <span className="gold-text">Sakhi</span> Suta
          </div>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            A dark-luxury atelier of Indian handloom sarees, curated from all 29 states —
            woven by artisans, worn by heirs.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">
            Explore
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/shop" className="hover:text-primary">Shop All</Link></li>
            <li><Link to="/regions" className="hover:text-primary">Shop by Region</Link></li>
            <li><Link to="/search" className="hover:text-primary">Search</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">
            Account
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth" className="hover:text-primary">Sign in</Link></li>
            <li><Link to="/account" className="hover:text-primary">My orders</Link></li>
            <li><Link to="/cart" className="hover:text-primary">Cart</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 px-4 py-6 text-center text-xs text-muted-foreground md:px-8">
        © {new Date().getFullYear()} Sakhi Suta · Woven with reverence in India.
      </div>
    </footer>
  );
}

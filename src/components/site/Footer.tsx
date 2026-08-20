import { Link } from "@tanstack/react-router";
import { Instagram, Mail, Phone } from "lucide-react";
import logoAsset from "@/assets/sakhi-suta-logo.png.asset.json";

const phone = "+91 63706 00422";
const email = "sakhisutaofficialpi@gmail.com";
const instagram = "https://www.instagram.com/sakhisutaofficial?igsh=NmFzMzQzZjZ1M3Js";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <img
              src={logoAsset.url}
              alt="Sakhi Suta"
              className="h-12 w-12 rounded-full object-contain"
            />
            <div className="font-serif text-3xl">
              <span className="text-primary">Sakhi</span> Suta
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Handcrafted Indian ethnic wear, curated from every state of India — woven by master
            artisans, worn by heirs. Weaving bonds, celebrating women.
          </p>
          <div className="mt-5 flex flex-col gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary transition hover:bg-primary hover:text-primary-foreground"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={`mailto:${email}`}
                className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary transition hover:bg-primary hover:text-primary-foreground"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary transition hover:bg-primary hover:text-primary-foreground"
                aria-label="Phone"
              >
                <Phone className="h-4 w-4" />
              </a>
            </div>
            <div className="flex flex-col gap-1 pt-1">
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="flex items-center gap-2 hover:text-primary"
              >
                <Phone className="h-3.5 w-3.5" />
                {phone}
              </a>
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-2 hover:text-primary"
              >
                <Mail className="h-3.5 w-3.5" />
                {email}
              </a>
            </div>
          </div>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Explore
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/shop" className="hover:text-primary">Shop All</Link></li>
            <li><Link to="/regions" className="hover:text-primary">Shop by Region</Link></li>
            <li><Link to="/search" className="hover:text-primary">Search</Link></li>
            <li><Link to="/join" className="hover:text-primary">Partner with us</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Account
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth" search={{ next: "/account" }} className="hover:text-primary">Sign in</Link></li>
            <li><Link to="/account" className="hover:text-primary">My orders</Link></li>
            <li><Link to="/cart" className="hover:text-primary">Cart</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground md:px-8">
        © {new Date().getFullYear()} Sakhi Suta · Woven with reverence in India.
      </div>
    </footer>
  );
}


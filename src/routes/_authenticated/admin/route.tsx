import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { isCurrentUserAdmin } from "@/lib/admin.functions";
import { useAdminBadges } from "@/lib/admin-badges";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const res = await isCurrentUserAdmin();
    if (!res.isAdmin) throw redirect({ to: "/admin-setup" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const badges = useAdminBadges();
  const nav = [
    { to: "/admin", label: "Dashboard" },
    {
      to: "/admin/notifications",
      label: badges.notifications ? `Notifications (${badges.notifications})` : "Notifications",
      dot: badges.notifications > 0,
    },
    { to: "/admin/branding", label: "Branding & Map" },
    { to: "/admin/slides", label: "Slides" },
    { to: "/admin/promos", label: "Promos" },
    { to: "/admin/discounts", label: "Discounts" },
    { to: "/admin/products", label: "Products" },

    { to: "/admin/orders", label: "Orders" },
    { to: "/admin/inquiries", label: "Inquiries", dot: badges.inquiries },
    { to: "/admin/testimonials", label: "Testimonials", dot: badges.testimonials },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="mb-8 flex flex-wrap gap-2">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="relative rounded-full gold-border px-4 py-2 text-sm hover:bg-primary/10"
            activeOptions={{ exact: n.to === "/admin" }}
            activeProps={{ className: "bg-primary text-primary-foreground border-primary" }}
          >
            {n.label}
            {"dot" in n && n.dot && (
              <span
                aria-label="New items"
                className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background"
              />
            )}
          </Link>
        ))}
      </div>
      <Outlet />
    </div>
  );
}


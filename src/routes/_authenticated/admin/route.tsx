import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { isCurrentUserAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const res = await isCurrentUserAdmin();
    if (!res.isAdmin) throw redirect({ to: "/admin-setup" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const nav = [
    { to: "/admin", label: "Dashboard" },
    { to: "/admin/branding", label: "Branding & Map" },
    { to: "/admin/slides", label: "Slides" },
    { to: "/admin/products", label: "Products" },
    { to: "/admin/orders", label: "Orders" },
    { to: "/admin/inquiries", label: "Inquiries" },
    { to: "/admin/testimonials", label: "Testimonials" },
  ] as const;
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="mb-8 flex flex-wrap gap-2">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="rounded-full gold-border px-4 py-2 text-sm hover:bg-primary/10"
            activeOptions={{ exact: n.to === "/admin" }}
            activeProps={{ className: "bg-primary text-primary-foreground border-primary" }}
          >
            {n.label}
          </Link>
        ))}
      </div>
      <Outlet />
    </div>
  );
}

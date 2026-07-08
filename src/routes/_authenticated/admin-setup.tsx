import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { grantSelfAdmin, isCurrentUserAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin-setup")({
  component: Setup,
});

function Setup() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function grant() {
    setBusy(true);
    setMsg(null);
    try {
      const check = await isCurrentUserAdmin();
      if (check.isAdmin) {
        navigate({ to: "/admin" });
        return;
      }
      await grantSelfAdmin();
      navigate({ to: "/admin" });
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-20">
      <h1 className="font-serif text-4xl">Admin setup</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        The first signed-in account can claim admin access. After that, existing admins promote
        other users from the database.
      </p>
      <button
        onClick={grant}
        disabled={busy}
        className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm text-primary-foreground hover:bg-primary-glow disabled:opacity-60"
      >
        {busy ? "Please wait…" : "Claim admin access"}
      </button>
      {msg && <p className="mt-4 text-sm text-destructive">{msg}</p>}
    </div>
  );
}

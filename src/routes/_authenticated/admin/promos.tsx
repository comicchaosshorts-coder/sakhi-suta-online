import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminListPromoContent,
  deletePromoContent,
  upsertPromoContent,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/promos")({
  component: PromosAdmin,
});

type Kind = "announcement" | "marquee" | "usp";
type Promo = {
  id: string;
  kind: Kind;
  text: string;
  subtext: string | null;
  link_url: string | null;
  display_order: number;
  active: boolean;
};

const blank = {
  kind: "announcement" as Kind,
  text: "",
  subtext: "",
  link_url: "",
  display_order: 0,
  active: true,
};

const SECTIONS: { kind: Kind; title: string; hint: string }[] = [
  { kind: "announcement", title: "Announcement bar", hint: "Rotating lines at the very top of the site." },
  { kind: "marquee", title: "Offer strip", hint: "Scrolling yellow offer band on the homepage." },
  { kind: "usp", title: "Why choose us", hint: "Four trust points below the hero (text + subtext)." },
];

function PromosAdmin() {
  const qc = useQueryClient();
  const { data: promos = [] } = useQuery<Promo[]>({
    queryKey: ["admin-promos"],
    queryFn: () => adminListPromoContent() as Promise<Promo[]>,
  });

  const [form, setForm] = useState<typeof blank & { id?: string }>(blank);
  const [msg, setMsg] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () =>
      upsertPromoContent({
        data: {
          id: form.id,
          kind: form.kind,
          text: form.text.trim(),
          subtext: form.subtext || null,
          link_url: form.link_url || null,
          display_order: Number(form.display_order) || 0,
          active: form.active,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-promos"] });
      qc.invalidateQueries({ queryKey: ["promo-content"] });
      qc.invalidateQueries({ queryKey: ["home"] });
      setForm(blank);
      setMsg("Saved.");
    },
    onError: (e) => setMsg(e instanceof Error ? e.message : "Save failed"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => deletePromoContent({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-promos"] });
      qc.invalidateQueries({ queryKey: ["promo-content"] });
      qc.invalidateQueries({ queryKey: ["home"] });
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl">Promos &amp; banners</h1>
        <p className="text-sm text-muted-foreground">
          Edit the announcement bar, the scrolling offer strip and the trust points.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.text.trim()) {
            setMsg("Please enter the text.");
            return;
          }
          setMsg(null);
          save.mutate();
        }}
        className="grid gap-4 rounded-2xl glass p-6"
      >
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-widest text-primary/70">Type</span>
          <select
            value={form.kind}
            onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as Kind }))}
            className="w-full rounded-lg bg-background px-3 py-2 text-sm outline-none ring-1 ring-primary/20 focus:ring-primary/60"
          >
            {SECTIONS.map((s) => (
              <option key={s.kind} value={s.kind}>
                {s.title}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <Text label="Text" value={form.text} onChange={(v) => setForm((f) => ({ ...f, text: v }))} />
          <Text
            label="Subtext (trust points only)"
            value={form.subtext}
            onChange={(v) => setForm((f) => ({ ...f, subtext: v }))}
          />
          <Text
            label="Link URL (optional)"
            value={form.link_url}
            onChange={(v) => setForm((f) => ({ ...f, link_url: v }))}
          />
          <Text
            label="Display order"
            value={String(form.display_order)}
            onChange={(v) => setForm((f) => ({ ...f, display_order: Number(v) || 0 }))}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          />
          Active
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={save.isPending}
            className="rounded-full bg-primary px-6 py-2 text-sm text-primary-foreground disabled:opacity-60"
          >
            {form.id ? "Update" : "Add"}
          </button>
          {form.id && (
            <button
              type="button"
              onClick={() => setForm(blank)}
              className="rounded-full gold-border px-6 py-2 text-sm hover:bg-primary/10"
            >
              Cancel
            </button>
          )}
        </div>
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      </form>

      {SECTIONS.map((s) => {
        const rows = promos.filter((p) => p.kind === s.kind);
        return (
          <div key={s.kind} className="space-y-3">
            <div>
              <h2 className="font-serif text-2xl">{s.title}</h2>
              <p className="text-xs text-muted-foreground">{s.hint}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {rows.map((p) => (
                <div key={p.id} className="rounded-2xl glass p-4">
                  <p className="text-sm font-medium">{p.text}</p>
                  {p.subtext && <p className="text-xs text-muted-foreground">{p.subtext}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Order: {p.display_order} · {p.active ? "Active" : "Hidden"}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() =>
                        setForm({
                          id: p.id,
                          kind: p.kind,
                          text: p.text,
                          subtext: p.subtext ?? "",
                          link_url: p.link_url ?? "",
                          display_order: p.display_order,
                          active: p.active,
                        })
                      }
                      className="rounded-full gold-border px-4 py-1 text-xs hover:bg-primary/10"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => del.mutate(p.id)}
                      className="rounded-full border border-destructive/60 px-4 py-1 text-xs text-destructive hover:bg-destructive/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {rows.length === 0 && (
                <p className="col-span-full rounded-2xl glass p-6 text-center text-sm text-muted-foreground">
                  Nothing here yet.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Text({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-widest text-primary/70">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-background px-3 py-2 text-sm outline-none ring-1 ring-primary/20 focus:ring-primary/60"
      />
    </label>
  );
}

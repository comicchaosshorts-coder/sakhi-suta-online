import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addHomepagePick,
  adminListCategoryTiles,
  adminListHomepagePicks,
  adminListProducts,
  createProductImageUploadUrl,
  deleteCategoryTile,
  getPublicProductImageUrl,
  removeHomepagePick,
  upsertCategoryTile,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/homepage")({
  component: HomepageAdmin,
});

type Tile = {
  id: string;
  name: string;
  image_url: string;
  link_url: string | null;
  display_order: number;
  active: boolean;
};

type Pick = { id: string; section: string; product_id: string; display_order: number };

type Product = { id: string; name: string; images: string[] | null };

const blankTile = {
  name: "",
  image_url: "",
  link_url: "",
  display_order: 0,
  active: true,
} as { id?: string; name: string; image_url: string; link_url: string; display_order: number; active: boolean };

function HomepageAdmin() {
  const qc = useQueryClient();
  const { data: tiles = [] } = useQuery<Tile[]>({
    queryKey: ["admin-category-tiles"],
    queryFn: () => adminListCategoryTiles() as Promise<Tile[]>,
  });
  const { data: picks = [] } = useQuery<Pick[]>({
    queryKey: ["admin-homepage-picks"],
    queryFn: () => adminListHomepagePicks() as Promise<Pick[]>,
  });
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["admin-products"],
    queryFn: () => adminListProducts() as Promise<Product[]>,
  });

  const [form, setForm] = useState(blankTile);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-category-tiles"] });
    qc.invalidateQueries({ queryKey: ["admin-homepage-picks"] });
    qc.invalidateQueries({ queryKey: ["home"] });
  };

  const saveTile = useMutation({
    mutationFn: async () =>
      upsertCategoryTile({
        data: {
          id: form.id,
          name: form.name,
          image_url: form.image_url,
          link_url: form.link_url || null,
          display_order: Number(form.display_order) || 0,
          active: form.active,
        },
      }),
    onSuccess: () => {
      invalidate();
      setForm(blankTile);
      setMsg("Saved.");
    },
    onError: (e) => setMsg(e instanceof Error ? e.message : "Save failed"),
  });

  const delTile = useMutation({
    mutationFn: async (id: string) => deleteCategoryTile({ data: { id } }),
    onSuccess: invalidate,
  });

  const addPick = useMutation({
    mutationFn: async (v: { section: "new_arrivals" | "best_sellers"; product_id: string }) =>
      addHomepagePick({ data: v }),
    onSuccess: invalidate,
  });

  const removePick = useMutation({
    mutationFn: async (id: string) => removeHomepagePick({ data: { id } }),
    onSuccess: invalidate,
  });

  async function onUpload(file: File) {
    setUploading(true);
    setMsg(null);
    try {
      const { key, uploadUrl } = await createProductImageUploadUrl({
        data: { filename: file.name },
      });
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
      });
      if (!put.ok) throw new Error("Upload failed");
      const { url } = await getPublicProductImageUrl({ data: { key } });
      if (!url) throw new Error("Could not resolve URL");
      setForm((f) => ({ ...f, image_url: url }));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl">Homepage sections</h1>
          <p className="text-sm text-muted-foreground">
            Manage the round category tiles and choose exactly which products appear in “New
            Arrivals” and “Most loved / Bestsellers”.
          </p>
        </div>

        <h2 className="font-serif text-2xl">Category tiles</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim()) return setMsg("Please add a tile name.");
            if (!form.image_url) return setMsg("Please upload a tile picture.");
            saveTile.mutate();
          }}
          className="grid gap-4 rounded-2xl glass p-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-widest text-primary/70">
                Tile name
              </span>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg bg-background/60 px-3 py-2 text-sm outline-none ring-1 ring-primary/20 focus:ring-primary/60"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-widest text-primary/70">
                Link (optional, e.g. /shop)
              </span>
              <input
                value={form.link_url}
                onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
                className="w-full rounded-lg bg-background/60 px-3 py-2 text-sm outline-none ring-1 ring-primary/20 focus:ring-primary/60"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-widest text-primary/70">
                Display order
              </span>
              <input
                value={String(form.display_order)}
                onChange={(e) =>
                  setForm((f) => ({ ...f, display_order: Number(e.target.value) || 0 }))
                }
                className="w-full rounded-lg bg-background/60 px-3 py-2 text-sm outline-none ring-1 ring-primary/20 focus:ring-primary/60"
              />
            </label>
            <label className="flex items-end gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              Active
            </label>
          </div>

          <div>
            <span className="mb-2 block text-xs uppercase tracking-widest text-primary/70">
              Tile picture
            </span>
            {form.image_url && (
              <div className="mb-3 flex items-center gap-3">
                <img src={form.image_url} alt="" className="h-20 w-20 rounded-full object-cover" />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
                  className="text-xs text-destructive hover:underline"
                >
                  Remove
                </button>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="text-sm"
            />
            {uploading && <p className="mt-1 text-xs text-muted-foreground">Uploading…</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saveTile.isPending}
              className="rounded-full bg-primary px-6 py-2 text-sm text-primary-foreground disabled:opacity-60"
            >
              {form.id ? "Update tile" : "Add tile"}
            </button>
            {form.id && (
              <button
                type="button"
                onClick={() => setForm(blankTile)}
                className="rounded-full gold-border px-6 py-2 text-sm hover:bg-primary/10"
              >
                Cancel
              </button>
            )}
          </div>
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        </form>

        <div className="grid gap-4 md:grid-cols-2">
          {tiles.map((t) => (
            <div key={t.id} className="flex items-center gap-4 rounded-2xl glass p-4">
              {t.image_url ? (
                <img src={t.image_url} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <span className="grid h-16 w-16 place-items-center rounded-full bg-secondary">—</span>
              )}
              <div className="flex-1">
                <p className="font-serif text-lg">{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  Order: {t.display_order} · {t.active ? "Active" : "Hidden"}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() =>
                      setForm({
                        id: t.id,
                        name: t.name,
                        image_url: t.image_url,
                        link_url: t.link_url ?? "",
                        display_order: t.display_order,
                        active: t.active,
                      })
                    }
                    className="rounded-full gold-border px-4 py-1 text-xs hover:bg-primary/10"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => delTile.mutate(t.id)}
                    className="rounded-full border border-destructive/60 px-4 py-1 text-xs text-destructive hover:bg-destructive/10"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          {tiles.length === 0 && (
            <p className="col-span-full rounded-2xl glass p-8 text-center text-sm text-muted-foreground">
              No tiles yet — the homepage shows the default category tiles until you add some.
            </p>
          )}
        </div>
      </section>

      <PickSection
        title="New Arrivals slider"
        hint="Pick the product pictures that show in the small sliding row below the hero. Leave empty to show all products."
        section="new_arrivals"
        picks={picks.filter((p) => p.section === "new_arrivals")}
        products={products}
        onAdd={(product_id) => addPick.mutate({ section: "new_arrivals", product_id })}
        onRemove={(id) => removePick.mutate(id)}
      />

      <PickSection
        title="Most loved / Bestsellers"
        hint="Whatever you pick here is exactly what shows in that section — nothing is calculated from sales."
        section="best_sellers"
        picks={picks.filter((p) => p.section === "best_sellers")}
        products={products}
        onAdd={(product_id) => addPick.mutate({ section: "best_sellers", product_id })}
        onRemove={(id) => removePick.mutate(id)}
      />
    </div>
  );
}

function PickSection({
  title,
  hint,
  picks,
  products,
  onAdd,
  onRemove,
}: {
  title: string;
  hint: string;
  section: "new_arrivals" | "best_sellers";
  picks: Pick[];
  products: Product[];
  onAdd: (productId: string) => void;
  onRemove: (id: string) => void;
}) {
  const chosen = new Set(picks.map((p) => p.product_id));
  const byId = new Map(products.map((p) => [p.id, p]));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl">{title}</h2>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>

      <div className="grid gap-4 rounded-2xl glass p-6">
        <p className="text-xs uppercase tracking-widest text-primary/70">Selected</p>
        {picks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing selected yet.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {picks.map((p) => {
              const prod = byId.get(p.product_id);
              return (
                <div key={p.id} className="w-28 text-center">
                  {prod?.images?.[0] ? (
                    <img
                      src={prod.images[0]}
                      alt=""
                      className="h-36 w-28 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="grid h-36 w-28 place-items-center rounded-lg bg-secondary text-xs">
                      no image
                    </div>
                  )}
                  <p className="mt-1 truncate text-xs">{prod?.name ?? "Removed product"}</p>
                  <button
                    onClick={() => onRemove(p.id)}
                    className="mt-1 text-xs text-destructive hover:underline"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-4 text-xs uppercase tracking-widest text-primary/70">Add a product</p>
        <div className="flex flex-wrap gap-3">
          {products
            .filter((p) => !chosen.has(p.id))
            .map((p) => (
              <button
                key={p.id}
                onClick={() => onAdd(p.id)}
                className="w-28 rounded-lg gold-border p-1 text-center hover:bg-primary/10"
              >
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt="" className="h-32 w-full rounded object-cover" />
                ) : (
                  <div className="grid h-32 w-full place-items-center rounded bg-secondary text-xs">
                    no image
                  </div>
                )}
                <span className="mt-1 block truncate text-xs">{p.name}</span>
              </button>
            ))}
        </div>
      </div>
    </section>
  );
}

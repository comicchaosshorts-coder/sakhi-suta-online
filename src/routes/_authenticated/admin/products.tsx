import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  adminListProducts,
  createProductImageUploadUrl,
  deleteProduct,
  getPublicProductImageUrl,
  upsertProduct,
} from "@/lib/admin.functions";
import { listStates } from "@/lib/states.functions";
import { formatINR } from "@/lib/format";
import { ImageCropper } from "@/components/site/ImageCropper";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: Products,
});

type PendingCrop = { file: File; replaceIndex: number | null };

const emptyForm = {
  id: undefined as string | undefined,
  name: "",
  slug: "",
  price_inr: 0,
  compare_at_price_inr: 0,
  description: "",
  fabric: "",
  saree_type: "",
  state_id: "" as string,
  images: [] as string[],
  featured: false,
  in_stock: true,
};

function Products() {
  const qc = useQueryClient();
  const products = useQuery({ queryKey: ["admin-products"], queryFn: () => adminListProducts() });
  const states = useQuery({ queryKey: ["states"], queryFn: () => listStates() });
  const [form, setForm] = useState({ ...emptyForm });
  const [msg, setMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState<PendingCrop[]>([]);
  const addInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceIndexRef = useRef<number | null>(null);

  async function save() {
    try {
      await upsertProduct({
        data: {
          id: form.id,
          name: form.name,
          slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
          price_inr: Number(form.price_inr),
          compare_at_price_inr: form.compare_at_price_inr ? Number(form.compare_at_price_inr) : null,
          description: form.description,
          fabric: form.fabric || null,
          saree_type: form.saree_type || null,
          state_id: form.state_id || null,
          images: form.images,
          featured: form.featured,
          in_stock: form.in_stock,
        },
      });
      setForm({ ...emptyForm });
      setMsg("Saved.");
      qc.invalidateQueries();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    }
  }

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setPending((p) => [...p, ...files.map((f) => ({ file: f, replaceIndex: null }))]);
  }

  function onPickReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const idx = replaceIndexRef.current;
    e.target.value = "";
    replaceIndexRef.current = null;
    if (!file || idx === null) return;
    setPending((p) => [...p, { file, replaceIndex: idx }]);
  }

  function triggerReplace(idx: number) {
    replaceIndexRef.current = idx;
    replaceInputRef.current?.click();
  }

  async function uploadBlob(blob: Blob, filename: string): Promise<string> {
    const { key, uploadUrl } = await createProductImageUploadUrl({ data: { filename } });
    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": blob.type || "image/jpeg" },
      body: blob,
    });
    if (!put.ok) throw new Error(`Upload failed for ${filename}`);
    const { url } = await getPublicProductImageUrl({ data: { key } });
    if (!url) throw new Error("Could not resolve uploaded image URL");
    return url;
  }

  async function onCropConfirm(blob: Blob, filename: string) {
    const current = pending[0];
    if (!current) return;
    setUploading(true);
    setPending((p) => p.slice(1));
    try {
      const url = await uploadBlob(blob, filename);
      setForm((f) => {
        const next = [...f.images];
        if (current.replaceIndex !== null && current.replaceIndex < next.length) {
          next[current.replaceIndex] = url;
        } else {
          next.push(url);
        }
        return { ...f, images: next };
      });
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  function cancelCurrentCrop() {
    setPending((p) => p.slice(1));
  }

  function removeImage(idx: number) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  }

  function moveImage(idx: number, dir: -1 | 1) {
    setForm((f) => {
      const next = [...f.images];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return f;
      [next[idx], next[j]] = [next[j], next[idx]];
      return { ...f, images: next };
    });
  }

  async function remove(id: string) {
    if (!confirm("Delete this product?")) return;
    await deleteProduct({ data: { id } });
    qc.invalidateQueries();
  }

  return (
    <>
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <div className="rounded-2xl glass p-6">
        <h2 className="font-serif text-2xl">{form.id ? "Edit product" : "New product"}</h2>
        <div className="mt-4 space-y-3 text-sm">
          <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Input label="Slug (auto if blank)" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} />
          <Input
            label="Price (INR)"
            type="number"
            value={String(form.price_inr)}
            onChange={(v) => setForm({ ...form, price_inr: Number(v) })}
          />
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">State</span>
            <select
              value={form.state_id}
              onChange={(e) => setForm({ ...form, state_id: e.target.value })}
              className="w-full rounded-md border border-input bg-input/40 px-3 py-2"
            >
              <option value="">— select —</option>
              {states.data?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <Input label="Saree type" value={form.saree_type} onChange={(v) => setForm({ ...form, saree_type: v })} />
          <Input label="Fabric" value={form.fabric} onChange={(v) => setForm({ ...form, fabric: v })} />
          <div className="block">
            <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
              Catalogue images
            </span>
            {form.images.length > 0 && (
              <div className="mb-2 grid grid-cols-3 gap-2">
                {form.images.map((src, i) => (
                  <div key={i} className="group relative aspect-[3/4] overflow-hidden rounded-md bg-secondary">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/70 p-1 opacity-0 transition group-hover:opacity-100">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => moveImage(i, -1)}
                          disabled={i === 0}
                          className="rounded bg-white/10 px-1.5 text-[11px] text-white disabled:opacity-30"
                          title="Move left"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(i, 1)}
                          disabled={i === form.images.length - 1}
                          className="rounded bg-white/10 px-1.5 text-[11px] text-white disabled:opacity-30"
                          title="Move right"
                        >
                          →
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => triggerReplace(i)}
                          className="rounded bg-white/10 px-1.5 text-[11px] text-white"
                          title="Replace"
                        >
                          ↺
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="rounded bg-white/10 px-1.5 text-[11px] text-white"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    {i === 0 && (
                      <span className="absolute left-1 top-1 rounded bg-primary/90 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-primary-foreground">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => addInputRef.current?.click()}
              disabled={uploading}
              className="flex w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-border/60 bg-input/20 px-3 py-4 text-xs text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-60"
            >
              {uploading ? "Uploading…" : pending.length > 0 ? `Cropping (${pending.length} left)…` : "Add images from gallery"}
            </button>
            <p className="mt-1 text-[11px] text-muted-foreground">
              You'll be able to zoom, reposition and choose fill-frame or show-whole-image before each image uploads.
            </p>
            <input
              ref={addInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={onPickFiles}
              className="hidden"
            />
            <input
              ref={replaceInputRef}
              type="file"
              accept="image/*"
              onChange={onPickReplace}
              className="hidden"
            />
          </div>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
              Description
            </span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-md border border-input bg-input/40 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            Featured on home
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.in_stock}
              onChange={(e) => setForm({ ...form, in_stock: e.target.checked })}
            />
            In stock
          </label>
          <div className="flex gap-2">
            <button
              onClick={save}
              className="flex-1 rounded-full bg-primary py-2 text-sm text-primary-foreground hover:bg-primary-glow"
            >
              {form.id ? "Update" : "Create"}
            </button>
            {form.id && (
              <button
                onClick={() => setForm({ ...emptyForm })}
                className="rounded-full border border-border/60 px-4 text-sm"
              >
                Cancel
              </button>
            )}
          </div>
          {msg && <p className="text-xs text-primary">{msg}</p>}
        </div>
      </div>

      <div>
        <h2 className="font-serif text-2xl">All products</h2>
        <div className="mt-4 space-y-3">
          {products.data?.map((p) => (
            <div key={p.id} className="flex items-center gap-4 rounded-xl glass p-4">
              <div className="h-16 w-14 shrink-0 overflow-hidden rounded-md bg-secondary">
                {p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1">
                <div className="font-serif">{p.name}</div>
                <div className="text-xs text-muted-foreground">
                  {p.saree_type} · {p.in_stock ? "in stock" : "sold out"} {p.featured && "· featured"}
                </div>
              </div>
              <div className="text-sm text-primary">{formatINR(p.price_inr)}</div>
              <button
                onClick={() =>
                  setForm({
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    price_inr: p.price_inr,
                    description: p.description,
                    fabric: p.fabric ?? "",
                    saree_type: p.saree_type ?? "",
                    state_id: p.state_id ?? "",
                    images: p.images ?? [],
                    featured: p.featured,
                    in_stock: p.in_stock,
                  })
                }
                className="rounded-full border border-border/60 px-3 py-1 text-xs hover:text-primary"
              >
                Edit
              </button>
              <button
                onClick={() => remove(p.id)}
                className="rounded-full border border-border/60 px-3 py-1 text-xs hover:text-destructive"
              >
                Delete
              </button>
            </div>
          ))}
          {products.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">No products yet — add one on the left.</p>
          )}
        </div>
      </div>
    </div>
    {pending[0] && (
      <ImageCropper
        file={pending[0].file}
        aspect={3 / 4}
        title={pending[0].replaceIndex !== null ? "Replace image" : "Adjust image"}
        onCancel={cancelCurrentCrop}
        onConfirm={onCropConfirm}
      />
    )}
    </>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-input/40 px-3 py-2 text-sm"
      />
    </label>
  );
}

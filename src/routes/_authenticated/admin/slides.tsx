import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminListHeroSlides,
  createProductImageUploadUrl,
  deleteHeroSlide,
  getPublicProductImageUrl,
  upsertHeroSlide,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/slides")({
  component: SlidesAdmin,
});

type Slide = {
  id: string;
  image_url: string;
  caption: string | null;
  link_url: string | null;
  display_order: number;
  active: boolean;
};

const blank = {
  image_url: "",
  caption: "",
  link_url: "",
  display_order: 0,
  active: true,
};

function SlidesAdmin() {
  const qc = useQueryClient();
  const { data: slides = [] } = useQuery<Slide[]>({
    queryKey: ["admin-slides"],
    queryFn: () => adminListHeroSlides(),
  });

  const [form, setForm] = useState<{
    id?: string;
    image_url: string;
    caption: string;
    link_url: string;
    display_order: number;
    active: boolean;
  }>(blank);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = useMutation({
    mutationFn: async () =>
      upsertHeroSlide({
        data: {
          id: form.id,
          image_url: form.image_url,
          caption: form.caption || null,
          link_url: form.link_url || null,
          display_order: Number(form.display_order) || 0,
          active: form.active,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-slides"] });
      setForm(blank);
      setMsg("Saved.");
    },
    onError: (e) => setMsg(e instanceof Error ? e.message : "Save failed"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => deleteHeroSlide({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-slides"] }),
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
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl">Hero slides</h1>
        <p className="text-sm text-muted-foreground">
          Manage the swipeable slides that appear on the homepage.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.image_url) {
            setMsg("Please upload an image.");
            return;
          }
          save.mutate();
        }}
        className="grid gap-4 rounded-2xl glass p-6"
      >
        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-primary/70">
            Image
          </label>
          {form.image_url ? (
            <div className="mb-3 flex items-center gap-3">
              <img src={form.image_url} alt="preview" className="h-24 w-40 rounded object-cover" />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
                className="text-xs text-destructive hover:underline"
              >
                Remove
              </button>
            </div>
          ) : null}
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

        <div className="grid gap-4 md:grid-cols-2">
          <Text label="Caption" value={form.caption} onChange={(v) => setForm((f) => ({ ...f, caption: v }))} />
          <Text label="Link URL" value={form.link_url} onChange={(v) => setForm((f) => ({ ...f, link_url: v }))} />
          <Text
            label="Display order"
            value={String(form.display_order)}
            onChange={(v) => setForm((f) => ({ ...f, display_order: Number(v) || 0 }))}
          />
          <label className="flex items-end gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            Active
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={save.isPending}
            className="rounded-full bg-primary px-6 py-2 text-sm text-primary-foreground disabled:opacity-60"
          >
            {form.id ? "Update slide" : "Add slide"}
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

      <div className="grid gap-4 md:grid-cols-2">
        {slides.map((s) => (
          <div key={s.id} className="flex gap-4 rounded-2xl glass p-4">
            <img src={s.image_url} alt="" className="h-24 w-40 rounded object-cover" />
            <div className="flex-1">
              <p className="font-serif text-lg">{s.caption || "—"}</p>
              <p className="text-xs text-muted-foreground">Order: {s.display_order} · {s.active ? "Active" : "Hidden"}</p>
              {s.link_url && <p className="mt-1 truncate text-xs text-primary/70">{s.link_url}</p>}
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() =>
                    setForm({
                      id: s.id,
                      image_url: s.image_url,
                      caption: s.caption ?? "",
                      link_url: s.link_url ?? "",
                      display_order: s.display_order,
                      active: s.active,
                    })
                  }
                  className="rounded-full gold-border px-4 py-1 text-xs hover:bg-primary/10"
                >
                  Edit
                </button>
                <button
                  onClick={() => del.mutate(s.id)}
                  className="rounded-full border border-destructive/60 px-4 py-1 text-xs text-destructive hover:bg-destructive/10"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {slides.length === 0 && (
          <p className="col-span-full rounded-2xl glass p-8 text-center text-sm text-muted-foreground">
            No slides yet. Add your first one above.
          </p>
        )}
      </div>
    </div>
  );
}

function Text({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-widest text-primary/70">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-background/60 px-3 py-2 text-sm outline-none ring-1 ring-primary/20 focus:ring-primary/60"
      />
    </label>
  );
}

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

type BannerType = "image_only" | "image_text" | "promotional";

type Slide = {
  id: string;
  image_url: string;
  mobile_image_url: string | null;
  caption: string | null;
  title: string | null;
  description: string | null;
  button_text: string | null;
  button_link: string | null;
  banner_type: string;
  link_url: string | null;
  display_order: number;
  active: boolean;
};

type Form = {
  id?: string;
  image_url: string;
  mobile_image_url: string;
  title: string;
  description: string;
  button_text: string;
  button_link: string;
  banner_type: BannerType;
  display_order: number;
  active: boolean;
};

const blank: Form = {
  image_url: "",
  mobile_image_url: "",
  title: "",
  description: "",
  button_text: "",
  button_link: "",
  banner_type: "image_only",
  display_order: 0,
  active: true,
};

const TYPE_LABELS: Record<string, string> = {
  image_only: "Image Only",
  image_text: "Image + Text",
  promotional: "Promotional Banner",
};

function SlidesAdmin() {
  const qc = useQueryClient();
  const { data: slides = [] } = useQuery<Slide[]>({
    queryKey: ["admin-slides"],
    queryFn: () => adminListHeroSlides() as Promise<Slide[]>,
  });

  const [form, setForm] = useState<Form>(blank);
  const [uploading, setUploading] = useState<"desktop" | "mobile" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const deskRef = useRef<HTMLInputElement>(null);
  const mobRef = useRef<HTMLInputElement>(null);

  const save = useMutation({
    mutationFn: async () =>
      upsertHeroSlide({
        data: {
          id: form.id,
          image_url: form.image_url,
          mobile_image_url: form.mobile_image_url || null,
          caption: form.title || null,
          title: form.title || null,
          description: form.description || null,
          button_text: form.button_text || null,
          button_link: form.button_link || null,
          banner_type: form.banner_type,
          link_url: form.button_link || null,
          display_order: Number(form.display_order) || 0,
          active: form.active,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-slides"] });
      qc.invalidateQueries({ queryKey: ["home"] });
      setForm(blank);
      setMsg("Saved.");
    },
    onError: (e) => setMsg(e instanceof Error ? e.message : "Save failed"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => deleteHeroSlide({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-slides"] });
      qc.invalidateQueries({ queryKey: ["home"] });
    },
  });

  async function onUpload(file: File, which: "desktop" | "mobile") {
    setUploading(which);
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
      setForm((f) =>
        which === "desktop" ? { ...f, image_url: url } : { ...f, mobile_image_url: url },
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  const showText = form.banner_type !== "image_only";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl">Homepage banners</h1>
        <p className="text-sm text-muted-foreground">
          Manage the sliding banners at the top of the homepage. Each banner can have its own
          desktop and mobile image.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.image_url) {
            setMsg("Please upload a desktop image.");
            return;
          }
          save.mutate();
        }}
        className="grid gap-4 rounded-2xl glass p-6"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <ImageField
            label="Desktop image"
            value={form.image_url}
            busy={uploading === "desktop"}
            inputRef={deskRef}
            onPick={(f) => onUpload(f, "desktop")}
            onClear={() => setForm((f) => ({ ...f, image_url: "" }))}
          />
          <ImageField
            label="Mobile image"
            value={form.mobile_image_url}
            busy={uploading === "mobile"}
            inputRef={mobRef}
            onPick={(f) => onUpload(f, "mobile")}
            onClear={() => setForm((f) => ({ ...f, mobile_image_url: "" }))}
          />
        </div>

        <label className="block md:max-w-xs">
          <span className="mb-1 block text-xs uppercase tracking-widest text-primary/70">
            Banner type
          </span>
          <select
            value={form.banner_type}
            onChange={(e) =>
              setForm((f) => ({ ...f, banner_type: e.target.value as BannerType }))
            }
            className="w-full rounded-lg bg-background/60 px-3 py-2 text-sm outline-none ring-1 ring-primary/20 focus:ring-primary/60"
          >
            <option value="image_only">Image Only</option>
            <option value="image_text">Image + Text</option>
            <option value="promotional">Promotional Banner</option>
          </select>
        </label>

        {!showText && (
          <p className="text-xs text-muted-foreground">
            “Image Only” shows just the picture — any text or button below is ignored.
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Text label="Title (optional)" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} />
          <Text
            label="Short description (optional)"
            value={form.description}
            onChange={(v) => setForm((f) => ({ ...f, description: v }))}
          />
          <Text
            label="Button text (optional)"
            value={form.button_text}
            onChange={(v) => setForm((f) => ({ ...f, button_text: v }))}
          />
          <Text
            label="Button link (optional)"
            value={form.button_link}
            onChange={(v) => setForm((f) => ({ ...f, button_link: v }))}
          />
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
            {form.id ? "Update banner" : "Add banner"}
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
              <p className="font-serif text-lg">{s.title || s.caption || "—"}</p>
              <p className="text-xs text-muted-foreground">
                {TYPE_LABELS[s.banner_type] ?? s.banner_type} · Order: {s.display_order} ·{" "}
                {s.active ? "Active" : "Hidden"}
              </p>
              <p className="text-xs text-muted-foreground">
                Mobile image: {s.mobile_image_url ? "yes" : "not set"}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() =>
                    setForm({
                      id: s.id,
                      image_url: s.image_url,
                      mobile_image_url: s.mobile_image_url ?? "",
                      title: s.title ?? s.caption ?? "",
                      description: s.description ?? "",
                      button_text: s.button_text ?? "",
                      button_link: s.button_link ?? s.link_url ?? "",
                      banner_type: (["image_only", "image_text", "promotional"].includes(
                        s.banner_type,
                      )
                        ? s.banner_type
                        : "image_only") as BannerType,
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
            No banners yet. Add your first one above.
          </p>
        )}
      </div>
    </div>
  );
}

function ImageField({
  label,
  value,
  busy,
  inputRef,
  onPick,
  onClear,
}: {
  label: string;
  value: string;
  busy: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPick: (f: File) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-widest text-primary/70">
        {label}
      </label>
      {value ? (
        <div className="mb-3 flex items-center gap-3">
          <img src={value} alt="preview" className="h-24 w-40 rounded object-cover" />
          <button type="button" onClick={onClear} className="text-xs text-destructive hover:underline">
            Remove
          </button>
        </div>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          if (inputRef.current) inputRef.current.value = "";
        }}
        className="text-sm"
      />
      {busy && <p className="mt-1 text-xs text-muted-foreground">Uploading…</p>}
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

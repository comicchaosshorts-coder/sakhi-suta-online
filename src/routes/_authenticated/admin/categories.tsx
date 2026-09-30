import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  adminListCategoriesAndBenefits,
  createProductImageUploadUrl,
  deleteBenefit,
  deleteManagedCategory,
  getPublicProductImageUrl,
  upsertBenefit,
  upsertManagedCategory,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  head: () => ({ meta: [
    { title: "Categories & Benefits — Sakhi Suta Admin" },
    { name: "description", content: "Manage Sakhi Suta shopping categories and customer benefits." },
    { property: "og:title", content: "Categories & Benefits — Sakhi Suta Admin" },
    { property: "og:description", content: "Manage shopping categories and customer benefits." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: CategoriesAdmin,
});

type Category = { id: string; name: string; image_url: string; display_order: number; enabled: boolean; opens_saree_categories?: boolean };
type Benefit = { id: string; name: string; text: string; icon: string; image_url: string; display_order: number; enabled: boolean };
const blankCategory = { name: "", image_url: "", display_order: 0, enabled: true, opens_saree_categories: false };
const blankBenefit = { name: "", text: "", icon: "sparkles", image_url: "", display_order: 0, enabled: true };

function CategoriesAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-categories-benefits"], queryFn: () => adminListCategoriesAndBenefits() });
  const [kind, setKind] = useState<"main" | "saree">("main");
  const [category, setCategory] = useState<Category | typeof blankCategory>(blankCategory);
  const [benefit, setBenefit] = useState<Benefit | typeof blankBenefit>(blankBenefit);
  const [uploadTarget, setUploadTarget] = useState<"category" | "benefit">("category");
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-categories-benefits"] }); qc.invalidateQueries({ queryKey: ["home"] }); qc.invalidateQueries({ queryKey: ["benefits"] }); qc.invalidateQueries({ queryKey: ["saree-categories"] }); };

  const saveCategory = useMutation({ mutationFn: () => upsertManagedCategory({ data: { kind, category: { ...category, display_order: Number(category.display_order) } } }), onSuccess: () => { refresh(); setCategory(blankCategory); setMessage("Category saved."); }, onError: (error) => setMessage(error instanceof Error ? error.message : "Save failed") });
  const saveBenefit = useMutation({ mutationFn: () => upsertBenefit({ data: { ...benefit, display_order: Number(benefit.display_order) } }), onSuccess: () => { refresh(); setBenefit(blankBenefit); setMessage("Benefit saved."); }, onError: (error) => setMessage(error instanceof Error ? error.message : "Save failed") });

  async function upload(file: File) {
    const { key, uploadUrl } = await createProductImageUploadUrl({ data: { filename: file.name } });
    const response = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type || "image/jpeg" }, body: file });
    if (!response.ok) throw new Error("Upload failed");
    const { url } = await getPublicProductImageUrl({ data: { key } });
    if (!url) throw new Error("Image could not be opened");
    if (uploadTarget === "category") setCategory((current) => ({ ...current, image_url: url }));
    else setBenefit((current) => ({ ...current, image_url: url }));
  }

  const rows = kind === "main" ? data?.main ?? [] : data?.saree ?? [];
  return <div className="space-y-12">
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-serif text-4xl">Categories</h1><p className="mt-1 text-sm text-muted-foreground">Homepage groups and the Saree Categories page.</p></div><div className="flex rounded-full border border-border p-1"><button onClick={() => { setKind("main"); setCategory(blankCategory); }} className={`rounded-full px-4 py-2 text-sm ${kind === "main" ? "bg-primary text-primary-foreground" : ""}`}>Main</button><button onClick={() => { setKind("saree"); setCategory(blankCategory); }} className={`rounded-full px-4 py-2 text-sm ${kind === "saree" ? "bg-primary text-primary-foreground" : ""}`}>Saree</button></div></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
        <Editor title={"id" in category ? "Edit category" : "Add category"}>
          <Field label="Name" value={category.name} onChange={(value) => setCategory({ ...category, name: value })} />
          <Field label="Display order" type="number" value={String(category.display_order)} onChange={(value) => setCategory({ ...category, display_order: Number(value) })} />
          <ImageField label={kind === "saree" ? "Category card background" : "Category image"} value={category.image_url} previewShape={kind === "saree" ? "wide" : "round"} onPick={() => { setUploadTarget("category"); fileRef.current?.click(); }} onRemove={() => setCategory({ ...category, image_url: "" })} />
          <Check label="Enabled" checked={category.enabled} onChange={(checked) => setCategory({ ...category, enabled: checked })} />
          {kind === "main" && <Check label="Opens Saree Categories page" checked={Boolean(category.opens_saree_categories)} onChange={(checked) => setCategory({ ...category, opens_saree_categories: checked })} />}
          <button onClick={() => saveCategory.mutate()} disabled={!category.name.trim()} className="w-full rounded-full bg-primary py-2 text-primary-foreground disabled:opacity-50">Save category</button>
        </Editor>
        <div className="space-y-3">{rows.map((row) => <AdminRow key={row.id} image={row.image_url} name={row.name} detail={`${row.enabled ? "Enabled" : "Disabled"} · order ${row.display_order}`} onEdit={() => setCategory(row)} onDelete={async () => { if (!window.confirm(`Remove ${row.name}? Products keep all other information.`)) return; await deleteManagedCategory({ data: { kind, id: row.id } }); refresh(); }} />)}</div>
      </div>
    </section>

    <section className="border-t border-border pt-10"><h2 className="font-serif text-4xl">Benefits</h2><p className="mt-1 text-sm text-muted-foreground">Only enabled benefits appear above the footer.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
        <Editor title={"id" in benefit ? "Edit benefit" : "Add benefit"}>
          <Field label="Name" value={benefit.name} onChange={(value) => setBenefit({ ...benefit, name: value })} />
          <Field label="Text" value={benefit.text} onChange={(value) => setBenefit({ ...benefit, text: value })} />
          <label className="block text-sm"><span className="mb-1 block text-xs uppercase text-muted-foreground">Line icon</span><select value={benefit.icon} onChange={(event) => setBenefit({ ...benefit, icon: event.target.value })} className="w-full rounded-md border border-input bg-input/40 px-3 py-2"><option value="clock">Clock</option><option value="truck">Shipping truck</option><option value="wallet">Wallet</option><option value="refresh">Returns</option><option value="sparkles">Sparkles</option></select></label>
          <Field label="Display order" type="number" value={String(benefit.display_order)} onChange={(value) => setBenefit({ ...benefit, display_order: Number(value) })} />
          <ImageField label="Benefit image" value={benefit.image_url} onPick={() => { setUploadTarget("benefit"); fileRef.current?.click(); }} onRemove={() => setBenefit({ ...benefit, image_url: "" })} />
          <Check label="Enabled" checked={benefit.enabled} onChange={(checked) => setBenefit({ ...benefit, enabled: checked })} />
          <button onClick={() => saveBenefit.mutate()} disabled={!benefit.name.trim()} className="w-full rounded-full bg-primary py-2 text-primary-foreground disabled:opacity-50">Save benefit</button>
        </Editor>
        <div className="space-y-3">{(data?.benefits ?? []).map((row) => <AdminRow key={row.id} image={row.image_url} name={row.name} detail={`${row.enabled ? "Enabled" : "Disabled"} · ${row.icon} · order ${row.display_order}`} onEdit={() => setBenefit(row)} onDelete={async () => { if (!window.confirm(`Remove ${row.name}?`)) return; await deleteBenefit({ data: { id: row.id } }); refresh(); }} />)}</div>
      </div>
    </section>
    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) upload(file).catch((error) => setMessage(error instanceof Error ? error.message : "Upload failed")); }} />
    {message && <p className="text-sm text-primary">{message}</p>}
  </div>;
}

function Editor({ title, children }: { title: string; children: React.ReactNode }) { return <div className="h-fit rounded-xl glass p-5"><h3 className="font-serif text-2xl">{title}</h3><div className="mt-4 space-y-3">{children}</div></div>; }
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="block text-sm"><span className="mb-1 block text-xs uppercase text-muted-foreground">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-input bg-input/40 px-3 py-2" /></label>; }
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) { return <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{label}</label>; }
function ImageField({ label, value, previewShape = "round", onPick, onRemove }: { label: string; value: string; previewShape?: "round" | "wide"; onPick: () => void; onRemove: () => void }) { return <div><p className="mb-2 text-xs uppercase text-muted-foreground">{label}</p>{value && <img src={value} alt="" className={`mb-2 object-cover ${previewShape === "wide" ? "aspect-[16/7] w-full rounded-md" : "h-24 w-24 rounded-full"}`} />}<div className="flex gap-2"><button onClick={onPick} className="rounded-full border border-border px-3 py-1 text-xs">{value ? "Change image" : "Upload image"}</button>{value && <button onClick={onRemove} className="rounded-full border border-border px-3 py-1 text-xs text-destructive">Remove</button>}</div></div>; }
function AdminRow({ image, name, detail, onEdit, onDelete }: { image: string; name: string; detail: string; onEdit: () => void; onDelete: () => void }) { return <div className="flex items-center gap-4 rounded-xl glass p-4">{image ? <img src={image} alt="" className="h-14 w-14 rounded-full object-cover" /> : <div className="grid h-14 w-14 place-items-center rounded-full bg-secondary font-serif text-xl text-primary">{name.charAt(0)}</div>}<div className="min-w-0 flex-1"><p className="font-medium">{name}</p><p className="text-xs text-muted-foreground">{detail}</p></div><button onClick={onEdit} className="rounded-full border border-border px-3 py-1 text-xs">Edit</button><button onClick={onDelete} className="rounded-full border border-border px-3 py-1 text-xs text-destructive">Delete</button></div>; }
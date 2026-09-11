import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";
import {
  bulkGenerateCoupons,
  deleteCampaign,
  discountAnalytics,
  duplicateCoupon,
  getDiscountSettings,
  listAuditLog,
  listCampaigns,
  listCoupons,
  saveCampaign,
  saveCoupon,
  setCampaignActive,
  updateCouponFlags,
  updateDiscountSettings,
} from "@/lib/promotions.functions";

export const Route = createFileRoute("/_authenticated/admin/discounts")({
  head: () => ({
    meta: [
      { title: "Discounts & Coupons — Sakhi Suta Admin" },
      { name: "description", content: "Manage automatic discounts, loyalty rewards, festive campaigns and coupon codes." },
    ],
  }),
  component: DiscountsAdmin,
});

type Tab = "settings" | "campaigns" | "coupons" | "analytics";

function DiscountsAdmin() {
  const [tab, setTab] = useState<Tab>("settings");
  const tabs: [Tab, string][] = [
    ["settings", "Rules & Loyalty"],
    ["campaigns", "Campaigns"],
    ["coupons", "Coupons"],
    ["analytics", "Analytics"],
  ];
  return (
    <div>
      <h1 className="font-serif text-4xl">Discounts, Loyalty & Coupons</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Every rule here is applied and re-verified on the server at checkout — customers can never
        alter a price from the browser.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm gold-border ${
              tab === t ? "bg-primary text-primary-foreground border-primary" : "hover:bg-primary/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-8">
        {tab === "settings" && <SettingsTab />}
        {tab === "campaigns" && <CampaignsTab />}
        {tab === "coupons" && <CouponsTab />}
        {tab === "analytics" && <AnalyticsTab />}
      </div>
    </div>
  );
}

/* ---------- shared bits ---------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-input bg-input/40 px-3 py-2 text-sm outline-none focus:border-primary";

function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 py-1 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]"
      />
      <span>
        {label}
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

function toLocal(v: string | null | undefined) {
  if (!v) return "";
  const d = new Date(v);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocal(v: string) {
  return v ? new Date(v).toISOString() : null;
}

/* ---------- settings ---------- */

function SettingsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["discount-settings"], queryFn: () => getDiscountSettings() });
  const [form, setForm] = useState<Record<string, any> | null>(null);
  const state = form ?? (data as Record<string, any> | undefined) ?? null;

  const save = useMutation({
    mutationFn: (payload: Record<string, any>) => updateDiscountSettings({ data: payload }),
    onSuccess: () => {
      toast.success("Discount rules saved");
      qc.invalidateQueries({ queryKey: ["discount-settings"] });
      setForm(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !state) return <p className="text-muted-foreground">Loading rules…</p>;
  const set = (k: string, v: unknown) => setForm({ ...state, [k]: v });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl glass p-6">
        <h2 className="font-serif text-2xl">Automatic cart discount</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Applies to every customer when the cart crosses the threshold.
        </p>
        <div className="mt-4 space-y-3">
          <Toggle label="Enabled" checked={!!state.auto_enabled} onChange={(v) => set("auto_enabled", v)} />
          <Field label="Minimum cart value (₹)">
            <input
              type="number"
              className={inputCls}
              value={state.auto_min_subtotal_inr ?? 0}
              onChange={(e) => set("auto_min_subtotal_inr", Number(e.target.value))}
            />
          </Field>
          <Field label="Discount percent">
            <input
              type="number"
              step="0.5"
              className={inputCls}
              value={state.auto_percent ?? 0}
              onChange={(e) => set("auto_percent", Number(e.target.value))}
            />
          </Field>
          <Field label="Maximum discount cap (₹, blank = no cap)">
            <input
              type="number"
              className={inputCls}
              value={state.auto_max_discount_inr ?? ""}
              onChange={(e) => set("auto_max_discount_inr", e.target.value === "" ? null : Number(e.target.value))}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Starts (optional)">
              <input
                type="datetime-local"
                className={inputCls}
                value={toLocal(state.auto_start_at)}
                onChange={(e) => set("auto_start_at", fromLocal(e.target.value))}
              />
            </Field>
            <Field label="Ends (optional)">
              <input
                type="datetime-local"
                className={inputCls}
                value={toLocal(state.auto_end_at)}
                onChange={(e) => set("auto_end_at", fromLocal(e.target.value))}
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="rounded-xl glass p-6">
        <h2 className="font-serif text-2xl">Returning customer reward</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Granted automatically to customers with a previous successful order.
        </p>
        <div className="mt-4 space-y-3">
          <Toggle
            label="Enabled"
            checked={!!state.returning_enabled}
            onChange={(v) => set("returning_enabled", v)}
          />
          <Field label="Discount percent">
            <input
              type="number"
              step="0.5"
              className={inputCls}
              value={state.returning_percent ?? 0}
              onChange={(e) => set("returning_percent", Number(e.target.value))}
            />
          </Field>
          <Field label="Minimum past orders to qualify">
            <input
              type="number"
              className={inputCls}
              value={state.returning_min_orders ?? 1}
              onChange={(e) => set("returning_min_orders", Number(e.target.value))}
            />
          </Field>
          <Field label="Minimum cart value (₹)">
            <input
              type="number"
              className={inputCls}
              value={state.returning_min_subtotal_inr ?? 0}
              onChange={(e) => set("returning_min_subtotal_inr", Number(e.target.value))}
            />
          </Field>
          <Field label="Maximum discount cap (₹, blank = no cap)">
            <input
              type="number"
              className={inputCls}
              value={state.returning_max_discount_inr ?? ""}
              onChange={(e) =>
                set("returning_max_discount_inr", e.target.value === "" ? null : Number(e.target.value))
              }
            />
          </Field>
        </div>
      </section>

      <section className="rounded-xl glass p-6 lg:col-span-2">
        <h2 className="font-serif text-2xl">Stacking rules</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          When two offers may not combine, the server keeps whichever is worth more to the customer.
        </p>
        <div className="mt-4 grid gap-1 sm:grid-cols-2">
          <Toggle
            label="Automatic + returning reward"
            checked={!!state.stack_auto_with_returning}
            onChange={(v) => set("stack_auto_with_returning", v)}
          />
          <Toggle
            label="Automatic + campaign"
            checked={!!state.stack_auto_with_campaign}
            onChange={(v) => set("stack_auto_with_campaign", v)}
          />
          <Toggle
            label="Automatic + coupon"
            checked={!!state.stack_auto_with_coupon}
            onChange={(v) => set("stack_auto_with_coupon", v)}
          />
          <Toggle
            label="Returning reward + campaign"
            checked={!!state.stack_returning_with_campaign}
            onChange={(v) => set("stack_returning_with_campaign", v)}
          />
          <Toggle
            label="Returning reward + coupon"
            checked={!!state.stack_returning_with_coupon}
            onChange={(v) => set("stack_returning_with_coupon", v)}
          />
          <Toggle
            label="Campaign + coupon"
            checked={!!state.stack_campaign_with_coupon}
            onChange={(v) => set("stack_campaign_with_coupon", v)}
          />
        </div>
      </section>

      <div className="lg:col-span-2">
        <button
          disabled={save.isPending || !form}
          onClick={() => form && save.mutate(form)}
          className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {save.isPending ? "Saving…" : "Save rules"}
        </button>
      </div>
    </div>
  );
}

/* ---------- campaigns ---------- */

const emptyCampaign = {
  name: "",
  description: "",
  percent: 10,
  fixed_inr: 0,
  min_subtotal_inr: 0,
  max_discount_inr: null as number | null,
  audience: "all" as const,
  start_at: null as string | null,
  end_at: null as string | null,
  active: false,
  priority: 0,
  stackable: false,
  overrides_other_discounts: false,
  product_ids: [] as string[],
  saree_types: [] as string[],
};

/** Pick the exact products an extra percentage discount applies to. */
function ProductPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products-for-discounts"],
    queryFn: () => adminListProducts(),
  });
  const [q, setQ] = useState("");
  const products = (data ?? []) as Record<string, any>[];
  const term = q.trim().toLowerCase();
  const visible = term
    ? products.filter((p) => String(p.name).toLowerCase().includes(term))
    : products;
  const toggleId = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className="mt-4 rounded-xl gold-border p-4">
      <p className="font-serif text-lg">Extra discount on specific products</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Leave empty to apply to the whole cart. Choose products to give an additional{" "}
        {Number.isFinite(Number(selected.length)) ? "" : ""}percentage off only on those products at
        checkout.
      </p>
      <input
        className={`${inputCls} mt-3`}
        placeholder="Search products…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selected.map((id) => {
            const p = products.find((x) => x.id === id);
            return (
              <button
                key={id}
                onClick={() => toggleId(id)}
                className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground"
              >
                {p ? String(p.name) : "Product"} ✕
              </button>
            );
          })}
          <button onClick={() => onChange([])} className="rounded-full gold-border px-3 py-1 text-xs">
            Clear all
          </button>
        </div>
      )}
      <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading products…</p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">No products found.</p>
        ) : (
          visible.map((p) => (
            <label
              key={p.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-primary/10"
            >
              <input
                type="checkbox"
                checked={selected.includes(p.id)}
                onChange={() => toggleId(p.id)}
              />
              {Array.isArray(p.images) && p.images[0] ? (
                <img src={p.images[0]} alt="" className="h-10 w-8 rounded object-cover" />
              ) : null}
              <span className="text-sm">{String(p.name)}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {formatINR(Number(p.price_inr))}
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

function CampaignsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-campaigns"], queryFn: () => listCampaigns() });
  const [draft, setDraft] = useState<Record<string, any> | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-campaigns"] });
  const save = useMutation({
    mutationFn: (payload: Record<string, any>) => saveCampaign({ data: payload as never }),
    onSuccess: () => {
      toast.success("Campaign saved");
      setDraft(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggle = useMutation({
    mutationFn: (v: { id: string; active: boolean }) => setCampaignActive({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteCampaign({ data: { id } }),
    onSuccess: () => {
      toast.success("Campaign deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (data ?? []) as Record<string, any>[];

  return (
    <div className="space-y-6">
      <button
        onClick={() => setDraft({ ...emptyCampaign })}
        className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground"
      >
        New campaign
      </button>

      {draft && (
        <div className="rounded-xl glass p-6">
          <h3 className="font-serif text-2xl">{draft.id ? "Edit campaign" : "New campaign"}</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <input className={inputCls} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <Field label="Audience">
              <select
                className={inputCls}
                value={draft.audience}
                onChange={(e) => setDraft({ ...draft, audience: e.target.value })}
              >
                <option value="all">Everyone</option>
                <option value="first_order">First-time customers</option>
                <option value="returning">Returning customers</option>
              </select>
            </Field>
            <Field label="Discount percent">
              <input
                type="number"
                step="0.5"
                className={inputCls}
                value={draft.percent}
                onChange={(e) => setDraft({ ...draft, percent: Number(e.target.value) })}
              />
            </Field>
            <Field label="Flat discount (₹)">
              <input
                type="number"
                className={inputCls}
                value={draft.fixed_inr}
                onChange={(e) => setDraft({ ...draft, fixed_inr: Number(e.target.value) })}
              />
            </Field>
            <Field label="Minimum cart (₹)">
              <input
                type="number"
                className={inputCls}
                value={draft.min_subtotal_inr}
                onChange={(e) => setDraft({ ...draft, min_subtotal_inr: Number(e.target.value) })}
              />
            </Field>
            <Field label="Maximum discount cap (₹)">
              <input
                type="number"
                className={inputCls}
                value={draft.max_discount_inr ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, max_discount_inr: e.target.value === "" ? null : Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Starts">
              <input
                type="datetime-local"
                className={inputCls}
                value={toLocal(draft.start_at)}
                onChange={(e) => setDraft({ ...draft, start_at: fromLocal(e.target.value) })}
              />
            </Field>
            <Field label="Ends">
              <input
                type="datetime-local"
                className={inputCls}
                value={toLocal(draft.end_at)}
                onChange={(e) => setDraft({ ...draft, end_at: fromLocal(e.target.value) })}
              />
            </Field>
            <Field label="Priority (higher wins)">
              <input
                type="number"
                className={inputCls}
                value={draft.priority}
                onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) })}
              />
            </Field>
            <Field label="Description">
              <input
                className={inputCls}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-3 grid gap-1 sm:grid-cols-3">
            <Toggle label="Active" checked={!!draft.active} onChange={(v) => setDraft({ ...draft, active: v })} />
            <Toggle
              label="Stackable with other offers"
              checked={!!draft.stackable}
              onChange={(v) => setDraft({ ...draft, stackable: v })}
            />
            <Toggle
              label="Overrides all other discounts"
              checked={!!draft.overrides_other_discounts}
              onChange={(v) => setDraft({ ...draft, overrides_other_discounts: v })}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              disabled={save.isPending || draft.name.trim().length < 2}
              onClick={() => save.mutate(draft)}
              className="rounded-full bg-primary px-6 py-2 text-sm text-primary-foreground disabled:opacity-50"
            >
              Save campaign
            </button>
            <button onClick={() => setDraft(null)} className="rounded-full gold-border px-6 py-2 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading campaigns…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground">No campaigns yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl glass p-4">
              <div>
                <p className="font-serif text-lg">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.percent > 0 ? `${c.percent}% off` : `${formatINR(c.fixed_inr)} off`} ·{" "}
                  {c.audience === "all" ? "everyone" : c.audience.replace("_", " ")} · priority {c.priority}
                  {c.end_at ? ` · ends ${new Date(c.end_at).toLocaleDateString()}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${c.active ? "text-primary" : "text-muted-foreground"}`}>
                  {c.active ? "Active" : "Paused"}
                </span>
                <button
                  onClick={() => toggle.mutate({ id: c.id, active: !c.active })}
                  className="rounded-full gold-border px-4 py-1.5 text-xs"
                >
                  {c.active ? "Pause" : "Activate"}
                </button>
                <button onClick={() => setDraft({ ...c })} className="rounded-full gold-border px-4 py-1.5 text-xs">
                  Edit
                </button>
                <button
                  onClick={() => remove.mutate(c.id)}
                  className="rounded-full px-4 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- coupons ---------- */

const emptyCoupon = {
  code: "",
  name: "",
  description: "",
  percent: 10,
  fixed_inr: 0,
  max_discount_inr: null as number | null,
  min_cart_inr: 0,
  max_cart_inr: null as number | null,
  audience: "all" as const,
  usage_limit: null as number | null,
  per_customer_limit: 1,
  start_at: null as string | null,
  end_at: null as string | null,
  active: true,
  archived: false,
  combine_with_auto: false,
  combine_with_campaign: false,
  combine_with_returning: false,
  priority: 0,
};

function CouponsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-coupons"], queryFn: () => listCoupons() });
  const [draft, setDraft] = useState<Record<string, any> | null>(null);
  const [bulk, setBulk] = useState<Record<string, any> | null>(null);
  const [generated, setGenerated] = useState<string[]>([]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  const save = useMutation({
    mutationFn: (payload: Record<string, any>) => saveCoupon({ data: payload as never }),
    onSuccess: () => {
      toast.success("Coupon saved");
      setDraft(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const flags = useMutation({
    mutationFn: (v: { id: string; active?: boolean; archived?: boolean }) => updateCouponFlags({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });
  const dupe = useMutation({
    mutationFn: (id: string) => duplicateCoupon({ data: { id } }),
    onSuccess: () => {
      toast.success("Coupon duplicated (paused)");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const gen = useMutation({
    mutationFn: (payload: Record<string, any>) => bulkGenerateCoupons({ data: payload as never }),
    onSuccess: (res: { codes: string[] }) => {
      setGenerated(res.codes);
      setBulk(null);
      toast.success(`${res.codes.length} coupons generated`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (data ?? []) as Record<string, any>[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setDraft({ ...emptyCoupon })}
          className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground"
        >
          New coupon
        </button>
        <button
          onClick={() =>
            setBulk({
              prefix: "",
              count: 25,
              length: 6,
              percent: 10,
              fixed_inr: 0,
              min_cart_inr: 0,
              usage_limit: 1,
              per_customer_limit: 1,
              end_at: null,
            })
          }
          className="rounded-full gold-border px-5 py-2 text-sm"
        >
          Bulk generate
        </button>
      </div>

      {generated.length > 0 && (
        <div className="rounded-xl glass p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm">Generated codes</p>
            <div className="flex gap-2">
              <button
                onClick={() => navigator.clipboard?.writeText(generated.join("\n"))}
                className="rounded-full gold-border px-4 py-1.5 text-xs"
              >
                Copy all
              </button>
              <button onClick={() => setGenerated([])} className="rounded-full gold-border px-4 py-1.5 text-xs">
                Dismiss
              </button>
            </div>
          </div>
          <p className="mt-2 break-words font-mono text-xs text-muted-foreground">{generated.join(", ")}</p>
        </div>
      )}

      {bulk && (
        <div className="rounded-xl glass p-6">
          <h3 className="font-serif text-2xl">Bulk generate coupons</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Field label="Code prefix (optional)">
              <input className={inputCls} value={bulk.prefix} onChange={(e) => setBulk({ ...bulk, prefix: e.target.value })} />
            </Field>
            <Field label="How many">
              <input
                type="number"
                className={inputCls}
                value={bulk.count}
                onChange={(e) => setBulk({ ...bulk, count: Number(e.target.value) })}
              />
            </Field>
            <Field label="Random part length">
              <input
                type="number"
                className={inputCls}
                value={bulk.length}
                onChange={(e) => setBulk({ ...bulk, length: Number(e.target.value) })}
              />
            </Field>
            <Field label="Percent off">
              <input
                type="number"
                step="0.5"
                className={inputCls}
                value={bulk.percent}
                onChange={(e) => setBulk({ ...bulk, percent: Number(e.target.value) })}
              />
            </Field>
            <Field label="Flat off (₹)">
              <input
                type="number"
                className={inputCls}
                value={bulk.fixed_inr}
                onChange={(e) => setBulk({ ...bulk, fixed_inr: Number(e.target.value) })}
              />
            </Field>
            <Field label="Minimum cart (₹)">
              <input
                type="number"
                className={inputCls}
                value={bulk.min_cart_inr}
                onChange={(e) => setBulk({ ...bulk, min_cart_inr: Number(e.target.value) })}
              />
            </Field>
            <Field label="Total uses per code">
              <input
                type="number"
                className={inputCls}
                value={bulk.usage_limit ?? ""}
                onChange={(e) => setBulk({ ...bulk, usage_limit: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </Field>
            <Field label="Uses per customer">
              <input
                type="number"
                className={inputCls}
                value={bulk.per_customer_limit}
                onChange={(e) => setBulk({ ...bulk, per_customer_limit: Number(e.target.value) })}
              />
            </Field>
            <Field label="Expires">
              <input
                type="datetime-local"
                className={inputCls}
                value={toLocal(bulk.end_at)}
                onChange={(e) => setBulk({ ...bulk, end_at: fromLocal(e.target.value) })}
              />
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              disabled={gen.isPending}
              onClick={() => gen.mutate(bulk)}
              className="rounded-full bg-primary px-6 py-2 text-sm text-primary-foreground disabled:opacity-50"
            >
              {gen.isPending ? "Generating…" : "Generate"}
            </button>
            <button onClick={() => setBulk(null)} className="rounded-full gold-border px-6 py-2 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {draft && (
        <div className="rounded-xl glass p-6">
          <h3 className="font-serif text-2xl">{draft.id ? `Edit ${draft.code}` : "New coupon"}</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Code">
              <input
                className={`${inputCls} uppercase`}
                value={draft.code}
                onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
              />
            </Field>
            <Field label="Internal name">
              <input className={inputCls} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <Field label="Percent off">
              <input
                type="number"
                step="0.5"
                className={inputCls}
                value={draft.percent}
                onChange={(e) => setDraft({ ...draft, percent: Number(e.target.value) })}
              />
            </Field>
            <Field label="Flat off (₹)">
              <input
                type="number"
                className={inputCls}
                value={draft.fixed_inr}
                onChange={(e) => setDraft({ ...draft, fixed_inr: Number(e.target.value) })}
              />
            </Field>
            <Field label="Maximum discount cap (₹)">
              <input
                type="number"
                className={inputCls}
                value={draft.max_discount_inr ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, max_discount_inr: e.target.value === "" ? null : Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Audience">
              <select
                className={inputCls}
                value={draft.audience}
                onChange={(e) => setDraft({ ...draft, audience: e.target.value })}
              >
                <option value="all">Everyone</option>
                <option value="first_order">First-time customers</option>
                <option value="returning">Returning customers</option>
              </select>
            </Field>
            <Field label="Minimum cart (₹)">
              <input
                type="number"
                className={inputCls}
                value={draft.min_cart_inr}
                onChange={(e) => setDraft({ ...draft, min_cart_inr: Number(e.target.value) })}
              />
            </Field>
            <Field label="Maximum cart (₹, optional)">
              <input
                type="number"
                className={inputCls}
                value={draft.max_cart_inr ?? ""}
                onChange={(e) => setDraft({ ...draft, max_cart_inr: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </Field>
            <Field label="Total uses (blank = unlimited)">
              <input
                type="number"
                className={inputCls}
                value={draft.usage_limit ?? ""}
                onChange={(e) => setDraft({ ...draft, usage_limit: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </Field>
            <Field label="Uses per customer">
              <input
                type="number"
                className={inputCls}
                value={draft.per_customer_limit}
                onChange={(e) => setDraft({ ...draft, per_customer_limit: Number(e.target.value) })}
              />
            </Field>
            <Field label="Starts">
              <input
                type="datetime-local"
                className={inputCls}
                value={toLocal(draft.start_at)}
                onChange={(e) => setDraft({ ...draft, start_at: fromLocal(e.target.value) })}
              />
            </Field>
            <Field label="Expires">
              <input
                type="datetime-local"
                className={inputCls}
                value={toLocal(draft.end_at)}
                onChange={(e) => setDraft({ ...draft, end_at: fromLocal(e.target.value) })}
              />
            </Field>
          </div>
          <div className="mt-3 grid gap-1 sm:grid-cols-2">
            <Toggle label="Active" checked={!!draft.active} onChange={(v) => setDraft({ ...draft, active: v })} />
            <Toggle
              label="Combines with automatic cart discount"
              checked={!!draft.combine_with_auto}
              onChange={(v) => setDraft({ ...draft, combine_with_auto: v })}
            />
            <Toggle
              label="Combines with campaigns"
              checked={!!draft.combine_with_campaign}
              onChange={(v) => setDraft({ ...draft, combine_with_campaign: v })}
            />
            <Toggle
              label="Combines with returning reward"
              checked={!!draft.combine_with_returning}
              onChange={(v) => setDraft({ ...draft, combine_with_returning: v })}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              disabled={save.isPending || draft.code.trim().length < 3}
              onClick={() => save.mutate(draft)}
              className="rounded-full bg-primary px-6 py-2 text-sm text-primary-foreground disabled:opacity-50"
            >
              Save coupon
            </button>
            <button onClick={() => setDraft(null)} className="rounded-full gold-border px-6 py-2 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading coupons…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground">No coupons yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl glass">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Value</th>
                <th className="p-3">Used</th>
                <th className="p-3">Expiry</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-border/50">
                  <td className="p-3 font-mono">{c.code}</td>
                  <td className="p-3">{c.percent > 0 ? `${c.percent}%` : formatINR(c.fixed_inr)}</td>
                  <td className="p-3">
                    {c.used_count ?? 0}
                    {c.usage_limit ? ` / ${c.usage_limit}` : ""}
                  </td>
                  <td className="p-3">{c.end_at ? new Date(c.end_at).toLocaleDateString() : "—"}</td>
                  <td className="p-3">
                    {c.archived ? "Archived" : c.active ? <span className="text-primary">Active</span> : "Paused"}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        onClick={() => flags.mutate({ id: c.id, active: !c.active })}
                        className="rounded-full gold-border px-3 py-1 text-xs"
                      >
                        {c.active ? "Pause" : "Activate"}
                      </button>
                      <button onClick={() => setDraft({ ...c })} className="rounded-full gold-border px-3 py-1 text-xs">
                        Edit
                      </button>
                      <button onClick={() => dupe.mutate(c.id)} className="rounded-full gold-border px-3 py-1 text-xs">
                        Duplicate
                      </button>
                      <button
                        onClick={() => flags.mutate({ id: c.id, archived: !c.archived })}
                        className="rounded-full px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
                      >
                        {c.archived ? "Restore" : "Archive"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------- analytics ---------- */

function AnalyticsTab() {
  const { data, isLoading } = useQuery({ queryKey: ["discount-analytics"], queryFn: () => discountAnalytics() });
  const { data: log } = useQuery({ queryKey: ["discount-audit"], queryFn: () => listAuditLog() });
  if (isLoading || !data) return <p className="text-muted-foreground">Loading analytics…</p>;

  const cards = [
    ["Total discount given", formatINR(data.totalDiscount)],
    ["Orders with an offer", String(data.totalPromoOrders)],
    ["Coupon redemptions", String(data.totalRedemptions)],
    ["Revenue from coupon orders", formatINR(data.couponRevenue)],
  ] as const;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-xl glass p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="mt-2 font-serif text-2xl text-primary">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl glass p-6">
          <h3 className="font-serif text-xl">Most used coupons</h3>
          {data.topCoupons.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No redemptions yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {data.topCoupons.map((c) => (
                <li key={c.code} className="flex justify-between">
                  <span className="font-mono">{c.code}</span>
                  <span className="text-muted-foreground">
                    {c.uses} uses · {formatINR(c.discount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl glass p-6">
          <h3 className="font-serif text-xl">Campaign performance</h3>
          {data.campaignUsage.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No campaign discounts yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {data.campaignUsage.map((c) => (
                <li key={c.name} className="flex justify-between">
                  <span>{c.name}</span>
                  <span className="text-muted-foreground">
                    {c.uses} orders · {formatINR(c.discount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl glass p-6">
          <h3 className="font-serif text-xl">Discount usage by day</h3>
          {data.usageByDate.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Nothing to show yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {data.usageByDate.map((d) => (
                <li key={d.date} className="flex justify-between">
                  <span>{new Date(d.date).toLocaleDateString()}</span>
                  <span className="text-muted-foreground">
                    {d.orders} orders · {formatINR(d.discount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl glass p-6">
          <h3 className="font-serif text-xl">Campaign calendar</h3>
          <div className="mt-3 space-y-3 text-sm">
            {(
              [
                ["Running now", data.activeCampaigns],
                ["Scheduled", data.upcomingCampaigns],
                ["Expired", data.expiredCampaigns],
              ] as const
            ).map(([label, list]) => (
              <div key={label}>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
                {list.length === 0 ? (
                  <p className="text-muted-foreground">—</p>
                ) : (
                  <ul>
                    {list.map((c) => (
                      <li key={c.id}>{c.name}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-xl glass p-6">
        <h3 className="font-serif text-xl">Recent admin changes</h3>
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {((log ?? []) as Record<string, any>[]).map((l) => (
            <li key={l.id}>
              {new Date(l.created_at).toLocaleString()} — {l.action.replace(/_/g, " ")}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

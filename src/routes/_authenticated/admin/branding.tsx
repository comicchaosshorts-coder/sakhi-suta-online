import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getSiteSettings } from "@/lib/site.functions";
import { updateSiteSettings, uploadMapSvg } from "@/lib/admin.functions";
import { SocialSettingsEditor } from "@/components/site/SocialSettingsEditor";
import { parseSocialSettings } from "@/lib/social-settings";

export const Route = createFileRoute("/_authenticated/admin/branding")({
  head: () => ({ meta: [
    { title: "Branding & Social Settings — Sakhi Suta" },
    { name: "description", content: "Manage Sakhi Suta branding, India map, and official social links." },
    { property: "og:title", content: "Branding & Social Settings — Sakhi Suta" },
    { property: "og:description", content: "Manage Sakhi Suta branding and official social links." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Branding,
});

function Branding() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["settings"], queryFn: () => getSiteSettings() });
  const [msg, setMsg] = useState<string | null>(null);
  const [brand, setBrand] = useState("");
  const [tagline, setTagline] = useState("");

  const s = q.data;
  const social = parseSocialSettings(s?.social_widget);
  if (s && brand === "" && s.brand_name) {
    // seed once
    setBrand(s.brand_name);
    setTagline(s.tagline);
  }

  async function saveText() {
    await updateSiteSettings({ data: { brand_name: brand, tagline } });
    setMsg("Brand text saved.");
    qc.invalidateQueries();
  }

  async function onSvg(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setMsg("Uploading map…");
    const svg = await f.text();
    await uploadMapSvg({ data: { svg } });
    setMsg("India map uploaded. It will appear on the site immediately.");
    qc.invalidateQueries();
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Branding</h1>
        <p className="mt-2 text-sm text-muted-foreground">Edit brand text and upload the India SVG.</p>
      </div>

      <div className="rounded-2xl glass p-6">
        <h2 className="font-serif text-2xl">Brand</h2>
        <label className="mt-4 block text-sm">
          Brand name
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-input/40 px-3 py-2"
          />
        </label>
        <label className="mt-4 block text-sm">
          Tagline
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-input/40 px-3 py-2"
          />
        </label>
        <button
          onClick={saveText}
          className="mt-4 rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground hover:bg-primary-glow"
        >
          Save
        </button>
      </div>

      <div className="rounded-2xl glass p-6">
        <h2 className="font-serif text-2xl">India map</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload a clean India SVG where each state is a <code>&lt;path&gt;</code> with an{" "}
          <code>id</code> or <code>data-name</code> matching the state name (e.g.{" "}
          <code>id="odisha"</code>, <code>data-name="West Bengal"</code>). The map will
          auto-wire clicks to each state's collection.
        </p>
        <input
          type="file"
          accept="image/svg+xml,.svg"
          onChange={onSvg}
          className="mt-4 block w-full text-sm"
        />
        {s?.map_svg_url && (
          <p className="mt-2 text-xs text-muted-foreground">
            Current map file: {s.map_svg_url}
          </p>
        )}
      </div>

      {social && <SocialSettingsEditor key={JSON.stringify(social)} initial={social} />}
      {msg && <p className="text-sm text-primary">{msg}</p>}
    </div>
  );
}

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { updateSiteSettings } from "@/lib/admin.functions";
import { SOCIAL_PLATFORMS, socialSettingsSchema, type SocialSettings } from "@/lib/social-settings";

export function SocialSettingsEditor({ initial }: { initial: SocialSettings }) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const saveSettings = useServerFn(updateSiteSettings);
  const qc = useQueryClient();
  return <form className="rounded-lg glass p-6 space-y-4" onSubmit={async (event) => {
    event.preventDefault();
    const parsed = socialSettingsSchema.safeParse(settings);
    if (!parsed.success) { setMessage(parsed.error.issues[0]?.message ?? "Check the social links."); return; }
    setSaving(true); setMessage("");
    try { await saveSettings({ data: { social_widget: parsed.data } }); await qc.invalidateQueries({ queryKey: ["settings"] }); setMessage("Social links saved."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save. Try again."); }
    finally { setSaving(false); }
  }}>
    <h2 className="font-serif text-2xl">Floating social links</h2>
    <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={settings.enabled} onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })} />Enable social launcher</label>
    <label className="block text-sm">Position<select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" value={settings.position} onChange={(e) => setSettings({ ...settings, position: e.target.value === "right" ? "right" : "left" })}><option value="left">Left</option><option value="right">Right</option></select></label>
    {SOCIAL_PLATFORMS.map((platform) => <fieldset key={platform} className="space-y-2 border-t border-border pt-4">
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={settings[platform].enabled} onChange={(e) => setSettings({ ...settings, [platform]: { ...settings[platform], enabled: e.target.checked } })} /><span className="capitalize">{platform}</span></label>
      <label className="block text-sm"><span className="capitalize">{platform}</span> destination URL<input type="url" value={settings[platform].url} onChange={(e) => setSettings({ ...settings, [platform]: { ...settings[platform], url: e.target.value } })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" placeholder="Official HTTPS destination" /></label>
    </fieldset>)}
    <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save social links"}</Button>
    {message && <p className="text-sm text-primary" role="status">{message}</p>}
  </form>;
}
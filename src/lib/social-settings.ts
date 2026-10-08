import { z } from "zod";

export const SOCIAL_PLATFORMS = ["whatsapp", "facebook", "instagram"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export function isSocialUrl(platform: SocialPlatform, value: string) {
  try {
    const url = new URL(value);
    const hosts = {
      whatsapp: ["wa.me", "api.whatsapp.com", "web.whatsapp.com", "chat.whatsapp.com"],
      facebook: ["facebook.com", "www.facebook.com", "m.facebook.com", "fb.com"],
      instagram: ["instagram.com", "www.instagram.com"],
    };
    return url.protocol === "https:" && !url.username && !url.password && hosts[platform].includes(url.hostname) && url.pathname !== "/";
  } catch { return false; }
}

const linkSchema = (platform: SocialPlatform) => z.object({
  enabled: z.boolean(),
  url: z.string().trim().max(1000).refine((url) => url === "" || isSocialUrl(platform, url), `Enter a valid HTTPS ${platform} destination.`),
}).refine((link) => !link.enabled || link.url !== "", "An enabled icon needs a destination.");

export const socialSettingsSchema = z.object({
  enabled: z.boolean(),
  position: z.enum(["left", "right"]),
  whatsapp: linkSchema("whatsapp"),
  facebook: linkSchema("facebook"),
  instagram: linkSchema("instagram"),
});
export type SocialSettings = z.infer<typeof socialSettingsSchema>;
export function parseSocialSettings(value: unknown): SocialSettings | null {
  const result = socialSettingsSchema.safeParse(value);
  return result.success ? result.data : null;
}
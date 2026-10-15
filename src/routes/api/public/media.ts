import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_BUCKETS = new Set(["product-images", "brand-assets"]);

export const Route = createFileRoute("/api/public/media")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const bucket = url.searchParams.get("bucket") ?? "";
        const key = url.searchParams.get("key") ?? "";
        const requestedWidth = url.searchParams.get("width");
        const width = requestedWidth === null ? undefined : Number(requestedWidth);

        if (!ALLOWED_BUCKETS.has(bucket) || !key || key.length > 500 || key.includes("..") ||
          (width !== undefined && (!Number.isInteger(width) || width < 64 || width > 2560))) {
          return new Response("Not found", { status: 404 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const storage = supabaseAdmin.storage.from(bucket);
        let data: Blob | null = null;
        const base = process.env.SUPABASE_URL;
        const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (width && base && secret) {
          try {
            const transformed = await fetch(`${base}/storage/v1/render/image/authenticated/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}?width=${width}&resize=contain&quality=85`, {
              headers: { apikey: secret, Authorization: `Bearer ${secret}`, Accept: "image/webp" },
              signal: AbortSignal.timeout(5000),
            });
            if (transformed.ok) data = await transformed.blob();
          } catch { /* Keep original delivery working if resizing is unavailable. */ }
        }
        let fallback = false;
        if (!data) {
          const original = await storage.download(key);
          data = original.data;
          fallback = width !== undefined;
        }
        if (!data) return new Response("Not found", { status: 404 });

        // Admin uploads use unique timestamp keys; replacements receive new URLs.
        const versioned = /^\d{13}-/.test(key);
        const cacheControl = versioned && !fallback
          ? "public, max-age=31536000, immutable"
          : "public, max-age=300, stale-while-revalidate=60";
        const digest = await crypto.subtle.digest("SHA-256", await data.arrayBuffer());
        const etag = `"${Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("")}"`;
        const headers = {
          "Content-Type": data.type || "application/octet-stream",
          "Cache-Control": cacheControl,
          "CDN-Cache-Control": cacheControl,
          "ETag": etag,
          "X-Content-Type-Options": "nosniff",
        };
        if (request.headers.get("If-None-Match") === etag) return new Response(null, { status: 304, headers });

        return new Response(data, {
          headers,
        });
      },
    },
  },
});
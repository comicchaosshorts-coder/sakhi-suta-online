import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_BUCKETS = new Set(["product-images", "brand-assets"]);

export const Route = createFileRoute("/api/public/media")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const bucket = url.searchParams.get("bucket") ?? "";
        const key = url.searchParams.get("key") ?? "";

        if (!ALLOWED_BUCKETS.has(bucket) || !key || key.length > 500 || key.includes("..")) {
          return new Response("Not found", { status: 404 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from(bucket).download(key);
        if (error || !data) return new Response("Not found", { status: 404 });

        return new Response(data, {
          headers: {
            "Content-Type": data.type || "application/octet-stream",
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
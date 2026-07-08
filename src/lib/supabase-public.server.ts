// Server-only publishable Supabase client for public read-only Data API calls.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export function createPublicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

// Convert a stored image reference (either a full URL or a bucket key)
// into a viewable URL. Signs private-bucket keys.
export async function resolveImage(
  supabase: SupabaseClient<Database>,
  ref: string,
  bucket = "product-images",
): Promise<string> {
  if (!ref) return "";
  if (/^https?:\/\//i.test(ref)) return ref;
  const key = ref.startsWith(`${bucket}/`) ? ref.slice(bucket.length + 1) : ref;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(key, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? "";
}

export async function resolveImages(
  supabase: SupabaseClient<Database>,
  refs: string[] | null | undefined,
  bucket = "product-images",
): Promise<string[]> {
  if (!refs || refs.length === 0) return [];
  return Promise.all(refs.map((r) => resolveImage(supabase, r, bucket)));
}

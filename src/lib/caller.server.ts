import { getRequestHeader } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Optional-auth caller identity, derived from the verified bearer token only. */
export async function resolveCaller() {
  const header = getRequestHeader("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  let userId: string | null = null;
  if (token) {
    const { data } = await supabaseAdmin.auth.getUser(token);
    userId = data.user?.id ?? null;
  }
  return { supabaseAdmin, userId };
}

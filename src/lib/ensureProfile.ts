import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface ProfileRow {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  wins?: number;
  losses?: number;
  pokemmo_nick?: string | null;
  created_at: string;
  updated_at: string;
}

/** Creates the public profile row if the DB trigger did not (e.g. username conflict). */
export async function ensureProfileForUser(authUser: User): Promise<ProfileRow | null> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", authUser.id)
    .maybeSingle();

  if (existing) return existing as ProfileRow;

  const rpc = await supabase.rpc("ensure_user_profile");
  if (!rpc.error && rpc.data) return rpc.data as ProfileRow;

  const meta = authUser.user_metadata as { username?: string; avatar_url?: string };
  let base =
    (typeof meta.username === "string" && meta.username.trim()) ||
    authUser.email?.split("@")[0] ||
    "trainer";
  base = base.trim().slice(0, 24);
  if (base.length < 3) base = "trainer";
  if (base.toLowerCase() === "admin") base = "trainer";

  for (let attempt = 0; attempt < 6; attempt++) {
    const suffix =
      attempt === 0 ? "" : `_${authUser.id.replace(/-/g, "").slice(0, 6)}${attempt > 1 ? attempt : ""}`;
    const username = (attempt === 0 ? base : `${base.slice(0, 16)}${suffix}`).slice(0, 24);

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        user_id: authUser.id,
        username,
        avatar_url: meta.avatar_url ?? null,
        role: "user",
      })
      .select("*")
      .maybeSingle();

    if (data) return data as ProfileRow;
    if (error?.code !== "23505") {
      console.error("Error creating profile:", error.message);
      return null;
    }
  }
  return null;
}

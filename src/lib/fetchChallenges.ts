import { supabase } from "@/integrations/supabase/client";
import type { ChallengeRow, ChallengeWithProfiles } from "@/types/challenges";

export async function attachProfilesToChallenges(
  rows: ChallengeRow[]
): Promise<ChallengeWithProfiles[]> {
  if (rows.length === 0) return [];

  const ids = new Set<string>();
  rows.forEach((r) => {
    ids.add(r.challenger_id);
    if (r.opponent_id) ids.add(r.opponent_id);
  });

  const { data: profs } = await supabase
    .from("profiles")
    .select("user_id, username, pokemmo_nick, avatar_url, wins, losses")
    .in("user_id", Array.from(ids));

  const map = new Map((profs ?? []).map((p) => [p.user_id, p]));

  return rows.map((r) => ({
    ...r,
    challenger: map.get(r.challenger_id),
    opponent: r.opponent_id ? map.get(r.opponent_id) ?? null : null,
  }));
}

export async function fetchChallengeById(id: string): Promise<ChallengeWithProfiles | null> {
  const { data, error } = await supabase.from("challenges").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  const [enriched] = await attachProfilesToChallenges([data as ChallengeRow]);
  return enriched ?? null;
}
